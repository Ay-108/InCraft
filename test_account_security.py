import unittest
from unittest.mock import patch

from backend.app import create_app
import backend.routes as routes


class AccountSecurityTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        # A dedicated protected test route exercises the actual decorator.
        protected_view = routes.active_user_required(
            lambda: ("Protected view reached", 200)
        )
        self.app.add_url_rule(
            "/_test/account-protection",
            endpoint="_test_account_protection",
            view_func=protected_view,
            methods=["GET"],
        )

    def login_test_session(self):
        with self.client.session_transaction() as session:
            session["user_id"] = 1
            session["username"] = "test_user"

    def test_active_account_is_allowed(self):
        self.login_test_session()

        with patch.object(
            routes,
            "fetch_one",
            return_value={"status": "active"},
        ) as fetch:
            response = self.client.get("/_test/account-protection")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Protected view reached", response.data)
        fetch.assert_called_once()

        print("PASS: Active account reached the protected view.")

    def test_inactive_account_is_logged_out(self):
        self.login_test_session()

        with patch.object(
            routes,
            "fetch_one",
            return_value={"status": "inactive"},
        ):
            response = self.client.get(
                "/_test/account-protection",
                follow_redirects=False,
            )

        self.assertIn(response.status_code, (302, 303))
        self.assertIn("/login", response.headers.get("Location", ""))

        with self.client.session_transaction() as session:
            self.assertNotIn("user_id", session)
            self.assertNotIn("username", session)

        print("PASS: Inactive account was redirected to login.")
        print("PASS: User session was cleared.")

    def test_database_error_returns_503(self):
        self.login_test_session()

        with patch.object(
            routes,
            "fetch_one",
            side_effect=RuntimeError("Simulated database failure"),
        ):
            response = self.client.get("/_test/account-protection")

        self.assertEqual(response.status_code, 503)
        self.assertNotEqual(response.status_code, 200)

        print("PASS: Database error returned HTTP 503.")
        print("PASS: Protected view was not allowed to run.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
