import mysql.connector
from mysql.connector import Error
import argparse
from tabulate import tabulate

# Database configuration (same as main script)
DB_CONFIG = {
    'host': '127.0.0.1',
    'database': 'mssp',
    'port': 3306,
    'user': 'root',
    'password': 'the1Esmarta'
}

def query_iocs(entity):
    """Query database for specific IOC entity"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        query = """
        SELECT id, entity, host, state
        FROM IOCs
        WHERE entity = %s
        ORDER BY id DESC
        """
        
        cursor.execute(query, (entity,))
        results = cursor.fetchall()
        
        if not results:
            print(f"\nNo records found for entity: {entity}")
            return
            
        print(f"\nFound {len(results)} records for {entity}:")
        print(tabulate(results, headers="keys", tablefmt="psql"))
        
    except Error as e:
        print(f"Database error: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    parser = argparse.ArgumentParser(description='Query IOC database records')
    parser.add_argument('entity', help='IP address or domain name to search')
    args = parser.parse_args()
    
    query_iocs(args.entity)

if __name__ == "__main__":
    main()
