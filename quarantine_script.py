import grpc
import yaml
import json
import time
import argparse
from pyvelociraptor import api_pb2
from pyvelociraptor import api_pb2_grpc
import logging

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
                clients.extend(json.loads(response.Response))
        
        logger.info(f"Found {len(clients)} clients")
        return clients
    except Exception as e:
        logger.error(f"Client listing failed: {str(e)}", exc_info=True)
        return []

def execute_quarantine(channel, client_id, remove_policy, message=None):
    try:
        stub = api_pb2_grpc.APIStub(channel)
        artifact_name = "Windows.Remediation.Quarantine"
        
        # Build spec parameters
        spec_params = [f"RemovePolicy={json.dumps(remove_policy)}"]
        if message is not None:
            spec_params.append(f"Message={json.dumps(message)}")
        spec_params_str = ', '.join(spec_params)
        
        vql_query = f"""
        LET collection = collect_client(
            client_id='{client_id}',
            artifacts=['{artifact_name}'],
            urgent=True,
            spec=dict(`{artifact_name}`=dict(
                {spec_params_str}
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
                if response.Response:
                    try:
                        parsed = json.loads(response.Response)
                        results.extend(parsed)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON: {str(e)}")
                
                if hasattr(response, 'status') and response.status:
                    logger.info(f"Status: {response.status}")

        except grpc.RpcError as e:
            logger.error(f"gRPC error: {e.code().name} - {e.details()}", exc_info=True)
            return None

        logger.info(f"Received {len(results)} total results")
        return results if results else None
    
    except Exception as e:
        logger.error(f"Quarantine action failed: {str(e)}", exc_info=True)
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

def validate_client_os(client):
    os_info = client.get('os', '').lower()
    if 'windows' not in os_info:
        logger.error(f"Client {client['client_id']} is not Windows OS: {os_info}")
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description='Manage host quarantine using Velociraptor.')
    parser.add_argument('hostname', help='Hostname of the target client')
    parser.add_argument('action', choices=['Quarantine', 'Unquarantine'], 
                       help='Action to perform: "Quarantine" or "Unquarantine"')
    parser.add_argument('--message', help='Optional message to display during quarantine')
    args = parser.parse_args()

    config_path = "/home/admin/my-project/python-scripts/modules/Velociraptor/dependencies/api.config.yaml"
    
    logger.info("Initializing connection...")
    channel = setup_connection(config_path)
    
    if not channel:
        logger.error("Failed to establish connection")
        return

    try:
        clients = list_all_clients(channel)
        if not clients:
            logger.warning("No clients available")
            return

        selected_client = next((c for c in clients if c.get('hostname') == args.hostname), None)
        if not selected_client:
            logger.error(f"No client found with hostname: {args.hostname}")
            return
            
        if not validate_client_os(selected_client):
            return

        client_id = selected_client['client_id']
        remove_policy = args.action == 'Unquarantine'
        message = args.message if args.action == 'Quarantine' else None

        logger.info(f"Executing {args.action} on {client_id}...")
        result = execute_quarantine(channel, client_id, remove_policy, message)
        
        if result:
            flow_id = result[0].get("flow_id")
            if not flow_id:
                logger.error("No flow_id found in the result")
                return

            logger.info(f"Monitoring flow: {flow_id}")
            timeout = 300
            start_time = time.time()
            while True:
                flow_state = get_flow_state(channel, client_id, flow_id)
                if not flow_state:
                    logger.error("Failed to get flow state")
                    return

                state = flow_state[0].get("state")
                logger.info(f"Flow state: {state}")

                if state == "FINISHED":
                    logger.info("Quarantine action completed successfully")
                    break
                elif state == "FAILED":
                    logger.error("Quarantine action failed")
                    return
                elif time.time() - start_time > timeout:
                    logger.error("Timeout waiting for flow completion")
                    return

                time.sleep(5)

            flow_results = get_flow_state(channel, client_id, flow_id)
            if flow_results:
                print("\nQuarantine Results:")
                print(json.dumps(flow_results, indent=2))
        else:
            logger.error("Failed to execute quarantine action")

    except Exception as e:
        logger.error(f"Main execution failed: {str(e)}", exc_info=True)
    finally:
        channel.close()

if __name__ == "__main__":
    main()
