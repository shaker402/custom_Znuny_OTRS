import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import sys
import time
from integrations.znuny_otrs import zs_add_note_to_ticket

# Replace these variables with your Elasticsearch credentials and base URL
ELASTICSEARCH_URL = "https://127.0.0.1/elasticsearch"
USERNAME = "elastic"
PASSWORD = "changeme"

# VirusTotal API Key
VIRUSTOTAL_API_KEY = "a5d3f39ee162dd26de22480d91d4553169410a4615810ade7cfc7705112b6184"
VIRUSTOTAL_URL = "https://www.virustotal.com/api/v3/domains/{}"

# VirusTotal API Rate Limit
VIRUSTOTAL_RATE_LIMIT = 4  # 4 requests per minute
VIRUSTOTAL_SLEEP_TIME = 10  # Sleep time in seconds to respect the rate limit

note_title = f"Context: Threat Intel (DNS_flow)"
TEST = False

# Cache to store already scanned domains
scan_cache = {}


def ensure_ticket_prefix(ticket_number):
    """
    Ensure the ticket number has the required MOCK- prefix.
    """
    if not ticket_number.startswith("MOCK-"):
        print(f"Adding MOCK- prefix to ticket number: {ticket_number}")
        return f"MOCK-{ticket_number}"
    return ticket_number


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
                    {"exists": {"field": "dns.question.registered_domain"}}
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


def fetch_virustotal_details(registered_domain):
    """
    Fetch threat intelligence details from VirusTotal for the given registered domain.
    Use caching to avoid re-scanning the same domain.
    """
    if not registered_domain or registered_domain == "N/A":
        return {
            "Score": "Excluded (Invalid Domain)",
            "File Report": "N/A",
        }

    # Check if the domain is already cached
    if registered_domain in scan_cache:
        return scan_cache[registered_domain]

    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY
    }
    try:
        response = requests.get(VIRUSTOTAL_URL.format(registered_domain), headers=headers)
        if response.status_code == 200:
            data = response.json().get("data", {}).get("attributes", {})
            score = f"{data.get('last_analysis_stats', {}).get('malicious', 0)}/" \
                    f"{data.get('last_analysis_stats', {}).get('harmless', 0) + data.get('last_analysis_stats', {}).get('malicious', 0) + data.get('last_analysis_stats', {}).get('suspicious', 0) + data.get('last_analysis_stats', {}).get('undetected', 0) + data.get('last_analysis_stats', {}).get('timeout', 0)} security vendors flagged this domain as malicious"
            file_report = f"https://www.virustotal.com/gui/domain/{registered_domain}/details"
            result = {
                "Score": score,
                "File Report": file_report,
            }
            # Cache the result
            scan_cache[registered_domain] = result
            return result
        else:
            result = {
                "Score": "N/A",
                "File Report": "N/A",
            }
            # Cache the result
            scan_cache[registered_domain] = result
            return result
    except Exception as e:
        result = {
            "Score": "N/A",
            "File Report": "N/A",
        }
        # Cache the result
        scan_cache[registered_domain] = result
        return result


def format_results(flows):
    """
    Format network flows into an HTML-friendly string.
    """
    formatted = ""
    seen_domains = set()  # To track already processed domains

    for flow in flows:
        source = flow["_source"]
        process_name = source.get("process", {}).get("name", "N/A")
        message = source.get("message", "N/A")
        dns = source.get("dns", {})
        registered_domain = dns.get("question", {}).get("registered_domain", "N/A")

        # Skip duplicate domains
        if registered_domain in seen_domains:
            continue
        seen_domains.add(registered_domain)

        # Fetch VirusTotal details for the registered domain
        domain_details = fetch_virustotal_details(registered_domain)

        formatted += f"<b>Process Name:</b> {process_name}<br>"
        formatted += f"<b>Message:</b> {message}<br>"
        formatted += f"<b>Registered Domain:</b> {registered_domain} ({domain_details['Score']})<br>"
        formatted += f"<b>Domain Report:</b> <a href='{domain_details['File Report']}' target='_blank'>Link</a><br>"
        formatted += f"<b>DNS Details:</b><br>"
        formatted += f"- Resolved IP: {', '.join(dns.get('resolved_ip', []))}<br>"
        formatted += f"- Response Code: {dns.get('response_code', 'N/A')}<br>"
        formatted += f"- Question Name: {dns.get('question', {}).get('name', 'N/A')}<br>"
        formatted += f"- Subdomain: {dns.get('question', {}).get('subdomain', 'N/A')}<br>"
        formatted += f"- Top-Level Domain: {dns.get('question', {}).get('top_level_domain', 'N/A')}<br>"
        formatted += f"- Type: {dns.get('question', {}).get('type', 'N/A')}<br>"
        formatted += f"- Class: {dns.get('question', {}).get('class', 'N/A')}<br><br>"

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
        print("Usage: python DNS_flow.py <ticket_number> <device_name> <process_name>")
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
        print(f"Error: {e}")  # This line is now properly closed

# Import statement is correct now
import requests
