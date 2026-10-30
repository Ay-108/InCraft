
import unittest
from decimal import Decimal
from unittest.mock import patch

from backend.app import create_app
import backend.routes as routes


class SaleSecurityTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True

        # Disable CSRF only for this test app.
        # Dedicated CSRF tests should verify token enforcement.
        self.app.config["WTF_CSRF_ENABLED"] = False

        self.client = self.app.test_client()

    def authenticate_test_user(self):
        # Uses a test-client session only; no real login or database write.
        with self.client.session_transaction() as session:
            session["user_id"] = 1
            session["username"] = "test_user"

    @staticmethod
    def fake_fetch_one(query, params=None):
        if "FROM users" in query:
            return {"status": "active"}

        if "FROM sales" in query:
            return None

        if "FROM products" in query:
            return {
                "product_id": 1,
                "name": "Mock Test Product",
                "quantity": 5,
                "price": Decimal("100.00"),
            }

        raise AssertionError("Unexpected database lookup")

    def test_transaction_failure_returns_safe_error(self):
        self.authenticate_test_user()

        with patch.object(
            routes, "fetch_one", side_effect=self.fake_fetch_one
        ), patch.object(
            routes, "execute_transaction", return_value=False
        ) as transaction:
            response = self.client.post(
                "/sales/create",
                data={
                    "idempotency_key": "12345678-1234-5678-1234-567812345678",
                    "product_id": "1",
                    "quantity": "1",
                    "payment_method": "cash",
                },
            )

        self.assertEqual(response.status_code, 500)

        payload = response.json
        self.assertIsNotNone(payload)
        assert payload is not None

        self.assertIs(payload.get("success"), False)
        self.assertIn(
            "Unable to record the sale",
            payload.get("message", ""),
        )

        transaction.assert_called_once()

        print("PASS: Transaction failure returned HTTP 500.")
        print("PASS: Response did not report sale success.")
        print(
            "PASS: Transaction helper was mocked; "
            "no real sale was written."
        )

    def test_unauthenticated_request_is_rejected(self):
        # No session is established for this test.
        with patch.object(
            routes, "execute_transaction"
        ) as transaction:
            response = self.client.post(
                "/sales/create",
                data={
                    "product_id": "1",
                    "quantity": "1",
                    "payment_method": "cash",
                },
                follow_redirects=False,
            )

        self.assertIn(response.status_code, (302, 303))
        self.assertFalse(response.status_code == 200)

        transaction.assert_not_called()

        print("PASS: Unauthenticated request was redirected.")
        print("PASS: Transaction helper was not called.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
