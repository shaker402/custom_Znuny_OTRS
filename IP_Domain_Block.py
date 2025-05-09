import grpc
import yaml
import json
import time
import argparse
import mysql.connector
from mysql.connector import Error
from pyvelociraptor import api_pb2
from pyvelociraptor import api_pb2_grpc
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'database': 'mssp',
    'port': 3306,
    'user': 'root',
    'password': 'the1Esmarta'
}

def setup_database():
    """Initialize database connection and create tables if needed"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        create_table_query = """
        CREATE TABLE IF NOT EXISTS IOCs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            entity VARCHAR(255) NOT NULL,
            host VARCHAR(255) NOT NULL,
            state VARCHAR(20) NOT NULL,
            UNIQUE KEY unique_entity_host (entity, host)
        )
        """
        cursor.execute(create_table_query)
        connection.commit()
        logger.info("Database table initialized successfully")
        
    except Error as e:
        logger.error(f"Database setup error: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def update_ioc(entity, hostname, state):
    """Update IOC database with new operation"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        query = """
        INSERT INTO IOCs (entity, host, state)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE state = VALUES(state)
        """
        values = (entity, hostname, state)
        
        cursor.execute(query, values)
        connection.commit()
        logger.info(f"Updated IOC: {entity}@{hostname} -> {state}")
        
    except Error as e:
        logger.error(f"Database operation failed: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# Existing Velociraptor functions 
# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def setup_connection(config_path):
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        
        creds = grpc.ssl_channel_credentials(
            root_certificates=config["ca_certificate"].encode("utf8"),
            private_key=config["client_private_key"].encode("utf8"),
            certificate_chain=config["client_cert"].encode("utf8"),
        )
        options = (("grpc.ssl_target_name_override", "VelociraptorServer"),)
        channel = grpc.secure_channel(config["api_connection_string"], creds, options)
        return channel
    except Exception as e:
        logger.error(f"Connection setup failed: {str(e)}", exc_info=True)
        return None

def list_all_clients(channel):
    try:
        stub = api_pb2_grpc.APIStub(channel)
        query = """
        SELECT client_id,
               if(condition=os_info,
                  then=os_info.system + ' ' + os_info.release,
                  else='Unknown OS') AS os,
               if(condition=os_info,
                  then=os_info.hostname,
                  else='Unknown Host') AS hostname,
               last_seen_at
        FROM clients()
        """
        request = api_pb2.VQLCollectorArgs(
            max_wait=10,
            max_row=100,
            Query=[api_pb2.VQLRequest(VQL=query)],
        )
        
        clients = []
        for response in stub.Query(request):
            if response.Response:
                logger.debug(f"Raw client response: {response.Response}")
                clients.extend(json.loads(response.Response))
        
        logger.info(f"Found {len(clients)} clients")
        return clients
    except Exception as e:
        logger.error(f"Client listing failed: {str(e)}", exc_info=True)
        return []

def execute_powershell_command(channel, client_id, command):
    try:
        stub = api_pb2_grpc.APIStub(channel)
        artifact_name = "Windows.System.PowerShell"
        
        vql_query = f"""
        LET collection = collect_client(
            client_id='{client_id}',
            artifacts=['{artifact_name}'],
            urgent=True,
            spec=dict(`{artifact_name}`=dict(
                Command={json.dumps(command)}
            ))
        )
        SELECT * FROM collection
        """
        logger.debug(f"Executing VQL:\n{vql_query}")

        request = api_pb2.VQLCollectorArgs(
            max_wait=30,
            max_row=1000,
            Query=[api_pb2.VQLRequest(VQL=vql_query)],
        )

        results = []
        try:
            logger.info(f"Initiating gRPC stream for client {client_id}")
            response_stream = stub.Query(request)
            
            for idx, response in enumerate(response_stream):
                logger.debug(f"Response part {idx}:")
                logger.debug(f"  Timestamp: {response.timestamp}")
                logger.debug(f"  Query ID: {response.query_id}")
                
                if response.log:
                    logger.info(f"Server logs: {response.log}")
                    
                if response.Response:
                    logger.debug(f"Raw response data: {response.Response}")
                    try:
                        parsed = json.loads(response.Response)
                        results.extend(parsed)
                        logger.debug(f"Parsed {len(parsed)} rows")
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON: {str(e)}")
                        logger.error(f"Raw content: {response.Response}")
                
                if hasattr(response, 'status') and response.status:
                    logger.info(f"Status: {response.status}")
                else:
                    logger.debug("No status information in response")

        except grpc.RpcError as e:
            logger.error(f"gRPC error: {e.code().name} - {e.details()}", exc_info=True)
            return None

        logger.info(f"Received {len(results)} total results")
        return results if results else None
    
    except Exception as e:
        logger.error(f"Command execution failed: {str(e)}", exc_info=True)
        return None

def get_flow_state(channel, client_id, flow_id):
    stub = api_pb2_grpc.APIStub(channel)
    vql_query = f"""
    LET collection = get_flow(client_id='{client_id}', flow_id='{flow_id}')
    SELECT * FROM collection
    """
    request = api_pb2.VQLCollectorArgs(
        max_wait=10,
        max_row=100,
        Query=[api_pb2.VQLRequest(VQL=vql_query)],
    )

    try:
        response_stream = stub.Query(request)
        for response in response_stream:
            if response.Response:
                return json.loads(response.Response)
    except grpc.RpcError as e:
        logger.error(f"gRPC error: {e.code().name} - {e.details()}", exc_info=True)
        return None

    return None

def validate_client_os(client):
    os_info = client.get('os', '').lower()
    return 'windows' in os_info

def main():
    # Initialize database
    setup_database()
    
    # Existing argument parsing
    parser = argparse.ArgumentParser(description='Manage firewall rules and domain blocks on Velociraptor clients.')
    parser.add_argument('args', nargs='+', help='Either [hostname, action, target] or [action, target]')
    args = parser.parse_args()
    arguments = args.args

    if len(arguments) not in (2, 3):
        parser.error("Invalid number of arguments. Expected 2 or 3 arguments.")
    
    action_choices = ['Block IP', 'Unblock IP', 'Block Domain', 'Unblock Domain']
    
    if len(arguments) == 3:
        hostname, action, target = arguments
    else:
        action, target = arguments
        hostname = None
    
    if action not in action_choices:
        parser.error(f"Invalid action: {action}. Allowed actions: {action_choices}")

    config_path = "/home/admin/my-project/python-scripts/modules/Velociraptor/dependencies/api.config.yaml"
    
    # Existing connection setup
    logger.info("Initializing connection...")
    channel = setup_connection(config_path)
    
    if not channel:
        logger.error("Failed to establish connection")
        return

    try:
        # Existing client processing logic
        logger.info("Fetching client list...")
        clients = list_all_clients(channel)
        
        if not clients:
            logger.warning("No clients available")
            return

        # Determine clients to process (existing logic)
        clients_to_process = []
        if hostname:
            client = next((c for c in clients if c.get('hostname') == hostname), None)
            if not client:
                logger.error(f"Client '{hostname}' not found")
                return
            if validate_client_os(client):
                clients_to_process = [client]
            else:
                logger.error(f"Client '{hostname}' is not a Windows host")
                return
        else:
            clients_to_process = [c for c in clients if validate_client_os(c)]
            logger.info(f"Found {len(clients_to_process)} Windows clients")
            if not clients_to_process:
                logger.error("No Windows clients available")
                return

        # Generate command based on action (existing logic)
        if action == 'Block IP':
            command = f'Start-Process -NoNewWindow -Wait -FilePath "netsh" -ArgumentList \'advfirewall firewall add rule name="IPBlockRule" dir=out action=block remoteip={target}\''
        elif action == 'Unblock IP':
            command = f'Start-Process -NoNewWindow -Wait -FilePath "netsh" -ArgumentList \'advfirewall firewall delete rule name="IPBlockRule" dir=out remoteip={target}\''
        elif action == 'Block Domain':
            command = f'''$domain = "{target}"
$hostsPath = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"
$entry = "127.0.0.1`t$domain"

if (-not (Select-String -Path $hostsPath -Pattern "$domain" -Quiet)) {{
    Add-Content -Path $hostsPath -Value $entry
    Write-Output "Added block for $domain in hosts file."
}} else {{
    Write-Output "$domain is already blocked in hosts file."
}}

ipconfig /flushdns
Write-Output "DNS cache flushed."
'''
        elif action == 'Unblock Domain':
            command = f'''$domain = "{target}"
$hostsPath = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"

(Get-Content $hostsPath) |
    Where-Object {{ $_ -notmatch "$domain" }} |
    Out-File -FilePath $hostsPath -Encoding ASCII -Force

Write-Output "$domain entry removed from hosts file."

ipconfig /flushdns
Write-Output "DNS cache flushed."
'''
        else:
            logger.error("Invalid action")
            return

        # Process each client
        for client in clients_to_process:
            client_id = client['client_id']
            client_hostname = client.get('hostname', 'Unknown')
            logger.info(f"Processing client: {client_hostname} ({client_id})")
            
            try:
                result = execute_powershell_command(channel, client_id, command)
                if not result:
                    logger.warning(f"No response from {client_hostname}")
                    continue
                
                flow_id = result[0].get('flow_id')
                if not flow_id:
                    logger.error(f"No flow ID for {client_hostname}")
                    continue
                
                # Monitor flow status
                timeout = 300
                start_time = time.time()
                flow_done = False
                success = False
                
                while not flow_done:
                    flow_state = get_flow_state(channel, client_id, flow_id)
                    if not flow_state:
                        logger.error(f"Flow state check failed for {client_hostname}")
                        break
                    
                    state = flow_state[0].get('state', 'UNKNOWN')
                    logger.info(f"{client_hostname} flow state: {state}")
                    
                    if state == 'FINISHED':
                        success = True
                        flow_done = True
                    elif state == 'FAILED':
                        flow_done = True
                    elif time.time() - start_time > timeout:
                        logger.error(f"Timeout waiting for {client_hostname}")
                        flow_done = True
                    else:
                        time.sleep(5)
                
                if success:
                    logger.info(f"Command succeeded on {client_hostname}")
                    # Update IOC database
                    operation_state = 'blocked' if 'Block' in action else 'unblocked'
                    try:
                        update_ioc(target, client_hostname, operation_state)
                    except Exception as e:
                        logger.error(f"Failed to update IOC database: {str(e)}")
                    
                    # Fetch and print results
                    flow_results = get_flow_state(channel, client_id, flow_id)
                    if flow_results:
                        print(f"\nResults for {client_hostname}:")
                        print(json.dumps(flow_results, indent=2))
                    else:
                        logger.warning(f"No results for {client_hostname}")
                else:
                    logger.error(f"Command failed on {client_hostname}")
            
            except Exception as e:
                logger.error(f"Error processing {client_hostname}: {str(e)}", exc_info=True)
                continue

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
    finally:
        logger.info("Closing connection")
        channel.close()

if __name__ == "__main__":
    main()
