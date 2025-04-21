""" test_attachment.py

Test for PyOTRS Attachment class
"""

import json
import os.path
import sys
import unittest
from unittest import mock

from pyotrs.lib import Attachment

# make sure (early) that parent dir (main app) is in path
current_path = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(current_path, os.pardir))


class AttachmentTests(unittest.TestCase):
    def test_init_static(self):
        att = Attachment({'Content': 'YmFyCg==',
                          'ContentType': 'text/plain',
                          'Filename': 'dümmy1.txt'})
        self.assertIsInstance(att, Attachment)

    def test_init_no_file(self):
        att = Attachment({'Content': 'YnFyCg==',
                          'ContentType': 'text/plain'})
        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.__repr__(), '<Attachment>')

    def test_attachment_file(self):
        att = Attachment.create_basic("mFyCg==", "text/plain", "foo.txt")
        self.assertIsInstance(att, Attachment)

    def test_attachment_dummy_static(self):
        att = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy2.txt")
        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.__repr__(), '<Attachment: dümmy2.txt>')

    def test_attachment_dummy(self):
        att = Attachment._dummy()
        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.__repr__(), '<Attachment: dümmy.txt>')

    def test_dummy_static_dct(self):
        att = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy4.txt")
        self.assertDictEqual(att.to_dct(),
                             {'Content': 'YmFyCg==',
                              'ContentType': 'text/plain',
                              'Filename': 'dümmy4.txt'})

    def test_dummy_static_dct_unicode(self):
        att = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy5.txt")
        self.assertDictEqual(att.to_dct(),
                             {'Content': 'YmFyCg==',
                              'ContentType': 'text/plain',
                              'Filename': 'd\xfcmmy5.txt'})

    def test_attachment_create_from_file(self):
        """create_from_file test ending in .txt"""
        att = Attachment.create_from_file(os.path.join(current_path, "fixtures/a_file.txt"))

        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.ContentType, "text/plain")

        # Catches: TypeError: b'...' is not JSON serializable
        self.assertEqual(json.dumps(att.Content), '"InRoaXMgaXMgdGhlIGNvbnRlbnQgb2YgYSBmaWxlISIK"')

    def test_attachment_create_from_file_no_file_ext(self):
        """create_from_file test - no file ending -> mime needs to default"""
        att = Attachment.create_from_file(os.path.join(current_path, "fixtures/b_file"))

        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.ContentType, "application/octet-stream")

    def test_attachment_create_from_binary_file(self):
        """create_from_file with binary test file"""
        att = Attachment.create_from_file(os.path.join(current_path, "fixtures/logo_bg.png"))

        self.assertIsInstance(att, Attachment)
        self.assertEqual(att.ContentType, "image/png")

    def test_attachment_save_to_dir_invalid_no_filename(self):
        """save_to_dir test - invalid Attachment"""

        att = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy5.txt")
        att.__delattr__("Filename")

        self.assertRaisesRegex(ValueError,
                               "invalid Attachment",
                               att.save_to_dir,
                               "/tmp")

    def test_attachment_save_to_dir_invalid_no_content(self):
        """save_to_dir test - invalid Attachment"""

        att = Attachment.create_basic("mFyCg==", "text/plain", "foo.txt")
        att.__delattr__("Content")

        self.assertRaisesRegex(ValueError,
                               "invalid Attachment",
                               att.save_to_dir,
                               "/tmp")

    def test_attachment_save_to_dir(self):
        """save_to_dir test - ok"""
        att = Attachment.create_basic("YmFyCg==", "text/plain", "foo.txt")

        with mock.patch('pyotrs.lib.open', mock.mock_open()) as m:
            att.save_to_dir("/tmp")

        self.assertEqual(m.call_count, 1)
        self.assertEqual(m.call_args_list, [mock.call("/tmp/foo.txt", 'wb')])

    def test_attachment_save_to_dir_two(self):
        """save_to_dir test - ok"""
        att = Attachment.create_basic("YmFyCg==", "text/plain", "dümmy5.txt")

        with mock.patch('pyotrs.lib.open', mock.mock_open()) as m:
            att.save_to_dir()

        self.assertEqual(m.call_count, 1)
        self.assertEqual(m.call_args_list, [mock.call("/tmp/dümmy5.txt", 'wb')])


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
