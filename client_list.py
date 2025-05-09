import grpc
import yaml
import json
import time
import argparse
from datetime import datetime
from pyvelociraptor import api_pb2
from pyvelociraptor import api_pb2_grpc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
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
        return grpc.secure_channel(config["api_connection_string"], creds, options)
    except Exception as e:
        logger.error(f"Connection setup failed: {str(e)}")
        return None

def list_clients_with_status(channel):
    try:
        stub = api_pb2_grpc.APIStub(channel)
        query = """
        SELECT client_id,
               os_info.system + ' ' + os_info.release AS os,
               os_info.hostname AS hostname,
               last_seen_at
        FROM clients()
        """
        
        request = api_pb2.VQLCollectorArgs(
            Query=[api_pb2.VQLRequest(VQL=query)],
        )

        clients = []
        for response in stub.Query(request):
            if response.Response:
                clients_data = json.loads(response.Response)
                for client in clients_data:
                    last_seen_micro = client.get('last_seen_at', 0)
                    try:
                        last_seen_sec = last_seen_micro / 1_000_000
                        readable_date = datetime.fromtimestamp(last_seen_sec).strftime("%Y-%m-%d %H:%M:%S")
                    except:
                        readable_date = "Never"
                    
                    is_online = (time.time() - (last_seen_micro / 1_000_000)) < 300 if last_seen_micro else False
                    
                    clients.append({
                        "client_id": client.get("client_id"),
                        "os": client.get("os", "Unknown OS"),
                        "hostname": client.get("hostname", "Unknown"),
                        "last_seen_at": readable_date,
                        "state": "online" if is_online else "offline"
                    })
        
        return clients
    except Exception as e:
        logger.error(f"Error listing clients: {str(e)}")
        return []

def main():
    parser = argparse.ArgumentParser(description='Export Velociraptor client list to JSON file')
    parser.add_argument('--output', '-o', default='clients.json',
                       help='Output JSON file path (default: clients.json)')
    args = parser.parse_args()

    config_path = "/home/admin/my-project/python-scripts/modules/Velociraptor/dependencies/api.config.yaml"
    
    channel = setup_connection(config_path)
    if not channel:
        return

    try:
        clients = list_clients_with_status(channel)
        if clients:
            with open(args.output, 'w') as f:
                json.dump(clients, f, indent=2)
            logger.info(f"Successfully exported {len(clients)} clients to {args.output}")
        else:
            logger.warning("No clients found to export")
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
    finally:
        channel.close()

if __name__ == "__main__":
    main()
