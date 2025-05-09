import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import time
import ipaddress
from integrations.znuny_otrs import zs_add_note_to_ticket

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"

# VirusTotal API Key
VIRUSTOTAL_API_KEY = "a5d3f39ee162dd26de22480d91d4553169410a4615810ade7cfc7705112b6184"
VIRUSTOTAL_URL = "https://www.virustotal.com/api/v3/ip_addresses/{}"

# VirusTotal API Rate Limit
VIRUSTOTAL_RATE_LIMIT = 4  # 4 requests per minute
VIRUSTOTAL_SLEEP_TIME = 10  # Sleep time in seconds to respect the rate limit

note_title = f"Context: Threat Intel (network_flow)"
TEST = False

# Cache to store already scanned IPs
scan_cache = {}


def ensure_ticket_prefix(ticket_number):
    """
    Ensure the ticket number has the required MOCK- prefix.
    """
    if not ticket_number.startswith("MOCK-"):
        print(f"Adding MOCK- prefix to ticket number: {ticket_number}")
        return f"MOCK-{ticket_number}"
    return ticket_number


def is_private_ip(ip):
    """
    Check if an IP address is private.
    """
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return True  # Treat invalid IPs as private to exclude them


def search_network_flows(device_name, process_name):
    """
    Search network flows based on the provided device name and process name.
    """
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"process.name": process_name}},
                    {"term": {"host.name": device_name}},
                    {"exists": {"field": "destination.ip"}},
                    {"exists": {"field": "network.protocol"}},
                    {"exists": {"field": "network.community_id"}},
                    {"exists": {"field": "network.transport"}},
                    {"exists": {"field": "network.type"}},
                    {"exists": {"field": "network.direction"}}
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


def fetch_virustotal_details(ip):
    """
    Fetch threat intelligence details from VirusTotal for the given IP.
    Use caching to avoid re-scanning the same IP.
    """
    if not ip or ip == "N/A" or is_private_ip(ip):
        return {
            "Score": "Excluded (Private IP or Invalid)",
            "File Report": "N/A",
        }

    # Check if the IP is already cached
    if ip in scan_cache:
        return scan_cache[ip]

    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY
    }
    try:
        response = requests.get(VIRUSTOTAL_URL.format(ip), headers=headers)
        if response.status_code == 200:
            data = response.json().get("data", {}).get("attributes", {})
            score = f"{data.get('last_analysis_stats', {}).get('malicious', 0)}/" \
                    f"{data.get('last_analysis_stats', {}).get('harmless', 0) + data.get('last_analysis_stats', {}).get('malicious', 0) + data.get('last_analysis_stats', {}).get('suspicious', 0) + data.get('last_analysis_stats', {}).get('undetected', 0) + data.get('last_analysis_stats', {}).get('timeout', 0)} security vendors flagged this Address as malicious"
            file_report = f"https://www.virustotal.com/gui/ip-address/{ip}/details"
            result = {
                "Score": score,
                "File Report": file_report,
            }
            # Cache the result
            scan_cache[ip] = result
            return result
        else:
            result = {
                "Score": "N/A",
                "File Report": "N/A",
            }
            # Cache the result
            scan_cache[ip] = result
            return result
    except Exception as e:
        result = {
            "Score": "N/A",
            "File Report": "N/A",
        }
        # Cache the result
        scan_cache[ip] = result
        return result


def format_results(flows):
    """
    Format network flows into an HTML-friendly string, ensuring unique Community IDs.
    """
    formatted = ""
    seen_community_ids = set()

    for flow in flows:
        source = flow["_source"]
        community_id = source.get("network", {}).get("community_id", "N/A")

        # Ensure unique Community IDs
        if community_id in seen_community_ids:
            continue
        seen_community_ids.add(community_id)

        readable_timestamp = format_timestamp(source.get("@timestamp", "N/A"))
        message = source.get("message", "N/A")
        destination_ip = source.get("destination", {}).get("ip", "N/A")
        source_ip = source.get("source", {}).get("ip", "N/A")
        network = source.get("network", {})

        # Fetch VirusTotal details for Source and Destination IPs
        destination_ip_details = fetch_virustotal_details(destination_ip)
        source_ip_details = fetch_virustotal_details(source_ip)

        formatted += f"<b>Timestamp:</b> {readable_timestamp}<br>"
        formatted += f"<b>Message:</b> {message}<br>"
        formatted += f"<b>Source IP:</b> {source_ip} ({source_ip_details['Score']})<br>"
        if not is_private_ip(source_ip):
            formatted += f"<b>Source Report:</b> <a href='{source_ip_details['File Report']}' target='_blank'>Link</a><br>"
        formatted += f"<b>Destination IP:</b> {destination_ip} ({destination_ip_details['Score']})<br>"
        if not is_private_ip(destination_ip):
            formatted += f"<b>Destination Report:</b> <a href='{destination_ip_details['File Report']}' target='_blank'>Link</a><br>"
        formatted += f"<b>Network Details:</b><br>"
        formatted += f"- Community ID: {community_id}<br>"
        formatted += f"- Protocol: {network.get('protocol', 'N/A')}<br>"
        formatted += f"- Transport: {network.get('transport', 'N/A')}<br>"
        formatted += f"- Type: {network.get('type', 'N/A')}<br>"
        formatted += f"- Direction: {network.get('direction', 'N/A')}<br><br>"

    return formatted


def generate_note_body(ticket_number, network_flows):
    """
    Generate the note body for the ticket.
    """
    note_body = "<h2>Highlights (Hits)</h2>"
    note_body += f"Found {len(network_flows)} network flow(s).<br><br>"
    note_body += f"<h3>Network Flows:</h3><br><br>"
    note_body += format_results(network_flows)
    note_body += "<br><br><br><br>"
    return note_body


if __name__ == "__main__":
    # Ensure three parameters are passed
    if len(sys.argv) != 4:
        print("Usage: python network_flow.py <ticket_number> <device_name> <process_name>")
        sys.exit(1)

    # Get parameters from command line arguments
    ticket_number = sys.argv[1]
    device_name = sys.argv[2]
    process_name = sys.argv[3]

    # Ensure ticket number has the required prefix
    ticket_number = ensure_ticket_prefix(ticket_number)

    try:
        # Search for network flows
        network_flows = search_network_flows(device_name, process_name)

        # Generate the note body
        note_body = generate_note_body(ticket_number, network_flows)

        # Add the note to the ticket
        zs_add_note_to_ticket(ticket_number, "raw", TEST, note_title, note_body, "text/html")

        print(f"Note successfully added to ticket {ticket_number}.")

    except Exception as e:
        print(f"Error: {e}")
