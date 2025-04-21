""" test_ticket.py

Test for PyOTRS Ticket class
"""

import unittest
from datetime import datetime

from pyotrs.lib import (
    ArgumentInvalidError,
    ArgumentMissingError,
    Article,
    DynamicField,
    Ticket,
)


class TicketTests(unittest.TestCase):

    def test_init(self):
        tic = Ticket(dct={'Title': 'foo'})
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_init_nested_dct(self):
        tic = Ticket(dct={'Title': 'foo',
                          'SomeField': 'SomeValue',
                          'SomeDict': {'NestedDictField1': "Value1",
                                       'NestedDictField2': "Value2"}})
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_init_parse_from_dct(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')
        self.assertEqual(tic.articles[0].__repr__(), "<ArticleID: 30 (1 Attachment)>")

    def test_dynamic_field_get_none(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertIsNone(tic.dynamic_field_get("rgiosregoisrengi"))

    def test_dynamic_field_get_success(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertIsInstance(tic.dynamic_field_get("firstname"), DynamicField)
        self.assertEqual(tic.dynamic_field_get("firstname").value, 'Jane')
        self.assertEqual(tic.field_get("Title"), 'Baesic Ticket')

    def test_article_get_none(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertIsNone(tic.article_get("666"))

    def test_article_get_str_success(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertIsInstance(tic.article_get("30"), Article)
        self.assertEqual(tic.article_get("30").field_get("ArticleType"), 'webrequest')

    def test_article_get_int_success(self):
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }
        tic = Ticket(tic_dct)
        self.assertIsInstance(tic, Ticket)
        self.assertIsInstance(tic.article_get(30), Article)
        self.assertEqual(tic.article_get(30).field_get("ArticleType"), 'webrequest')

    def test_create_basic_no_title(self):
        self.assertRaisesRegex(ArgumentMissingError, 'Title is required', Ticket.create_basic)

    def test_create_basic_title_no_queue(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Either Queue or QueueID required',
                               Ticket.create_basic,
                               Title='foobar')

    def test_create_basic_title_queue_no_state1(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Either State or StateID required',
                               Ticket.create_basic,
                               Title='foobar',
                               Queue='some_queue')

    def test_create_basic_title_queue_no_state2(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Either State or StateID required',
                               Ticket.create_basic,
                               Title='foobar',
                               QueueID='1')

    def test_create_basic_title_queue_state_no_prio1(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Either Priority or PriorityID required',
                               Ticket.create_basic,
                               Title='foobar',
                               Queue='some_queue',
                               State='open')

    def test_create_basic_title_queue_state_no_prio2(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Either Priority or PriorityID required',
                               Ticket.create_basic,
                               Title='foobar',
                               QueueID='1',
                               StateID='2')

    def test_create_basic_title_queue_state_prio_no_customer1(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'CustomerUser is required',
                               Ticket.create_basic,
                               Title='foobar',
                               Queue='raw',
                               StateID='2',
                               Priority='average')

    def test_create_basic_title_queue_state_prio_no_customer2(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'CustomerUser is required',
                               Ticket.create_basic,
                               Title='foobar',
                               QueueID='1',
                               State='open',
                               PriorityID='average')

    def test_create_basic_title_both_type_and_typeid(self):
        self.assertRaisesRegex(ArgumentInvalidError,
                               'Either Type or TypeID - not both',
                               Ticket.create_basic,
                               Title='foobar',
                               QueueID='1',
                               State='open',
                               PriorityID='average',
                               CustomerUser='root@localhost',
                               Type='barfoo',
                               TypeID='2')

    def test_create_basic_title_queue_state_prio_customer_one(self):
        tic = Ticket.create_basic(Title='foobar',
                                  QueueID='1',
                                  Type='barfoo',
                                  State='open',
                                  PriorityID='average',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_create_basic_title_queue_state_prio_customer_two(self):
        tic = Ticket.create_basic(Title='foobar',
                                  Queue='raw',
                                  TypeID='2',
                                  State='open',
                                  PriorityID='5',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_create_basic_title_queue_state_prio_customer_three(self):
        tic = Ticket.create_basic(Title='foobar',
                                  Queue='raw',
                                  StateID='4',
                                  PriorityID='3',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_create_basic_title_queue_state_prio_customer_four(self):
        tic = Ticket.create_basic(Title='foobar',
                                  Queue='raw',
                                  StateID='4',
                                  Priority='average',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        self.assertEqual(tic.__repr__(), '<Ticket>')

    def test_create_basic_title_queue_state_prio_customer_five(self):
        tic = Ticket.create_basic(Title='foobar',
                                  Queue='raw',
                                  StateID='4',
                                  Priority='average',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        tic.tid = '5'
        self.assertEqual(tic.__repr__(), '<Ticket: 5>')

    def test_create_basic_title_queue_state_prio_customer_to_dct(self):
        tic = Ticket.create_basic(Title='foobar',
                                  QueueID='1',
                                  State='open',
                                  PriorityID='5',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {'Title': 'foobar',
                                         'QueueID': '1',
                                         'State': 'open',
                                         'PriorityID': '5',
                                         'CustomerUser': 'root@localhost'}})

    def test_pending_text(self):
        tic = Ticket.create_basic(Title='foobar',
                                  QueueID='1',
                                  State='open',
                                  PriorityID='5',
                                  CustomerUser='root@localhost')

        self.assertDictEqual(tic.datetime_to_pending_time_text(datetime(1, 2, 3, 4, 5)),
                             {'Day': 3,
                              'Hour': 4,
                              'Minute': 5,
                              'Month': 2,
                              'Year': 1})

    def test_ticket_to_dct_no_articles_dynamic_fields(self):
        tic = Ticket.create_basic(Title='foobar',
                                  QueueID='1',
                                  State='open',
                                  PriorityID='5',
                                  CustomerUser='root@localhost')
        self.assertIsInstance(tic, Ticket)
        delattr(tic, 'articles')
        delattr(tic, 'dynamic_fields')
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {'Title': 'foobar',
                                         'QueueID': '1',
                                         'State': 'open',
                                         'PriorityID': '5',
                                         'CustomerUser': 'root@localhost'}})

    def test_to_dct_full(self):
        self.maxDiff = None
        tic_dct = {
            'TypeID': '1',
            'Title': 'Baesic Ticket',
            'Article': [{
                'Age': 82383,
                'AgeTimeUnix': 82383,
                'ArticleID': '30',
                'ArticleType': 'webrequest',
                'ArticleTypeID': '8',
                'Attachment': [
                    {
                        'Content': 'mFyC',
                        'ContentAlternative': '',
                        'ContentID': '',
                        'ContentType': 'text/plain',
                        'Disposition': 'attachment',
                        'Filename': 'foo.txt',
                        'Filesize': '3 Bytes',
                        'FilesizeRaw': '3'
                    }
                ],
                'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                'Cc': '',
                'CustomerID': None,
                'CustomerUserID': None,
                'EscalationResponseTime': '0',
                'EscalationSolutionTime': '0'
            }],
            'DynamicField': [
                {
                    'Name': 'ProcessManagementActivityID',
                    'Value': None
                },
                {
                    'Name': 'ProcessManagementProcessID',
                    'Value': None
                },
                {
                    'Name': 'firstname',
                    'Value': 'Jane'
                },
                {
                    'Name': 'lastname',
                    'Value': 'Doe'
                }
            ],
        }

        tic = Ticket(tic_dct)
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {
                                 'TypeID': '1',
                                 'Title': 'Baesic Ticket',
                                 'Article': [{
                                     'Age': 82383,
                                     'AgeTimeUnix': 82383,
                                     'ArticleID': '30',
                                     'ArticleType': 'webrequest',
                                     'ArticleTypeID': '8',
                                     'Attachment': [
                                         {
                                             'Content': 'mFyC',
                                             'ContentAlternative': '',
                                             'ContentID': '',
                                             'ContentType': 'text/plain',
                                             'Disposition': 'attachment',
                                             'Filename': 'foo.txt',
                                             'Filesize': '3 Bytes',
                                             'FilesizeRaw': '3'
                                         }
                                     ],
                                     'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                                     'Cc': '',
                                     'CustomerID': None,
                                     'CustomerUserID': None,
                                     'EscalationResponseTime': '0',
                                     'EscalationSolutionTime': '0'
                                 }],
                                 'DynamicField': [
                                     {
                                         'Name': 'ProcessManagementActivityID',
                                         'Value': None
                                     },
                                     {
                                         'Name': 'ProcessManagementProcessID',
                                         'Value': None
                                     },
                                     {
                                         'Name': 'firstname',
                                         'Value': 'Jane'
                                     },
                                     {
                                         'Name': 'lastname',
                                         'Value': 'Doe'
                                     }
                                 ],
                             }})

    def test_dummy(self):
        tic = Ticket._dummy()
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {'Queue': 'Raw',
                                         'State': 'open',
                                         'Priority': '3 normal',
                                         'CustomerUser': 'root@localhost',
                                         'Title': 'Bäsic Ticket'}})

    def test_field_add(self):
        tic = Ticket.create_basic(Title='foobar',
                                  QueueID='1',
                                  State='open',
                                  PriorityID='5',
                                  CustomerUser='root@localhost')
        new_fields = {"SLA": "1h", "Service": "Ticket-Service"}
        tic.field_add(new_fields)
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {'Title': 'foobar',
                                         'QueueID': '1',
                                         'State': 'open',
                                         'PriorityID': '5',
                                         'CustomerUser': 'root@localhost',
                                         'SLA': '1h',
                                         'Service': 'Ticket-Service'}})

        fields = tic.field_add(OtrsField="Some OTRS field")
        self.assertDictEqual(fields, {'Title': 'foobar',
                                      'QueueID': '1',
                                      'State': 'open',
                                      'PriorityID': '5',
                                      'CustomerUser': 'root@localhost',
                                      'SLA': '1h',
                                      'Service': 'Ticket-Service',
                                      'OtrsField': 'Some OTRS field'})
        self.assertDictEqual(tic.to_dct(),
                             {'Ticket': {'Title': 'foobar',
                                         'QueueID': '1',
                                         'State': 'open',
                                         'PriorityID': '5',
                                         'CustomerUser': 'root@localhost',
                                         'SLA': '1h',
                                         'Service': 'Ticket-Service',
                                         'OtrsField': 'Some OTRS field'}})


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
