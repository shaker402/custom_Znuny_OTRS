import grpc
import yaml
import json
from pyvelociraptor import api_pb2
from pyvelociraptor import api_pb2_grpc
import os

def setup_connection(config_path):
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        
        creds = grpc.ssl_channel_credentials(
            root_certificates=config["ca_certificate"].encode("utf8"),
            private_key=config["client_private_key"].encode("utf8"),
            certificate_chain=config["client_cert"].encode("utf8"),
        )
        options = (
            (
                "grpc.ssl_target_name_override",
                "VelociraptorServer",
            ),
        )
        channel = grpc.secure_channel(config["api_connection_string"], creds, options)
        return channel
    except Exception as e:
        print(f"Failed to set up connection: {e}")
        return None

def list_all_artifacts(channel):
    try:
        stub = api_pb2_grpc.APIStub(channel)
        query = "SELECT name FROM artifact_definitions()"
        request = api_pb2.VQLCollectorArgs(
            max_wait=10,
            max_row=100,
            Query=[
                api_pb2.VQLRequest(VQL=query),
            ],
        )
        
        artifacts = []
        for response in stub.Query(request):
            if response.Response:
                results = json.loads(response.Response)
                artifacts.extend([artifact["name"] for artifact in results])
        
        return artifacts
    except Exception as e:
        print(f"Error listing artifacts: {e}")
        return []

def main():
    config_path = "/home/admin/my-project/python-scripts/modules/Velociraptor/dependencies/api.config.yaml"
    channel = setup_connection(config_path)
    
    if channel:
        artifacts = list_all_artifacts(channel)
        if artifacts:
            print("Available Artifacts:")
            for artifact in artifacts:
                print(artifact)
        else:
            print("No artifacts found.")
        channel.close()
    else:
        print("Failed to connect to the Velociraptor server.")

if __name__ == "__main__":
    main()
