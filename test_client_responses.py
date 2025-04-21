""" test_client_responses.py

Test for PyOTRS using **responses**
"""

import unittest

import requests
import responses

from pyotrs.lib import Client


class SendRequestResponsesTests(unittest.TestCase):
    """These test check both _send_request and _build_url"""

    def test__sr_session_create(self):
        """Test _send_request session_create - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "SessionCreate"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.POST,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Session',
                     json={'AccessToken': 'tMtTFDg1PxCX51dWnjue4W5oQtNsFd0k'},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"UserLogin": "u-foo", "Password": "p-bar"})

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_create(self):
        """Test _send_request ticket_create - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketCreate"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.POST,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Ticket',
                     json={'ArticleID': '2', 'TicketID': '2', 'TicketNumber': '000001'},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"bar": "ticket-create"})

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_get(self):
        """Test _send_request ticket_get - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketGet"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.GET,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Ticket/1',
                     json={'Ticket': [{'Age': 24040576,
                                       'ArchiveFlag': 'n',
                                       'ChangeBy': '1',
                                       'Changed': '2016-05-13 20:40:19',
                                       'CreateBy': '1',
                                       'StateType': 'open',
                                       'TicketID': '1',
                                       'TicketNumber': '2015071610123456',
                                       'Title': 'Welcome to OTRS2!',
                                       'Type': 'Unclassified',
                                       'TypeID': 1,
                                       'UnlockTimeout': '0',
                                       'UntilTime': 0}]},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"bla": "ticket-get"}, data_id=1)

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_get_list(self):
        """Test _send_request ticket_get - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketGetList"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.GET,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/TicketList',
                     json={'Ticket': [{'Age': 24040576,
                                       'ArchiveFlag': 'n',
                                       'ChangeBy': '1',
                                       'Changed': '2016-04-13 20:41:19',
                                       'CreateBy': '1',
                                       'StateType': 'open',
                                       'TicketID': '1',
                                       'TicketNumber': '2015071510123456',
                                       'Title': 'Welcome to OTRS!',
                                       'Type': 'Unclassified',
                                       'TypeID': 1,
                                       'UnlockTimeout': '0',
                                       'UntilTime': 0}]},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"bla": "ticket-get"})

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_search(self):
        """Test _send_request ticket_search - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketSearch"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.GET,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Ticket',
                     json={'TicketID': ['1']},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"bla": "ticket-search"})

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_update(self):
        """Test _send_request ticket_update - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketUpdate"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.PATCH,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Ticket/1',
                     json={'TicketID': '9', 'TicketNumber': '000008'},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload={"alb": "ticket-update"}, data_id=1)

        self.assertIsInstance(result, requests.Response)

    def test__sr_ticket_update_with_article(self):
        """Test _send_request ticket_update with article - mocked"""
        obj = Client(baseurl="http://fqdn")
        obj.operation = "TicketUpdate"
        obj._result_type = obj.ws_config[obj.operation]["Result"]

        art = {'Article': {'Subject': 'Dümmy Subject',
                           'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                           'TimeUnit': 0,
                           'MimeType': 'text/plain',
                           'Charset': 'UTF8'}}

        with responses.RequestsMock(assert_all_requests_are_fired=True) as rsps:
            rsps.add(responses.PATCH,
                     'http://fqdn/otrs/nph-genericinterface.pl/Webservice/'
                     'GenericTicketConnectorREST/Ticket/2',
                     json={'ArticleID': '2', 'TicketID': '2', 'TicketNumber': '000002'},
                     status=200,
                     content_type='application/json')

            result = obj._send_request(payload=art, data_id=2)

        self.assertIsInstance(result, requests.Response)


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
