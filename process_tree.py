import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import time
import urllib3
from integrations.znuny_otrs import zs_add_note_to_ticket

# Suppress warnings for unverified HTTPS requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"

# VirusTotal API Key
VIRUSTOTAL_API_KEY = "a5d3f39ee162dd26de22480d91d4553169410a4615810ade7cfc7705112b6184"
VIRUSTOTAL_URL = "https://www.virustotal.com/api/v3/files/{}"

note_title = f"Context: Threat Intel (process_tree)"
TEST = False

# VirusTotal API Rate Limit
VIRUSTOTAL_RATE_LIMIT = 4  # 4 requests per minute
VIRUSTOTAL_SLEEP_TIME = 15  # Sleep time in seconds to respect the rate limit


def ensure_ticket_prefix(ticket_number):
    """
    Ensure the ticket number has the required MOCK- prefix.
    """
    if not ticket_number.startswith("MOCK-"):
        print(f"Adding MOCK- prefix to ticket number: {ticket_number}")
        return f"MOCK-{ticket_number}"
    return ticket_number


def get_parent_process(process_entity_id, device_name):
    """
    Fetch the parent process based on the process entity ID and device name.
    """
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"host.hostname": device_name}},
                    {"term": {"process.entity_id": process_entity_id}},
                    {"exists": {"field": "process.parent.entity_id"}}
                ]
            }
        }
    }
    response = requests.post(
        f"{ELASTICSEARCH_URL}/*/_search?pretty",
        json=query,
        headers={"Content-Type": "application/json"},
        auth=HTTPBasicAuth(USERNAME, PASSWORD),
        verify=False
    )
    if response.status_code == 200:
        data = response.json()
        hits = data.get("hits", {}).get("hits", [])
        if hits:
            return hits[0]["_source"]
    return None


def build_process_tree(initial_entity_id, device_name):
    """
    Build the process tree starting from the initial process entity ID.
    """
    process_tree = []
    current_entity_id = initial_entity_id

    while current_entity_id:
        process_data = get_parent_process(current_entity_id, device_name)
        if not process_data:
            break
        process_tree.append(process_data)
        current_entity_id = process_data["process"]["parent"]["entity_id"]

    return process_tree


def format_timestamp(timestamp):
    """
    Format the timestamp into a readable format.
    """
    try:
        dt_object = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        return dt_object.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return timestamp


def fetch_virustotal_details(sha256):
    """
    Fetch threat intelligence details from VirusTotal using the SHA256 hash.
    """
    if not sha256 or sha256 == "N/A":
        return {
            "Score": "N/A",
            "Behavior": {"Sigma_Rules": [], "IDS_Rules": []},
            "File Report": "N/A",
            "Popular threat label": "N/A",
        }

    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY
    }
    try:
        response = requests.get(VIRUSTOTAL_URL.format(sha256), headers=headers)
        if response.status_code == 200:
            data = response.json()
            attributes = data.get("data", {}).get("attributes", {})
            
            # Calculate the score
            malicious = attributes.get("last_analysis_stats", {}).get("malicious", 0)
            harmless = attributes.get("last_analysis_stats", {}).get("harmless", 0)
            suspicious = attributes.get("last_analysis_stats", {}).get("suspicious", 0)
            undetected = attributes.get("last_analysis_stats", {}).get("undetected", 0)
            timeout = attributes.get("last_analysis_stats", {}).get("timeout", 0)
            total = malicious + harmless + suspicious + undetected + timeout
            score = f"{malicious}/{total} security vendors flagged this file as malicious"

            # Behavior (Sigma and IDS rules)
            sigma_rules = attributes.get("sigma_analysis_results", [])
            ids_rules = attributes.get("network_traffic_analysis_results", {}).get("ids_rules", [])
            behavior = {
                "Sigma_Rules": sigma_rules,
                "IDS_Rules": ids_rules,
            }

            # File Report URL
            file_report = f"https://www.virustotal.com/gui/file/{sha256}/details"

            # Popular Threat Label
            popular_threat_label = attributes.get("popular_threat_classification", {}).get("suggested_threat_label", "N/A")

            return {
                "Score": score,
                "Behavior": behavior,
                "File Report": file_report,
                "Popular threat label": popular_threat_label,
            }
        else:
            return {
                "Score": "N/A",
                "Behavior": {"Sigma_Rules": [], "IDS_Rules": []},
                "File Report": "N/A",
                "Popular threat label": "N/A",
            }
    except Exception:
        return {
            "Score": "N/A",
            "Behavior": {"Sigma_Rules": [], "IDS_Rules": []},
            "File Report": "N/A",
            "Popular threat label": "N/A",
        }


def generate_note_body(process_tree):
    """
    Generate the note body for the process tree.
    """
    note_body = "<h2>Highlights (Hits)</h2>"
    note_body += f"Found {len(process_tree)} process(es) in the tree.<br><br>"
    note_body += "<h3>Process Details:</h3><br><br>"

    for process in reversed(process_tree):
        timestamp = format_timestamp(process.get("@timestamp", "N/A"))
        name = process["process"].get("name", "N/A")
        pid = process["process"].get("pid", "N/A")
        command_line = process["process"].get("command_line", "N/A")
        sha256 = process["process"].get("hash", {}).get("sha256", "N/A")
        message = process.get("message", "N/A")
        vt_details = fetch_virustotal_details(sha256)

        note_body += f"<b>Timestamp:</b> {timestamp}<br>"
        note_body += f"<b>Process:</b> {name} (PID: {pid})<br>"
        note_body += f"<b>Command Line:</b> {command_line}<br>"
        note_body += f"<b>SHA256:</b> {sha256}<br>"
        note_body += f"<b>Message:</b> {message}<br>"
        note_body += f"<b>Score:</b> {vt_details['Score']}<br>"
        note_body += f"<b>Popular Threat Label:</b> {vt_details['Popular threat label']}<br>"
        note_body += f"<b>File Report:</b> <a href='{vt_details['File Report']}' target='_blank'>Link</a><br><br>"
        if vt_details["Behavior"]["Sigma_Rules"] or vt_details["Behavior"]["IDS_Rules"]:
            note_body += "<b>Behavior:</b><br>"
            note_body += f"  Sigma Rules: {vt_details['Behavior']['Sigma_Rules']}<br>"
            note_body += f"  IDS Rules: {vt_details['Behavior']['IDS_Rules']}<br>"

    note_body += "<br><br><br><br>"
    return note_body


if __name__ == "__main__":
    # Ensure three parameters are passed: ticket_number, device_name, and process_entity_id
    if len(sys.argv) != 4:
        print("Usage: python process_tree.py <ticket_number> <device_name> <process_entity_id>")
        sys.exit(1)

    # Get parameters from command line arguments
    ticket_number = sys.argv[1]
    device_name = sys.argv[2]
    process_entity_id = sys.argv[3]

    # Ensure ticket number has the required prefix
    ticket_number = ensure_ticket_prefix(ticket_number)

    try:
        # Build the process tree
        process_tree = build_process_tree(process_entity_id, device_name)

        # Generate the note body
        note_body = generate_note_body(process_tree)

        # Add the note to the ticket
        zs_add_note_to_ticket(ticket_number, "raw", TEST, note_title, note_body, "text/html")

        print(f"Note successfully added to ticket {ticket_number}.")

    except Exception as e:
        print(f"Error: {e}")
