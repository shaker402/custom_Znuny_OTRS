import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
from integrations.znuny_otrs import zs_add_note_to_ticket, zs_get_ticket_by_number

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"
note_title = f"Context: Threat Intel (PB_010_new_registery_flow)"
TEST = False

def search_registry_events(ticket_number, device_name, process_name):
    """
    Search registry events in Elasticsearch based on the provided parameters.
    """
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"process.name": process_name}},
                    {"term": {"host.name": device_name}},
                    {"exists": {"field": "registry.value"}}
                ]
            }
        },
        "sort": [
            {"@timestamp": {"order": "asc"}}  # Sort by @timestamp from oldest to newest
        ]
    }
    response = requests.post(
        f"{ELASTICSEARCH_URL}/*/_search?pretty",
        json=query,
        headers={"Content-Type": "application/json"},
        auth=HTTPBasicAuth(USERNAME, PASSWORD),
        verify=False
    )
    if response.status_code == 200:
        print(f"Search completed for ticket: {ticket_number}")
        return response.json().get("hits", {}).get("hits", [])
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return []

def format_timestamp(timestamp):
    """
    Convert Elasticsearch timestamp into a human-readable format.
    """
    try:
        dt_object = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        return dt_object.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return timestamp

def format_results(events, output_format="html", prefix=""):
    """
    Format registry events into the specified format.
    """
    formatted_results = ""
    for event in events:
        source = event["_source"]
        readable_timestamp = format_timestamp(source.get("@timestamp", "N/A"))
        registry = source.get("registry", {})
        message = source.get("message", "N/A")

        formatted_results += f"{prefix}Timestamp: {readable_timestamp}<br>"
        formatted_results += f"{prefix}Registry Hive: {registry.get('hive', 'N/A')}<br>"
        formatted_results += f"{prefix}Registry Path: {registry.get('path', 'N/A')}<br>"
        formatted_results += f"{prefix}Registry Value: {registry.get('value', 'N/A')}<br>"
        formatted_results += f"{prefix}Registry Key: {registry.get('key', 'N/A')}<br>"
        formatted_results += f"{prefix}Message: {message}<br><br>"
    return formatted_results

def ensure_ticket_prefix(ticket_number):
    """
    Ensure the ticket number has the required MOCK- prefix.
    """
    if not ticket_number.startswith("MOCK-"):
        print(f"Adding MOCK- prefix to ticket number: {ticket_number}")
        return f"MOCK-{ticket_number}"
    return ticket_number

def print_registry_events(events, ticket_number):
    """
    Print registry events in a formatted way.
    """
    print(f"--- Registry events for ticket: {ticket_number} ---")
    if not events:
        print("No registry events found.")
        return

    for event in events:
        source = event["_source"]
        readable_timestamp = format_timestamp(source.get("@timestamp", "N/A"))
        registry = source.get("registry", {})
        message = source.get("message", "N/A")

        print(f'readable "@timestamp": {readable_timestamp}')
        print(f"Registry:")
        print(f"  Hive: {registry.get('hive', 'N/A')}")
        print(f"  Path: {registry.get('path', 'N/A')}")
        print(f"  Data:")
        registry_data = registry.get("data", {})
        print(f"    Strings: {', '.join(registry_data.get('strings', ['N/A']))}")
        print(f"    Type: {registry_data.get('type', 'N/A')}")
        print(f"  Value: {registry.get('value', 'N/A')}")
        print(f"  Key: {registry.get('key', 'N/A')}")
        print(f"Message: {message}")
        print("-" * 80)

if __name__ == "__main__":
    # Ensure the correct number of arguments are provided
    if len(sys.argv) != 4:
        print("Usage: python registry_flow.py <ticket_number> <detection.device.name> <detection.process.process_name>")
        sys.exit(1)

    # Parse command-line arguments
    ticket_number = sys.argv[1]
    device_name = sys.argv[2]
    process_name = sys.argv[3]

    # Ensure ticket number has the required prefix
    ticket_number = ensure_ticket_prefix(ticket_number)

    # Search for registry events
    registry_events = search_registry_events(ticket_number, device_name, process_name)

    # Format the note body
    note_body = "<h2>Highlights (Hits)</h2>"
    note_body += f"Found {len(registry_events)} registry event(s).<br><br>"
    note_body += f"<h3>Registry Events:</h3><br><br>"
    note_body += format_results(registry_events, "html", "")
    note_body += "<br><br><br><br>"

    # Add the note to the ticket
    zs_add_note_to_ticket(ticket_number, "raw", TEST, note_title, note_body, "text/html")

    # Print the registry events to console
    print_registry_events(registry_events, ticket_number)
