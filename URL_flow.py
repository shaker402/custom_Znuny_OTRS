import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import ipaddress
import base64
from integrations.znuny_otrs import zs_add_note_to_ticket

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"

# VirusTotal API Key
VIRUSTOTAL_API_KEY = "a5d3f39ee162dd26de22480d91d4553169410a4615810ade7cfc7705112b6184"
VIRUSTOTAL_URL_IP = "https://www.virustotal.com/api/v3/ip_addresses/{}"
VIRUSTOTAL_URL_SUBMIT = "https://www.virustotal.com/api/v3/urls"
VIRUSTOTAL_URL_REPORT = "https://www.virustotal.com/api/v3/analyses/{}"

note_title = f"Context: Threat Intel (URL_Flow)"
TEST = False

# Cache to store already scanned IPs and URLs
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


def search_network_flows(device_name, destination_ip):
    """
    Search network flows based on the provided device name and destination IP.
    """
    query = {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"destination.ip": destination_ip}},
                    {"term": {"host.name": device_name}}
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


def fetch_virustotal_details(data, data_type):
    """
    Fetch threat intelligence details from VirusTotal for the given data (IP or URL).
    Use caching to avoid re-scanning the same data.
    """
    if not data or data == "N/A" or (data_type == "ip" and is_private_ip(data)):
        return {
            "Score": "Excluded (Private IP or Invalid Data)",
            "File Report": "N/A",
        }

    # Check if the data is already cached
    if data in scan_cache:
        return scan_cache[data]

    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY
    }

    try:
        if data_type == "ip":
            # Fetch IP details
            response = requests.get(VIRUSTOTAL_URL_IP.format(data), headers=headers)
            if response.status_code == 200:
                data_response = response.json().get("data", {}).get("attributes", {})
                score = f"{data_response.get('last_analysis_stats', {}).get('malicious', 0)}/" \
                        f"{data_response.get('last_analysis_stats', {}).get('harmless', 0) + data_response.get('last_analysis_stats', {}).get('malicious', 0) + data_response.get('last_analysis_stats', {}).get('suspicious', 0) + data_response.get('last_analysis_stats', {}).get('undetected', 0) + data_response.get('last_analysis_stats', {}).get('timeout', 0)} security vendors flagged this as malicious"
                file_report = f"https://www.virustotal.com/gui/ip-address/{data}/details"
                result = {
                    "Score": score,
                    "File Report": file_report,
                }
                scan_cache[data] = result
                return result
        elif data_type == "url":
            # Submit URL for analysis
            encoded_url = base64.urlsafe_b64encode(data.encode()).decode().strip("=")
            submission_response = requests.post(
                VIRUSTOTAL_URL_SUBMIT,
                headers=headers,
                json={"url": data}
            )
            if submission_response.status_code == 200:
                analysis_id = submission_response.json().get("data", {}).get("id", "")
                if analysis_id:
                    # Fetch analysis report
                    report_response = requests.get(VIRUSTOTAL_URL_REPORT.format(analysis_id), headers=headers)
                    if report_response.status_code == 200:
                        data_response = report_response.json().get("data", {}).get("attributes", {})
                        score = f"{data_response.get('stats', {}).get('malicious', 0)}/" \
                                f"{data_response.get('stats', {}).get('harmless', 0) + data_response.get('stats', {}).get('malicious', 0) + data_response.get('stats', {}).get('suspicious', 0) + data_response.get('stats', {}).get('undetected', 0)} security vendors flagged this as malicious"
                        file_report = f"https://www.virustotal.com/gui/url/{encoded_url}/details"
                        result = {
                            "Score": score,
                            "File Report": file_report,
                        }
                        scan_cache[data] = result
                        return result
        return {"Score": "N/A", "File Report": "N/A"}
    except Exception as e:
        print(f"Error fetching VirusTotal details: {e}")
        return {"Score": "N/A", "File Report": "N/A"}


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

        process_name = source.get("process", {}).get("name", "N/A")
        message = source.get("message", "N/A")
        source_ip = source.get("source", {}).get("ip", "N/A")
        destination_ip = source.get("destination", {}).get("ip", "N/A")
        destination_domain = source.get("destination", {}).get("domain", "N/A")
        url_full = source.get("url", {}).get("full", "N/A")
        network_traffic = source.get("network_traffic", {}).get("http", {}).get("query", "N/A")

        # Fetch VirusTotal details for IPs and URL
        source_ip_details = fetch_virustotal_details(source_ip, "ip")
        destination_ip_details = fetch_virustotal_details(destination_ip, "ip")
        url_details = fetch_virustotal_details(url_full, "url") if url_full != "N/A" else {"Score": "N/A", "File Report": "N/A"}

        formatted += f"<b>Process Name:</b> {process_name}<br>"
        formatted += f"<b>Message:</b> {message}<br>"
        formatted += f"<b>Source IP:</b> {source_ip} ({source_ip_details['Score']})<br>"
        formatted += f"<b>Destination IP:</b> {destination_ip} ({destination_ip_details['Score']})<br>"
        formatted += f"<b>Destination Domain:</b> {destination_domain}<br>"
        if url_full != "N/A":
            formatted += f"<b>URL:</b> {url_full} ({url_details['Score']})<br>"
            formatted += f"<b>URL Report:</b> <a href='{url_details['File Report']}' target='_blank'>Link</a><br>"
        formatted += f"<b>Network Traffic Query:</b> {network_traffic}<br><br>"

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
        print("Usage: python network_flow.py <ticket_number> <device_name> <destination_ip>")
        sys.exit(1)

    # Get parameters from command line arguments
    ticket_number = sys.argv[1]
    device_name = sys.argv[2]
    destination_ip = sys.argv[3]

    # Ensure ticket number has the required prefix
    ticket_number = ensure_ticket_prefix(ticket_number)

    try:
        # Search for network flows
        network_flows = search_network_flows(device_name, destination_ip)

        # Generate the note body
        note_body = generate_note_body(ticket_number, network_flows)

        # Add the note to the ticket
        zs_add_note_to_ticket(ticket_number, "raw", TEST, note_title, note_body, "text/html")

        print(f"Note successfully added to ticket {ticket_number}.")

    except Exception as e:
        print(f"Error: {e}")
