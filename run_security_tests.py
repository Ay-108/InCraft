
import unittest

TEST_FILES = [
    "test_transaction_rollback",
    "test_sale_validation",
    "test_sale_security",
    "test_account_security",
    "test_sale_concurrency",
    "test_admin_security",
    "test_csrf",
]

if __name__ == "__main__":
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()

    for module_name in TEST_FILES:
        suite.addTests(loader.loadTestsFromName(module_name))

    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)
