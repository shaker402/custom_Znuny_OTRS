""" test_session_store.py

Test for PyOTRS Client class
"""

import unittest
from unittest import mock

from pyotrs.lib import ArgumentMissingError, SessionStore

TMP_SESSION_STORE_FILE_NAME = "/tmp/.session_id_store"


class SessionStoreTests(unittest.TestCase):
    def test_init_no_file(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Argument file_path is required!',
                               SessionStore)

    def test_init_no_timeout(self):
        self.assertRaisesRegex(ArgumentMissingError,
                               'Argument session_timeout is required!',
                               SessionStore,
                               file_path='/tmp/.foo.bar')

    def test_init_ok(self):
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)
        self.assertIsInstance(sis, SessionStore)

    def test_init_ok_repr(self):
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)
        self.assertEqual(sis.__repr__(), f'<SessionStore: {TMP_SESSION_STORE_FILE_NAME}>')

    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_no_file(self, mock_isfile):
        """Tests _read_session_id_from_file no file"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = False
        result = sis.read()

        self.assertIsNone(result)
        self.assertEqual(mock_isfile.call_count, 1)
        mock_isfile.assert_called_with(TMP_SESSION_STORE_FILE_NAME)

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_w_invalid_file(self, mock_isfile, mock_validation):
        """Tests read with an invalid file"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = False

        result = sis.read()

        self.assertIsNone(result)
        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_validation.call_count, 1)

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_w_file_valid_json(self, mock_isfile, mock_validation):
        """Tests read with a file with valid json but in past"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        r_data = '{"created": "1", "session_id": "foo2"}'

        with mock.patch('pyotrs.lib.open', mock.mock_open(read_data=r_data)) as m:
            result = sis.read()

        m.assert_called_once_with(TMP_SESSION_STORE_FILE_NAME)
        self.assertNotEqual(result, 'foo2')

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_valid_json_sid_in_p(self, mock_isfile, mock_validation):
        """Tests _read_session_id_from_file with a file with valid json and sid in past"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        r_data = '{"created": "1", "session_id": "foo3"}'

        with mock.patch('pyotrs.lib.open',
                        mock.mock_open(read_data=r_data)) as m:
            result = sis.read()

        m.assert_called_once_with(TMP_SESSION_STORE_FILE_NAME)
        self.assertIsNone(result)

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_valid_json_sid_in_f(self, mock_isfile, mock_validation):
        """Tests _read_session_id_from_file with a file with valid json and sid in future"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        r_data = '{"created": "2147483646", "session_id": "foo4"}'

        with mock.patch('pyotrs.lib.open',
                        mock.mock_open(read_data=r_data)) as m:
            result = sis.read()

        m.assert_called_once_with(TMP_SESSION_STORE_FILE_NAME)
        self.assertEqual(result, 'foo4')

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_valid_json_in_f_no_sid(self, mock_isfile, mock_validation):
        """Tests read with a file with valid json; created in future but no sid -> KeyError"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        r_data = '{"created": "2147483646", "no_s_id": "fake"}'

        with mock.patch('pyotrs.lib.open', mock.mock_open(read_data=r_data)) as m:
            result = sis.read()

        self.assertIsNone(result)
        m.assert_called_once_with(TMP_SESSION_STORE_FILE_NAME)

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.json.loads', autospec=True)
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_w_file_val_exception(self, mock_isfile, mock_json_loads, mock_validation):
        """Tests _read_session_id_from_file with a file with an ValueError exception"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        mock_json_loads.side_effect = ValueError("Some value exception")
        r_data = 'invalid_json'

        with mock.patch('pyotrs.lib.open',
                        mock.mock_open(read_data=r_data)) as m:
            result = sis.read()
        self.assertIsNone(result)
        m.assert_called_once_with('/tmp/.session_id_store')

    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.json.loads', autospec=True)
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_read_w_file_unc_exception(self, mock_isfile, mock_json_loads, mock_validation):
        """Tests _read_session_id_from_file with a file with an uncaught exception"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)

        mock_isfile.return_value = True
        mock_validation.return_value = True
        mock_json_loads.side_effect = Exception("Some exception")
        r_data = 'invalid_json'

        with mock.patch('pyotrs.lib.open',
                        mock.mock_open(read_data=r_data)) as m:
            self.assertRaisesRegex(Exception,
                                   'Exception Type',
                                   sis.read)

        m.assert_called_once_with(TMP_SESSION_STORE_FILE_NAME)

    @mock.patch('pyotrs.lib.os.chmod', autospec=True)
    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_write_mock_open_file_exists_nok(self, mock_isfile, mock_validation, mock_chmod):
        """Tests write mock_open file exists; validation not ok"""
        test_path = "/tmp/mocked_wr1"
        sis = SessionStore(file_path=test_path, session_timeout=600)
        sis.value = "some_session_id_value1"

        mock_isfile.return_value = True
        mock_validation.return_value = False
        mock_chmod.return_value = True

        self.assertRaisesRegex(IOError,
                               'File exists but is not ok.*',
                               sis.write,
                               'foo')

    @mock.patch('pyotrs.lib.os.chmod', autospec=True)
    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_write_mock_open_file_exists_ok(self, mock_isfile, mock_validation, mock_chmod):
        """Tests write mock_open file exists; validation ok"""
        test_path = "/tmp/mocked_wr2"
        sis = SessionStore(file_path=test_path, session_timeout=600)
        sis.value = "some_session_id_value1"

        mock_isfile.return_value = True
        mock_validation.return_value = True

        with mock.patch('pyotrs.lib.open', mock.mock_open()) as m:
            result = sis.write('bar')

        self.assertTrue(result)
        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_validation.call_count, 2)
        self.assertEqual(mock_chmod.call_count, 1)
        m.assert_called_once_with(test_path, 'w')

    @mock.patch('pyotrs.lib.os.chmod', autospec=True)
    @mock.patch('pyotrs.SessionStore._validate_file_owner_and_permissions')
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test_write_mock_open_file_not_exist_v_nok(self, mock_isfile, mock_validation, mock_chmod):
        """Tests write mock_open file does not exist; validation also not ok -> Race Condition?!"""
        test_path = "/tmp/mocked_wr2"
        sis = SessionStore(file_path=test_path, session_timeout=600)
        sis.value = "some_session_id_value1"

        mock_isfile.return_value = False
        mock_validation.return_value = False

        with mock.patch('pyotrs.lib.open', mock.mock_open()) as m:
            self.assertRaisesRegex(IOError,
                                   'Race condition.*',
                                   sis.write,
                                   'foobar12')

        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_validation.call_count, 1)
        self.assertEqual(mock_chmod.call_count, 1)
        m.assert_called_once_with(test_path, 'w')

    def test_delete(self):
        """Tests remove - not implemented"""
        sis = SessionStore(file_path=TMP_SESSION_STORE_FILE_NAME, session_timeout=600)
        self.assertRaisesRegex(NotImplementedError,
                               'Not yet done',
                               sis.delete)

    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test__validate_non_existing_file(self, mock_isfile):
        """Tests _validate file - existing file - wrong permissions"""
        test_path = "/tmp/mocked1"
        mock_isfile.return_value = False

        self.assertRaisesRegex(IOError,
                               'Does not exist or not a '
                               'file: /tmp/mocked1',
                               SessionStore._validate_file_owner_and_permissions,
                               full_file_path=test_path)

        self.assertEqual(mock_isfile.call_count, 1)

    @mock.patch('pyotrs.lib.os.lstat', autospec=True)
    @mock.patch('pyotrs.lib.os.getuid', autospec=True)
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test__validate_existing_file_wrong_owner(self, mock_isfile, mock_getuid, mock_lstat):
        """Tests _validate file - existing file - wrong owner"""
        test_path = "/tmp/mocked2"

        mock_isfile.return_value = True
        mock_getuid.return_value = 4711
        mock_lstat.return_value.st_uid = 815
        mock_lstat.return_value.st_mode = 33188  # 644

        result = SessionStore._validate_file_owner_and_permissions(full_file_path=test_path)

        self.assertFalse(result)
        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_getuid.call_count, 1)
        self.assertEqual(mock_lstat.call_count, 1)

    @mock.patch('pyotrs.lib.os.lstat', autospec=True)
    @mock.patch('pyotrs.lib.os.getuid', autospec=True)
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test__validate_existing_file_wrong_permissions(self, mock_isfile, mock_getuid, mock_lstat):
        """Tests _validate file - existing file - wrong permissions"""
        test_path = "/tmp/mocked3"

        mock_isfile.return_value = True
        mock_getuid.return_value = 4712
        mock_lstat.return_value.st_uid = 4712
        mock_lstat.return_value.st_mode = 33188  # 644

        result = SessionStore._validate_file_owner_and_permissions(full_file_path=test_path)

        self.assertFalse(result)
        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_getuid.call_count, 1)
        self.assertEqual(mock_lstat.call_count, 1)

    @mock.patch('pyotrs.lib.os.lstat', autospec=True)
    @mock.patch('pyotrs.lib.os.getuid', autospec=True)
    @mock.patch('pyotrs.lib.os.path.isfile', autospec=True)
    def test__validate_existing_file_ok(self, mock_isfile, mock_getuid, mock_lstat):
        """Tests _validate file - existing file - ok"""
        test_path = "/tmp/mocked4"

        mock_isfile.return_value = True
        mock_getuid.return_value = 4713
        mock_lstat.return_value.st_uid = 4713
        mock_lstat.return_value.st_mode = 33152  # 0600

        result = SessionStore._validate_file_owner_and_permissions(full_file_path=test_path)

        self.assertTrue(result)
        self.assertEqual(mock_isfile.call_count, 1)
        self.assertEqual(mock_getuid.call_count, 1)
        self.assertEqual(mock_lstat.call_count, 1)


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
