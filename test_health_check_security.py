import unittest
from unittest.mock import patch

from backend.app import create_app
import backend.routes as routes


class HealthCheckSecurityTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_database_probe_exception_returns_generic_503(self):
        private_error = "Connection failed for secret-db.internal:3306"

        with patch.object(routes, "IS_PRODUCTION", False), patch.object(
            routes,
            "get_database_status",
            side_effect=RuntimeError(private_error),
        ):
            response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertIsNotNone(payload)
        assert payload is not None

        self.assertEqual(payload.get("status"), "database_unavailable")
        self.assertEqual(
            payload.get("message"),
            "Database connectivity could not be verified.",
        )
        self.assertNotIn("secret-db.internal", response.get_data(as_text=True))
        self.assertNotIn(private_error, response.get_data(as_text=True))

    def test_database_error_details_are_not_exposed(self):
        private_error = (
            "Access denied for user 'incraft_prod_user'@"
            "'mysql.internal.example' (using password: YES)"
        )

        with patch.object(routes, "IS_PRODUCTION", False), patch.object(
            routes,
            "get_database_status",
            return_value={
                "connected": False,
                "message": private_error,
            },
        ):
            response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertIsNotNone(payload)
        assert payload is not None

        self.assertEqual(payload.get("status"), "database_unavailable")
        self.assertEqual(payload.get("database"), "unavailable")
        self.assertEqual(
            payload.get("message"),
            "Database connectivity could not be verified.",
        )
        self.assertNotIn("db_error", payload)

        response_text = response.get_data(as_text=True)
        self.assertNotIn("incraft_prod_user", response_text)
        self.assertNotIn("mysql.internal.example", response_text)
        self.assertNotIn("using password", response_text.lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
