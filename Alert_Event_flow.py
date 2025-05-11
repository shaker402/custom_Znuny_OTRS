import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import urllib3
import json

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from integrations.znuny_otrs import zs_add_note_to_ticket

# Configuration
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"
SCROLL_TIME = "2m"
note_title = "Context: Threat Intel (Alert & Events)"
TEST = False

def ensure_ticket_prefix(ticket_number):
    """Ensure ticket number has MOCK- prefix."""
    if not ticket_number.startswith("MOCK-"):
        return f"MOCK-{ticket_number}"
    return ticket_number

def search_file_events(device_name, process_entity_id):
    """Search Elasticsearch for file events with scrolling."""
    query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"term": {"process.entity_id": process_entity_id}},
                    {"term": {"host.name": device_name}}
                ]
            }
        },
        "sort": [{"@timestamp": {"order": "asc"}}]
    }

    try:
        resp = requests.post(
            f"{ELASTICSEARCH_URL}/*/_search?scroll={SCROLL_TIME}",
            json=query,
            headers={"Content-Type": "application/json"},
            auth=HTTPBasicAuth(USERNAME, PASSWORD),
            verify=False
        )
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Search error: {str(e)}")
        return []

    results = []
    data = resp.json()
    scroll_id = data.get("_scroll_id")
    results.extend(data.get("hits", {}).get("hits", []))

    while True:
        try:
            scroll_resp = requests.post(
                f"{ELASTICSEARCH_URL}/_search/scroll",
                json={"scroll": SCROLL_TIME, "scroll_id": scroll_id},
                headers={"Content-Type": "application/json"},
                auth=HTTPBasicAuth(USERNAME, PASSWORD),
                verify=False
            )
            scroll_resp.raise_for_status()
            scroll_data = scroll_resp.json()
            hits = scroll_data.get("hits", {}).get("hits", [])
            if not hits:
                break
            results.extend(hits)
            scroll_id = scroll_data.get("_scroll_id")
        except requests.exceptions.RequestException as e:
            print(f"Scroll error: {str(e)}")
            break

    return results

def format_timestamp(timestamp):
    """Format Elasticsearch timestamp to readable format."""
    try:
        return datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return timestamp

