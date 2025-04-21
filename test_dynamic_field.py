""" test_dynamic_field.py

Test for PyOTRS DynamicField class
"""

import os.path
import sys
import unittest
from datetime import datetime

from pyotrs import DynamicField

# make sure (early) that parent dir (main app) is in path
current_path = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(current_path, os.pardir))


class DynamicFieldTests(unittest.TestCase):
    def test_init_blank(self):
        self.assertRaises(TypeError, DynamicField)

    def test_init_no_name(self):
        self.assertRaises(TypeError, DynamicField)

    def test_init_value_only(self):
        self.assertRaises(TypeError, DynamicField, value="foo")

    def test_init_operator_default(self):
        dyn1 = DynamicField(name="firstname")
        self.assertIsInstance(dyn1, DynamicField)
        self.assertEqual(dyn1.search_operator, "Equals")

    def test_init_operator_custom(self):
        dyn1 = DynamicField(name="somedate", search_operator="SmallerThanEquals")
        self.assertIsInstance(dyn1, DynamicField)
        self.assertEqual(dyn1.search_operator, "SmallerThanEquals")

    def test_init_operator_invalid(self):
        self.assertRaises(NotImplementedError,
                          DynamicField, name="somedate", search_operator="Foobar")

    def test_init_non_list_pattern(self):
        dyn1 = DynamicField(name="SomeName",
                            search_patterns="foobar",
                            search_operator="Equals")
        self.assertIsInstance(dyn1.search_patterns, list)

    def test_init_list_pattern(self):
        dyn1 = DynamicField(name="SomeName",
                            search_patterns=["foo", "bar"],
                            search_operator="Equals")
        self.assertIsInstance(dyn1.search_patterns, list)

    def test_dct_search(self):
        dyn1 = DynamicField(name="SomeName",
                            search_patterns=["foo", "bar"],
                            search_operator="Equals")
        self.assertEqual(dyn1.to_dct_search(),
                         {"DynamicField_SomeName": {"Equals": ["foo", "bar"]}})

    def test_dct_search_date(self):
        dyn1 = DynamicField(name="SomeDate",
                            search_patterns=[datetime(2011, 1, 1)],
                            search_operator="GreaterThan")
        self.assertEqual(dyn1.to_dct_search(),
                         {"DynamicField_SomeDate": {"GreaterThan": ["2011-01-01 00:00:00"]}})

    def test_dummy1_static(self):
        dyn1 = DynamicField(name="firstname", value="Jane")
        self.assertIsInstance(dyn1, DynamicField)
        self.assertEqual(dyn1.__repr__(), '<DynamicField: firstname: Jane>')

    def test_dummy2_static(self):
        dyn2 = DynamicField.from_dct({'Name': 'lastname', 'Value': 'Doe'})
        self.assertIsInstance(dyn2, DynamicField)
        self.assertEqual(dyn2.__repr__(), '<DynamicField: lastname: Doe>')

    def test_dummy1_static_to_dict(self):
        dyn1 = DynamicField("firstname", "Jane")
        self.assertIsInstance(dyn1, DynamicField)
        self.assertDictEqual(dyn1.to_dct(), {'Name': 'firstname', 'Value': 'Jane'})

    def test_dummy1(self):
        dyn1 = DynamicField._dummy1()
        self.assertIsInstance(dyn1, DynamicField)
        self.assertEqual(dyn1.__repr__(), '<DynamicField: firstname: Jane>')

    def test_dummy2(self):
        dyn2 = DynamicField._dummy2()
        self.assertIsInstance(dyn2, DynamicField)
        self.assertEqual(dyn2.__repr__(), '<DynamicField: lastname: Doe>')


def main():
    unittest.main()


if __name__ == '__main__':
    main()

# EOF
