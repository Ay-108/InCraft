
import unittest
from decimal import Decimal
from unittest.mock import MagicMock, patch
import uuid

from backend.app import create_app
import backend.routes as routes


class SaleValidationTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True

        # Disable CSRF only for these unit tests.
        # CSRF protection must remain enabled in the application.
        # Dedicated CSRF tests should verify token enforcement separately.
        self.app.config["WTF_CSRF_ENABLED"] = False

        self.client = self.app.test_client()

    def post_sale(self, form_data, product=None):
        form_data = dict(form_data)
        form_data.setdefault("idempotency_key", str(uuid.uuid4()))
        # Simulate an authenticated user without using a real account.
        with self.client.session_transaction() as session:
            session["user_id"] = 1
            session["username"] = "test_user"

        def fake_fetch_one(query, params=None):
            if "FROM users" in query:
                return {"status": "active"}
            if "FROM sales" in query:
                return None
            if "FROM products" in query:
                return product
            raise AssertionError("Unexpected database query")

        with patch.object(
            routes, "fetch_one", side_effect=fake_fetch_one
        ), patch.object(
            routes, "execute_transaction"
        ) as transaction:
            response = self.client.post(
                "/sales/create",
                data=form_data,
            )

            # Every test here must stop before a real sale transaction.
            transaction.assert_not_called()

        return response

    def test_missing_product_id(self):
        response = self.post_sale({"quantity": "1"})
        self.assertEqual(response.status_code, 400)

    def test_missing_quantity(self):
        response = self.post_sale({"product_id": "1"})
        self.assertEqual(response.status_code, 400)

    def test_zero_quantity(self):
        response = self.post_sale({
            "product_id": "1", "quantity": "0"
        })
        self.assertEqual(response.status_code, 400)

    def test_negative_quantity(self):
        response = self.post_sale({
            "product_id": "1", "quantity": "-1"
        })
        self.assertEqual(response.status_code, 400)

    def test_decimal_quantity(self):
        response = self.post_sale({
            "product_id": "1", "quantity": "2.5"
        })
        self.assertEqual(response.status_code, 400)

    def test_non_numeric_quantity(self):
        response = self.post_sale({
            "product_id": "1", "quantity": "abc"
        })
        self.assertEqual(response.status_code, 400)

    def test_zero_product_id(self):
        response = self.post_sale({
            "product_id": "0", "quantity": "1"
        })
        self.assertEqual(response.status_code, 400)

    def test_invalid_payment_method(self):
        response = self.post_sale({
            "product_id": "1",
            "quantity": "1",
            "payment_method": "bitcoin",
        })
        self.assertEqual(response.status_code, 400)

    def test_nonexistent_product(self):
        response = self.post_sale(
            {"product_id": "999999", "quantity": "1"},
            product=None,
        )
        self.assertEqual(response.status_code, 404)

    def test_insufficient_stock(self):
        response = self.post_sale(
            {"product_id": "1", "quantity": "3"},
            product={
                "product_id": 1,
                "name": "Mock Test Product",
                "quantity": 2,
                "price": Decimal("100.00"),
            },
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