def generate_note_content(file_events):
    """Generate HTML note content from file events."""
    note_body = f"<h2>Found {len(file_events)} related event(s)</h2>"
    seen_kv_pairs = set()

    for event in file_events:
        src = event.get("_source", {})
        kinds = src.get("event.kind", src.get("event", {}).get("kind", []))
        types = src.get("event.type", src.get("event", {}).get("type", []))
        
        # Normalize to lists
        kinds = [kinds] if isinstance(kinds, str) else kinds or []
        types = [types] if isinstance(types, str) else types or []

        event_header = []
        if kinds == ['signal']:
            event_header.append("<h3 style='color: #ff0000;'>SIGNAL EVENT</h3>")
        else:
            key = (tuple(kinds), tuple(types))
            if key in seen_kv_pairs:
                continue
            seen_kv_pairs.add(key)
            event_header.append("<h3>STANDARD EVENT</h3>")

        # Basic info
        note_body += "<div style='margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;'>"
        note_body += "".join(event_header)
        note_body += f"<b>Timestamp:</b> {format_timestamp(src.get('@timestamp', 'N/A'))}<br>"
        note_body += f"<b>Message:</b> {src.get('message', 'N/A')}<br>"
        note_body += f"<b>Rule Name:</b> {src.get('kibana.alert.rule.name', 'N/A')}<br>"

        # Process information
        process = src.get("process", {})
        if process:
            note_body += "<h4>Process Details</h4>"
            note_body += f"<b>Name:</b> {process.get('name', 'N/A')}<br>"
            note_body += f"<b>PID:</b> {process.get('pid', 'N/A')}<br>"
            note_body += f"<b>Entity ID:</b> {process.get('entity_id', 'N/A')}<br>"
            note_body += f"<b>Command Line:</b> {process.get('command_line', 'N/A')}<br>"
            note_body += f"<b>Args:</b> {process.get('args', 'N/A')}<br>"
            note_body += f"<b>Args Count:</b> {process.get('args_count', 'N/A')}<br>"
            note_body += f"<b>Working Directory:</b> {process.get('working_directory', 'N/A')}<br>"
            note_body += f"<b>Executable:</b> {process.get('executable', 'N/A')}<br>"
            
            # Parent process
            parent = process.get("parent", {})
            if parent:
                note_body += "<h4>Parent Process</h4>"
                note_body += f"<b>Name:</b> {parent.get('name', 'N/A')}<br>"
                note_body += f"<b>PID:</b> {parent.get('pid', 'N/A')}<br>"
                note_body += f"<b>Entity ID:</b> {parent.get('entity_id', 'N/A')}<br>"
                note_body += f"<b>Args:</b> {parent.get('args', 'N/A')}<br>"
                note_body += f"<b>Args Count:</b> {parent.get('args_count', 'N/A')}<br>"
                note_body += f"<b>Executable:</b> {parent.get('executable', 'N/A')}<br>"
                note_body += f"<b>Command Line:</b> {parent.get('command_line', 'N/A')}<br>"

            # PE information
            pe = process.get("pe", {})
            if pe:
                note_body += "<h4>PE Information</h4>"
                note_body += f"<b>File Version:</b> {pe.get('file_version', 'N/A')}<br>"
                note_body += f"<b>Company:</b> {pe.get('company', 'N/A')}<br>"
                note_body += f"<b>Product:</b> {pe.get('product', 'N/A')}<br>"
                note_body += f"<b>Description:</b> {pe.get('description', 'N/A')}<br>"

            # Hashes
            hashes = process.get("hash", {})
            if hashes:
                note_body += "<h4>Hashes</h4>"
                note_body += f"<b>SHA256:</b> {hashes.get('sha256', 'N/A')}<br>"
                note_body += f"<b>MD5:</b> {hashes.get('md5', 'N/A')}<br>"

        # Fields information
        fields = src.get("fields", {})
        if fields:
            note_body += "<h4>Field Metadata</h4>"
            note_body += f"<b>Event Category:</b> {fields.get('event.category', 'N/A')}<br>"
            note_body += f"<b>Process Name:</b> {fields.get('process.name.text', 'N/A')}<br>"
            note_body += f"<b>Host OS:</b> {fields.get('host.os.name.text', 'N/A')}<br>"

        # Threat information
        threats = src.get("kibana.alert.rule.threat", [])
        if threats:
            note_body += "<h4>Threat Intelligence</h4>"
            for threat in threats:
                note_body += f"<b>Framework:</b> {threat.get('framework', 'N/A')}<br>"
                tactic = threat.get("tactic", {})
                note_body += f"<b>Tactic:</b> {tactic.get('name', 'N/A')} ({tactic.get('id', 'N/A')})<br>"
                
                techniques = threat.get("technique", [])
                for tech in techniques:
                    note_body += f"<b>Technique:</b> {tech.get('name', 'N/A')} ({tech.get('id', 'N/A')})<br>"
                    subtechs = tech.get("subtechnique", [])
                    for subtech in subtechs:
                        note_body += f"&nbsp;&nbsp;<b>Subtechnique:</b> {subtech.get('name', 'N/A')} ({subtech.get('id', 'N/A')})<br>"

        # Event categories
        event_data = src.get("event", {})
        if event_data:
            note_body += "<h4>Event Metadata</h4>"
            note_body += f"<b>Agent ID Status:</b> {event_data.get('agent_id_status', 'N/A')}<br>"
            note_body += f"<b>Ingested:</b> {event_data.get('ingested', 'N/A')}<br>"
            note_body += f"<b>Code:</b> {event_data.get('code', 'N/A')}<br>"
            note_body += f"<b>Provider:</b> {event_data.get('provider', 'N/A')}<br>"
            note_body += f"<b>Created:</b> {event_data.get('created', 'N/A')}<br>"
            note_body += f"<b>Module:</b> {event_data.get('module', 'N/A')}<br>"
            note_body += f"<b>Action:</b> {event_data.get('action', 'N/A')}<br>"
            note_body += f"<b>Dataset:</b> {event_data.get('dataset', 'N/A')}<br>"
            
            for category in event_data.get("category", []):
                note_body += f"<h5>{category.capitalize()} Details</h5>"
                
                if category == "file":
                    file_info = src.get("file", {})
                    note_body += f"<b>Path:</b> {file_info.get('path', 'N/A')}<br>"
                    note_body += f"<b>Name:</b> {file_info.get('name', 'N/A')}<br>"
                    note_body += f"<b>Extension:</b> {file_info.get('extension', 'N/A')}<br>"
                    note_body += f"<b>Directory:</b> {file_info.get('directory', 'N/A')}<br>"
                
                elif category == "registry":
                    registry = src.get("registry", {})
                    note_body += f"<b>Hive:</b> {registry.get('hive', 'N/A')}<br>"
                    note_body += f"<b>Key:</b> {registry.get('key', 'N/A')}<br>"
                    note_body += f"<b>Value:</b> {registry.get('value', 'N/A')}<br>"
                    registry_data = registry.get("data", {})
                    if registry_data:
                        note_body += f"<b>Data Type:</b> {registry_data.get('type', 'N/A')}<br>"
                        note_body += f"<b>Data Strings:</b> {registry_data.get('strings', 'N/A')}<br>"
                
                elif category == "configuration":
                    config = src.get("configuration", {})
                    note_body += f"<b>Hive:</b> {config.get('hive', 'N/A')}<br>"
                    note_body += f"<b>Key:</b> {config.get('key', 'N/A')}<br>"
                    note_body += f"<b>Value:</b> {config.get('value', 'N/A')}<br>"
                    config_data = config.get("data", {})
                    if config_data:
                        note_body += f"<b>Data Type:</b> {config_data.get('type', 'N/A')}<br>"
                        note_body += f"<b>Data Strings:</b> {config_data.get('strings', 'N/A')}<br>"
                
                elif category == "process":
                    proc_info = src.get("process", {})
                    note_body += f"<b>Working Directory:</b> {proc_info.get('working_directory', 'N/A')}<br>"
                    note_body += f"<b>Executable:</b> {proc_info.get('executable', 'N/A')}<br>"
                
                else:
                    note_body += f"<div style='color: #666;'>Details for category '{category}' are not recognized or available.</div><br>"

        note_body += "</div><hr>"

    # Add JSON dump reference
    note_body += "<h4>Raw Data</h4>"
    note_body += "<i>Complete JSON data attached to ticket system</i>"

    return note_body

def main():
    if len(sys.argv) != 4:
        print("Usage: python file_flow.py <ticket_number> <device_name> <process_entity_id>")
        sys.exit(1)

    ticket_number = ensure_ticket_prefix(sys.argv[1])
    device_name = sys.argv[2]
    process_entity_id = sys.argv[3]

    try:
        events = search_file_events(device_name, process_entity_id)
        if not events:
            print("No events found")
            return

        note_content = generate_note_content(events)

        zs_add_note_to_ticket(
            ticket_number,    # positional
            "raw",            # positional
            TEST,             # positional
            note_title,       # positional
            note_content,     # positional
            "text/html"       # positional
        )

        print(f"Successfully added note to ticket {ticket_number}")
        print(f"Raw data saved to output_{ticket_number}.json")

    except Exception as e:
        print(f"Error processing ticket: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
