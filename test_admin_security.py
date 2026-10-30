import unittest
from unittest.mock import patch

from backend.app import create_app
import backend.routes as routes


class AdminSecurityTests(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        protected_view = routes.admin_required(
            lambda: ("Admin view reached", 200)
        )

        self.app.add_url_rule(
            "/_test/admin-protection",
            endpoint="_test_admin_protection",
            view_func=protected_view,
            methods=["GET"],
        )

    def login_test_session(self):
        with self.client.session_transaction() as session:
            session["user_id"] = 1
            session["username"] = "test_user"
            # Deliberately set a misleading session role.
            # Authorization must use the database role.
            session["role"] = "admin"

    @staticmethod
    def fake_user_lookup(query, params=None):
        normalized = " ".join(query.lower().split())

        if "select status" in normalized:
            return {"status": "active"}

        if "select role, status" in normalized:
            return {"role": "admin", "status": "active"}

        raise AssertionError(f"Unexpected user query: {query}")

    def test_active_regular_user_is_denied(self):
        self.login_test_session()

        def regular_user_lookup(query, params=None):
            normalized = " ".join(query.lower().split())

            if "select status" in normalized:
                return {"status": "active"}

            if "select role, status" in normalized:
                return {"role": "user", "status": "active"}

            raise AssertionError(f"Unexpected user query: {query}")

        with patch.object(
            routes, "fetch_one", side_effect=regular_user_lookup
        ):
            response = self.client.get("/_test/admin-protection")

        self.assertEqual(response.status_code, 403)
        self.assertNotIn(b"Admin view reached", response.data)

        print("PASS: Active regular user received HTTP 403.")
        print("PASS: Session role did not grant admin access.")

    def test_active_admin_is_allowed(self):
        self.login_test_session()

        with patch.object(
            routes, "fetch_one", side_effect=self.fake_user_lookup
        ):
            response = self.client.get("/_test/admin-protection")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Admin view reached", response.data)

        print("PASS: Active database administrator was allowed.")

    def test_admin_lookup_database_error_returns_503(self):
        self.login_test_session()

        def failing_admin_lookup(query, params=None):
            normalized = " ".join(query.lower().split())

            if "select status" in normalized:
                return {"status": "active"}

            if "select role, status" in normalized:
                raise RuntimeError("Simulated role lookup failure")

            raise AssertionError(f"Unexpected user query: {query}")

        with patch.object(
            routes, "fetch_one", side_effect=failing_admin_lookup
        ):
            response = self.client.get("/_test/admin-protection")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn(b"Admin view reached", response.data)

        print("PASS: Admin lookup failure returned HTTP 503.")
        print("PASS: Protected admin view was not reached.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
