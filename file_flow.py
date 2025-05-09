import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
from integrations.znuny_otrs import zs_add_note_to_ticket

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"
note_title = f"Context: Threat Intel (file_flow)"
TEST = False

def ensure_ticket_prefix(ticket_number):
    """
    Ensure the ticket number has the required MOCK- prefix.
    """
    if not ticket_number.startswith("MOCK-"):
        print(f"Adding MOCK- prefix to ticket number: {ticket_number}")
        return f"MOCK-{ticket_number}"
    return ticket_number

def search_file_events(device_name, process_name):
    """
    Search file events based on the provided device name and process name.
    """
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"process.name": process_name}},
                    {"term": {"host.name": device_name}},
                    {"exists": {"field": "file.name"}}
                ]
            }
        },
        "sort": [
            {"@timestamp": {"order": "asc"}}  # Sort by @timestamp from old to newest
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
        return response.json().get("hits", {}).get("hits", [])
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return []

def format_timestamp(timestamp):
    """
    Format the timestamp into a readable format.
    """
    try:
        dt_object = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        return dt_object.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return timestamp

def generate_note_body(file_events):
    """
    Generate the note body for file events.
    """
    note_body = "<h2>Highlights (Hits)</h2>"
    note_body += f"Found {len(file_events)} file event(s).<br><br>"
    note_body += "<h3>File Events Details:</h3><br><br>"

    for event in file_events:
        source = event["_source"]
        readable_timestamp = format_timestamp(source.get("@timestamp", "N/A"))
        message = source.get("message", "N/A")
        file_name = source.get("file", {}).get("name", "N/A")
        file_path = source.get("file", {}).get("path", "N/A")

        note_body += f"<b>Timestamp:</b> {readable_timestamp}<br>"
        note_body += f"<b>Message:</b> {message}<br>"
        note_body += f"<b>File Name:</b> {file_name}<br>"
        note_body += f"<b>File Path:</b> {file_path}<br><br>"

    note_body += "<br><br><br><br>"
    return note_body

def print_file_events(ticket_number, file_events):
    """
    Print the file events in a readable format.
    """
    print(f"Ticket Number: {ticket_number}")
    print("=" * 50)
    
    for event in file_events:
        source = event["_source"]
        readable_timestamp = format_timestamp(source.get("@timestamp", "N/A"))
        message = source.get("message", "N/A")

        print(f'readable "@timestamp": {readable_timestamp}')
        print(f"Message: {message}")
        print("-" * 80)

if __name__ == "__main__":
    # Ensure three parameters are passed
    if len(sys.argv) != 4:
        print("Usage: python file_flow.py <ticket_number> <device_name> <process_name>")
        sys.exit(1)

    # Get parameters from command line arguments
    ticket_number = sys.argv[1]
    device_name = sys.argv[2]
    process_name = sys.argv[3]

    # Ensure ticket number has the required prefix
    ticket_number = ensure_ticket_prefix(ticket_number)

    try:
        # Search for file events
        file_events = search_file_events(device_name, process_name)

        # Generate the note body
        note_body = generate_note_body(file_events)

        # Add the note to the ticket
        zs_add_note_to_ticket(ticket_number, "raw", TEST, note_title, note_body, "text/html")

        print(f"Note successfully added to ticket {ticket_number}.")

        # Print file events to console
        print_file_events(ticket_number, file_events)

    except Exception as e:
        print(f"Error: {e}")
