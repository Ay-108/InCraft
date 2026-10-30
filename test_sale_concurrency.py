
import unittest
from decimal import Decimal
from unittest.mock import patch

from backend.app import create_app
import backend.routes as routes


class SaleConcurrencyTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True

        # Disable CSRF only for this test app.
        # Dedicated CSRF tests should verify token enforcement.
        self.app.config["WTF_CSRF_ENABLED"] = False

        self.client = self.app.test_client()

        # Simulated stock is always 2. No real product is queried.
        self.mock_product = {
            "product_id": 1,
            "name": "Mock Concurrency Product",
            "quantity": 2,
            "price": Decimal("100.00"),
        }

    def authenticate(self):
        with self.client.session_transaction() as session:
            session["user_id"] = 1
            session["username"] = "test_user"

    def fake_fetch_one(self, query, params=None):
        if "FROM users" in query:
            return {"status": "active"}

        if "FROM sales" in query:
            return None

        if "FROM products" in query:
            return self.mock_product

        raise AssertionError("Unexpected database lookup")

    @staticmethod
    def check_stock_guard(transaction_call):
        queries = transaction_call.args[0]

        stock_updates = [
            item for item in queries
            if "UPDATE products" in item[0]
        ]

        if len(stock_updates) != 1:
            raise AssertionError("Expected exactly one stock update")

        query, params, expected_rows = stock_updates[0]

        assert "quantity >= %s" in query
        assert expected_rows == 1
        assert params[0] == 2  # Requested quantity
        assert params[2] == 1  # Product ID
        assert params[3] == 2  # Required minimum stock

    def test_competing_sales_cannot_both_succeed(self):
        self.authenticate()

        # Both requests initially see stock=2.
        # Simulate first sale succeeding and second failing because
        # the conditional stock update affects zero rows.
        with patch.object(
            routes, "fetch_one", side_effect=self.fake_fetch_one
        ), patch.object(
            routes, "execute_transaction", side_effect=[True, False]
        ) as transaction:

            first = self.client.post(
                "/sales/create",
                data={
                    "idempotency_key": "11111111-1111-1111-1111-111111111111",
                    "product_id": "1",
                    "quantity": "2",
                    "payment_method": "cash",
                },
            )

            second = self.client.post(
                "/sales/create",
                data={
                    "idempotency_key": "22222222-2222-2222-2222-222222222222",
                    "product_id": "1",
                    "quantity": "2",
                    "payment_method": "cash",
                },
            )

        self.assertEqual(first.status_code, 200)
        assert first.json is not None
        self.assertIs(first.json["success"], True)

        self.assertEqual(second.status_code, 500)
        assert second.json is not None
        self.assertIs(second.json["success"], False)

        self.assertEqual(transaction.call_count, 2)

        self.check_stock_guard(transaction.call_args_list[0])
        self.check_stock_guard(transaction.call_args_list[1])

        print("PASS: First simulated sale succeeded.")
        print("PASS: Competing simulated sale failed safely.")
        print("PASS: Both transactions included the stock guard.")
        print("PASS: No real inventory or sales were modified.")

    def test_transaction_failure_never_reports_success(self):
        self.authenticate()

        with patch.object(
            routes, "fetch_one", side_effect=self.fake_fetch_one
        ), patch.object(
            routes, "execute_transaction", return_value=False
        ) as transaction:

            response = self.client.post(
                "/sales/create",
                data={
                    "idempotency_key": "33333333-3333-3333-3333-333333333333",
                    "product_id": "1",
                    "quantity": "2",
                    "payment_method": "cash",
                },
            )

        self.assertEqual(response.status_code, 500)
        assert response.json is not None
        self.assertIs(response.json["success"], False)

        self.check_stock_guard(transaction.call_args_list[0])

        print("PASS: Failed transaction did not report success.")
        print("PASS: Conditional stock guard was present.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
