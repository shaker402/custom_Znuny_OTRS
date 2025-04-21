""" test_article.py

Test for PyOTRS Article class
"""

import os.path
import sys
import unittest

from pyotrs.lib import Article, Attachment, DynamicField

# make sure (early) that parent dir (main app) is in path
current_path = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(current_path, os.pardir))


class ArticleTests(unittest.TestCase):
    def test_dummy(self):
        art = Article._dummy()
        self.assertIsInstance(art, Article)
        self.assertRegex(art.__repr__(), '<Article.*')

    def test_dummy_to_dct(self):
        self.maxDiff = None
        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8'}

        art = Article._dummy()
        self.assertDictEqual(art.to_dct(), expected)

    def test_dummy_force_notify(self):
        self.maxDiff = None
        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8',
                    "ForceNotificationToUserID": [1, 2]}

        art = Article._dummy_force_notify()
        self.assertDictEqual(art.to_dct(), expected)

    def test_dummy_static_with_article_id(self):
        self.maxDiff = None
        art = Article({"Subject": "Dümmy Subject",
                       "Body": "Hallo Bjørn,\n[kt]\n\n -- The End",
                       "ArticleID": 5,
                       "TimeUnit": 0,
                       "MimeType": "text/plain",
                       "Charset": "UTF8"})

        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'ArticleID': 5,
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8'}

        self.assertDictEqual(art.to_dct(), expected)
        self.assertEqual(art.__repr__(), "<ArticleID: 5>")

    def test_dummy_static_with_no_article_id(self):
        self.maxDiff = None
        art = Article({"Subject": "Dümmy Subject",
                       "Body": "Hallo Bjørn,\n[kt]\n\n -- The End",
                       "TimeUnit": 0,
                       "MimeType": "text/plain",
                       "Charset": "UTF8"})

        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8'}

        self.assertDictEqual(art.to_dct(), expected)
        self.assertEqual(art.__repr__(), "<Article>")
        self.assertEqual(art.aid, 0)

    def test_dummy_static_with_article_id_one_att(self):
        self.maxDiff = None
        att = Attachment.create_basic("mFyCg==", "text/plain", "foo.txt")
        art = Article({"Subject": "Dümmy Subject",
                       "Body": "Hallo Bjørn,\n[kt]\n\n -- The End",
                       "ArticleID": 3,
                       "TimeUnit": 0,
                       "MimeType": "text/plain",
                       "Charset": "UTF8"})

        art.attachments = [att]

        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'ArticleID': 3,
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8',
                    'Attachment': [{'Content': 'mFyCg==',
                                    'ContentType': 'text/plain',
                                    'Filename': 'foo.txt'}]}

        self.assertDictEqual(art.to_dct(), expected)
        self.assertEqual(art.__repr__(), "<ArticleID: 3 (1 Attachment)>")

    def test_dummy_static_with_article_id_two_att(self):
        self.maxDiff = None
        att1 = Attachment.create_basic("mFyCg==", "text/plain", "foo.txt")
        att2 = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy.txt")
        art = Article({"Subject": "Dümmy Subject",
                       "Body": "Hallo Bjørn,\n[kt]\n\n -- The End",
                       "ArticleID": 4,
                       "TimeUnit": 0,
                       "MimeType": "text/plain",
                       "Charset": "UTF8"})

        art.attachments = [att1, att2]

        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'ArticleID': 4,
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8',
                    'Attachment': [{'Content': 'mFyCg==',
                                    'ContentType': 'text/plain',
                                    'Filename': 'foo.txt'},
                                   {'Content': 'YmFyCg==',
                                    'ContentType': 'text/plain',
                                    'Filename': 'dümmy.txt'}]}

        self.assertDictEqual(art.to_dct(), expected)
        self.assertEqual(art.__repr__(), "<ArticleID: 4 (2 Attachments)>")

    def test_dummy_static_with_article_id_two_att_ignore_content(self):
        self.maxDiff = None
        att1 = Attachment.create_basic("mFyCg==", "text/plain", "foo.txt")
        att2 = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy.txt")
        art = Article({"Subject": "Dümmy Subject",
                       "Body": "Hallo Bjørn,\n[kt]\n\n -- The End",
                       "ArticleID": 4,
                       "TimeUnit": 0,
                       "MimeType": "text/plain",
                       "Charset": "UTF8"})

        art.attachments = [att1, att2]

        expected = {'Subject': 'Dümmy Subject',
                    'Body': 'Hallo Bjørn,\n[kt]\n\n -- The End',
                    'ArticleID': 4,
                    'TimeUnit': 0,
                    'MimeType': 'text/plain',
                    'Charset': 'UTF8',
                    'Attachment': [{'ContentType': 'text/plain',
                                    'Filename': 'foo.txt'},
                                   {'ContentType': 'text/plain',
                                    'Filename': 'dümmy.txt'}]}

        self.assertDictEqual(art.to_dct(attachment_cont=False), expected)
        self.assertEqual(art.__repr__(), "<ArticleID: 4 (2 Attachments)>")

    def test_article_parse_attachment_from_dct_one_attachments(self):
        art_dct = {
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
            'EscalationResponseTime': '0',
            'EscalationSolutionTime': '0',
        }

        art = Article(art_dct)
        att_l = art.attachments

        att_expected = Attachment({
            'Content': 'mFyC',
            'ContentAlternative': '',
            'ContentID': '',
            'ContentType': 'text/plain',
            'Disposition': 'attachment',
            'Filename': 'foo.txt',
            'Filesize': '3 Bytes',
            'FilesizeRaw': '3'
        })

        self.assertIsInstance(art, Article)
        self.assertDictEqual(att_l[0].to_dct(), att_expected.to_dct())
        self.assertIsInstance(art.attachment_get('foo.txt'), Attachment)
        self.assertIsNone(art.attachment_get('non-existent.txt'))
        self.assertIsNone(art.dynamic_field_get('non-existent'))
        self.assertIsInstance(art.dynamic_field_get('firstname'), DynamicField)
        self.assertIsInstance(art.to_dct(), dict)

    def test_article_parse_attachment_from_dct_one_attachments_two(self):
        art_dct = {
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
            'EscalationResponseTime': '0',
            'EscalationSolutionTime': '0',
        }

        art = Article(art_dct)
        att_l = art.attachments

        att_expected = Attachment({
            'Content': 'mFyC',
            'ContentAlternative': '',
            'ContentID': '',
            'ContentType': 'text/plain',
            'Disposition': 'attachment',
            'Filename': 'foo.txt',
            'Filesize': '3 Bytes',
            'FilesizeRaw': '3'
        })

        self.assertIsInstance(art, Article)
        self.assertDictEqual(att_l[0].to_dct(), att_expected.to_dct())
        self.assertIsInstance(art.attachment_get('foo.txt'), Attachment)
        self.assertIsNone(art.attachment_get('non-existent.txt'))
        self.assertIsNone(art.dynamic_field_get('non-existent'))

    def test_article_parse_attachment_from_dct_two_attachments(self):
        art_dct = {
            'Age': 82383,
            'AgeTimeUnix': 82383,
            'ArticleID': '30',
            'ArticleType': 'webrequest',
            'ArticleTypeID': '8',
            'Attachment': [
                {
                    'Content': 'YmFyCg==',
                    'ContentAlternative': '',
                    'ContentID': '',
                    'ContentType': 'text/plain',
                    'Disposition': 'attachment',
                    'Filename': 'dümmy.txt',
                    'Filesize': '4 Bytes',
                    'FilesizeRaw': '4'
                },
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
            'Changed': '2016-04-24 18:20:59',
            'Charset': 'utf8',
            'ContentCharset': 'utf8',
            'ContentType': 'text/plain; charset=utf8',
            'CreateTimeUnix': '1461444368',
            'Created': '2016-04-23 20:46:08',
            'CreatedBy': '1',
            'CustomerID': None,
            'CustomerUserID': None,
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
            'EscalationResponseTime': '0',
            'EscalationSolutionTime': '0',
            'EscalationTime': '0',
            'EscalationUpdateTime': '0',
            'From': 'root@localhost',
            'FromRealname': 'root@localhost',
            'InReplyTo': '',
            'IncomingTime': '1461444368',
            'Lock': 'unlock',
            'LockID': '1',
            'MessageID': '',
            'MimeType': 'text/plain',
            'Owner': 'root@localhost',
            'OwnerID': '1',
            'Priority': '3 normal',
            'PriorityID': '3',
            'Queue': 'Raw',
            'QueueID': '2',
            'RealTillTimeNotUsed': '0',
            'References': '',
            'ReplyTo': '',
            'Responsible': 'root@localhost',
            'ResponsibleID': '1',
            'SLA': '',
            'SLAID': None,
            'SenderType': 'agent',
            'SenderTypeID': '1',
            'Service': '',
            'ServiceID': None,
            'State': 'open',
            'StateID': '4',
            'StateType': 'open',
            'Subject': 'Dümmy Subject',
            'TicketID': '10',
            'TicketNumber': '000009',
            'Title': 'Bäsic Ticket',
            'To': 'Raw',
            'ToRealname': 'Raw',
            'Type': 'Unclassified',
            'TypeID': '1',
            'UntilTime': 0
        }

        art = Article(art_dct)
        self.assertIsInstance(art, Article)

    def test_validation(self):
        """Article validation; blacklisted fields should be removed, others should be added"""
        expected = {'Subject': 'This Article only has Subject',
                    'Body': 'and Body and needs to be completed.'}

        expected_validated = {'Subject': 'This Article only has Subject',
                              'Body': 'and Body and needs to be completed.',
                              'TimeUnit': 0,
                              'MimeType': 'text/plain',
                              'Charset': 'UTF8'}

        art = Article({'Subject': 'This Article only has Subject',
                       'Body': 'and Body and needs to be completed.'})

        self.assertIsInstance(art, Article)
        self.assertDictEqual(art.to_dct(), expected)

        art.validate()
        self.assertDictEqual(art.to_dct(), expected_validated)

    def test_validation_custom(self):
        """Article validation; blacklisted fields should be removed, others should be added"""

        custom_validation = {"Body": "API created Article Body",
                             "Charset": "UTF8",
                             "SpecialField": "SpecialValue",
                             "MimeType": "text/plain",
                             "Subject": "API created Article",
                             "TimeUnit": 0}

        expected_validated = {'Subject': 'This Article only has Subject',
                              'Body': 'and Body and needs to be completed.',
                              'TimeUnit': 0,
                              'MimeType': 'text/plain',
                              'Charset': 'UTF8',
                              'SpecialField': 'SpecialValue'}

        art = Article({'Subject': 'This Article only has Subject',
                       'Body': 'and Body and needs to be completed.'})

        art.validate(validation_map=custom_validation)
        self.assertDictEqual(art.to_dct(), expected_validated)


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
