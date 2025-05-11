import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import urllib3

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
MAX_NOTE_LENGTH = 65000  # 65KB limit for TEXT columns

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

def generate_note_chunks(file_events):
    """Generate HTML note chunks that respect database limits"""
    chunks = []
    current_chunk = []
    current_length = 0
    part_number = 1
    seen_kv_pairs = set()

    # Initial header
    header = f"<h2>Threat Intelligence Report (Part {part_number})</h2>"
    current_chunk.append(header)
    current_length += len(header)
    current_chunk.append("<style>.event {{margin-bottom:20px; border:1px solid #ddd; padding:10px;}}</style>")
    current_length += 65  # Approximate style tag length

    for event in file_events:
        src = event.get("_source", {})
        kinds = src.get("event.kind", src.get("event", {}).get("kind", []))
        types = src.get("event.type", src.get("event", {}).get("type", []))
        
        # Normalize to lists
        kinds = [kinds] if isinstance(kinds, str) else kinds or []
        types = [types] if isinstance(types, str) else types or []

        # Deduplication logic
        if kinds != ['signal']:
            key = (tuple(kinds), tuple(types))
            if key in seen_kv_pairs:
                continue
            seen_kv_pairs.add(key)

        # Start building event HTML
        event_html = ['<div class="event">']
        if kinds == ['signal']:
            event_html.append('<h3 style="color:red">🚨 SIGNAL EVENT</h3>')
        else:
            event_html.append('<h3>📄 STANDARD EVENT</h3>')

        # Basic info
        event_html.append(f"<b>Timestamp:</b> {format_timestamp(src.get('@timestamp', 'N/A'))}<br>")
        event_html.append(f"<b>Message:</b> {src.get('message', 'N/A')}<br>")
        event_html.append(f"<b>Rule Name:</b> {src.get('kibana.alert.rule.name', 'N/A')}<br>")

        # Process details
        process = src.get("process", {})
        if process:
            event_html.append("<h4>🔧 Process Details</h4>")
            proc_fields = [
                ("Name", "name"),
                ("PID", "pid"),
                ("Entity ID", "entity_id"),
                ("Command Line", "command_line"),
                ("Args", "args"),
                ("Args Count", "args_count"),
                ("Working Directory", "working_directory"),
                ("Executable", "executable")
            ]
            for label, key in proc_fields:
                event_html.append(f"<b>{label}:</b> {process.get(key, 'N/A')}<br>")

            # User context
            user = process.get("user", {})
            if user:
                event_html.append("<h4>👤 User Context</h4>")
                user_fields = [
                    ("Identifier", "identifier"),
                    ("Domain", "domain"),
                    ("Name", "name"),
                    ("Type", "type")
                ]
                for label, key in user_fields:
                    event_html.append(f"<b>{label}:</b> {user.get(key, 'N/A')}<br>")

            # Parent process
            parent = process.get("parent", {})
            if parent:
                event_html.append("<h4>↗️ Parent Process</h4>")
                parent_fields = [
                    ("Name", "name"),
                    ("PID", "pid"),
                    ("Entity ID", "entity_id"),
                    ("Args", "args"),
                    ("Args Count", "args_count"),
                    ("Executable", "executable"),
                    ("Command Line", "command_line")
                ]
                for label, key in parent_fields:
                    event_html.append(f"<b>{label}:</b> {parent.get(key, 'N/A')}<br>")

            # PE information
            pe = process.get("pe", {})
            if pe:
                event_html.append("<h4>📁 PE Information</h4>")
                pe_fields = [
                    ("File Version", "file_version"),
                    ("Company", "company"),
                    ("Product", "product"),
                    ("Description", "description")
                ]
                for label, key in pe_fields:
                    event_html.append(f"<b>{label}:</b> {pe.get(key, 'N/A')}<br>")

            # Hashes
            hashes = process.get("hash", {})
            if hashes:
                event_html.append("<h4>🔐 Hashes</h4>")
                hash_fields = [
                    ("SHA256", "sha256"),
                    ("MD5", "md5")
                ]
                for label, key in hash_fields:
                    event_html.append(f"<b>{label}:</b> {hashes.get(key, 'N/A')}<br>")

        # Fields information
        fields = src.get("fields", {})
        if fields:
            event_html.append("<h4>📊 Field Metadata</h4>")
            field_data = [
                ("Event Category", "event.category"),
                ("Process Name", "process.name.text"),
                ("Host OS", "host.os.name.text")
            ]
            for label, key in field_data:
                event_html.append(f"<b>{label}:</b> {fields.get(key, 'N/A')}<br>")

        # Threat intelligence
        threats = src.get("kibana.alert.rule.threat", [])
        if threats:
            event_html.append("<h4>⚠️ Threat Intelligence</h4>")
            for threat in threats:
                event_html.append(f"<b>Framework:</b> {threat.get('framework', 'N/A')}<br>")
                tactic = threat.get("tactic", {})
                if tactic:
                    event_html.append("<div style='margin-left:15px;'>")
                    event_html.append("<h5>Tactic</h5>")
                    event_html.append(f"<b>Name:</b> {tactic.get('name', 'N/A')}<br>")
                    event_html.append(f"<b>ID:</b> {tactic.get('id', 'N/A')}<br>")
                    event_html.append(f"<b>Reference:</b> {tactic.get('reference', 'N/A')}<br>")
                    event_html.append("</div>")
                
                techniques = threat.get("technique", [])
                for tech in techniques:
                    event_html.append("<div style='margin-left:15px;'>")
                    event_html.append("<h5>Technique</h5>")
                    event_html.append(f"<b>Name:</b> {tech.get('name', 'N/A')}<br>")
                    event_html.append(f"<b>ID:</b> {tech.get('id', 'N/A')}<br>")
                    event_html.append(f"<b>Reference:</b> {tech.get('reference', 'N/A')}<br>")
                    
                    subtechs = tech.get("subtechnique", [])
                    for subtech in subtechs:
                        event_html.append("<div style='margin-left:30px;'>")
                        event_html.append("<h6>Subtechnique</h6>")
                        event_html.append(f"<b>Name:</b> {subtech.get('name', 'N/A')}<br>")
                        event_html.append(f"<b>ID:</b> {subtech.get('id', 'N/A')}<br>")
                        event_html.append(f"<b>Reference:</b> {subtech.get('reference', 'N/A')}<br>")
                        event_html.append("</div>")
                    event_html.append("</div>")

        # Event categories
        event_data = src.get("event", {})
        if event_data:
            event_html.append("<h4>📅 Event Metadata</h4>")
            meta_fields = [
                ("Agent ID Status", "agent_id_status"),
                ("Ingested", "ingested"),
                ("Code", "code"),
                ("Provider", "provider"),
                ("Created", "created"),
                ("Module", "module"),
                ("Action", "action"),
                ("Dataset", "dataset")
            ]
            for label, key in meta_fields:
                event_html.append(f"<b>{label}:</b> {event_data.get(key, 'N/A')}<br>")
            
            for category in event_data.get("category", []):
                event_html.append(f"<h5>{category.capitalize()} Details</h5>")
                
                if category == "file":
                    file_info = src.get("file", {})
                    file_fields = [
                        ("Path", "path"),
                        ("Name", "name"),
                        ("Extension", "extension"),
                        ("Directory", "directory")
                    ]
                    for label, key in file_fields:
                        event_html.append(f"<b>{label}:</b> {file_info.get(key, 'N/A')}<br>")
                
                elif category == "registry":
                    registry = src.get("registry", {})
                    registry_fields = [
                        ("Hive", "hive"),
                        ("Key", "key"),
                        ("Value", "value")
                    ]
                    for label, key in registry_fields:
                        event_html.append(f"<b>{label}:</b> {registry.get(key, 'N/A')}<br>")
                    
                    registry_data = registry.get("data", {})
                    if registry_data:
                        event_html.append(f"<b>Data Type:</b> {registry_data.get('type', 'N/A')}<br>")
                        event_html.append(f"<b>Data Strings:</b> {registry_data.get('strings', 'N/A')}<br>")
                
                elif category == "configuration":
                    config = src.get("configuration", {})
                    config_fields = [
                        ("Hive", "hive"),
                        ("Key", "key"),
                        ("Value", "value")
                    ]
                    for label, key in config_fields:
                        event_html.append(f"<b>{label}:</b> {config.get(key, 'N/A')}<br>")
                    
                    config_data = config.get("data", {})
                    if config_data:
                        event_html.append(f"<b>Data Type:</b> {config_data.get('type', 'N/A')}<br>")
                        event_html.append(f"<b>Data Strings:</b> {config_data.get('strings', 'N/A')}<br>")
                
                elif category == "process":
                    proc_info = src.get("process", {})
                    event_html.append(f"<b>Working Directory:</b> {proc_info.get('working_directory', 'N/A')}<br>")
                    event_html.append(f"<b>Executable:</b> {proc_info.get('executable', 'N/A')}<br>")
                
                else:
                    event_html.append(f"<div style='color:#666'>Details for category '{category}' not available</div>")

        event_html.append("</div>")  # Close event div
        event_content = "".join(event_html)
        
        # Check length and split if needed
        if current_length + len(event_content) > MAX_NOTE_LENGTH:
            # Finalize current chunk
            chunks.append("".join(current_chunk))
            # Start new chunk
            part_number += 1
            current_chunk = [
                f"<h2>Threat Intelligence Report (Part {part_number})</h2>",
                "<style>.event {margin-bottom:20px; border:1px solid #ddd; padding:10px;}</style>"
            ]
            current_length = sum(len(s) for s in current_chunk)
        
        current_chunk.append(event_content)
        current_length += len(event_content)

    # Add final chunk
    if current_chunk:
        chunks.append("".join(current_chunk))
    
    return chunks

def main():
    if len(sys.argv) != 4:
        print("Usage: python Alert_Event_flow.py <ticket_number> <device_name> <process_entity_id>")
        sys.exit(1)

    ticket_number = ensure_ticket_prefix(sys.argv[1])
    device_name = sys.argv[2]
    process_entity_id = sys.argv[3]

    try:
        events = search_file_events(device_name, process_entity_id)
        if not events:
            print("No events found")
            return

        # Generate and send note chunks
        note_chunks = generate_note_chunks(events)
        for idx, chunk in enumerate(note_chunks):
            zs_add_note_to_ticket(
                ticket_number,
                "raw",
                TEST,
                f"{note_title} [Part {idx+1}]",
                chunk,
                "text/html"
            )

        print(f"✅ Added {len(note_chunks)} notes to ticket {ticket_number}")

    except Exception as e:
        print(f"❌ Error processing ticket: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()