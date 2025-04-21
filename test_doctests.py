from doctest import DocTestSuite
from unittest import TestSuite


def load_tests(loader, tests, pattern):
    suite = TestSuite()
    suite.addTests(DocTestSuite('pyotrs.lib'))
    return suite
