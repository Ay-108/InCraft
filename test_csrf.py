
import unittest

from flask import jsonify
from flask_wtf.csrf import generate_csrf

from backend.app import create_app


class CSRFProtectionTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True

        # Keep CSRF enabled for these dedicated tests.
        self.app.config["WTF_CSRF_ENABLED"] = True

        # Test-only endpoints; neither accesses the database.
        @self.app.get("/_test/csrf-token")
        def csrf_test_token():
            return jsonify({"csrf_token": generate_csrf()})

        @self.app.post("/_test/csrf-protected")
        def csrf_protected_endpoint():
            return jsonify({"success": True}), 200

        self.client = self.app.test_client()

    def test_post_without_csrf_token_is_rejected(self):
        response = self.client.post(
            "/_test/csrf-protected",
            data={"value": "test"},
        )

        self.assertEqual(response.status_code, 400)

        print("PASS: POST without a CSRF token was rejected.")

    def test_post_with_valid_csrf_token_is_accepted(self):
        token_response = self.client.get("/_test/csrf-token")

        self.assertEqual(token_response.status_code, 200)

        payload = token_response.get_json()
        self.assertIsNotNone(payload)

        token = payload["csrf_token"]
        self.assertTrue(token)

        response = self.client.post(
            "/_test/csrf-protected",
            data={
                "value": "test",
                "csrf_token": token,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIs(response.get_json()["success"], True)

        print("PASS: POST with a valid CSRF token was accepted.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
