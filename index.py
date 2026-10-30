"""
Vercel WSGI entry point for InCraft.

The Flask application continues to live in backend.app so the same
application factory and routes are used locally and in production.

If an unexpected import-time exception prevents Flask from initializing,
the fallback WSGI handler keeps /api/health available and writes the full
traceback to Vercel Runtime Logs. It does not expose exception details to
public requests.
"""

import json
import logging

try:
    from backend.app import app

except Exception as startup_error:
    logging.exception("InCraft Flask application failed during startup.")

    startup_error_type = type(startup_error).__name__

    def app(environ, start_response):
        """Minimal WSGI fallback for reporting application startup failures."""
        path = environ.get("PATH_INFO", "/")

        if path == "/api/health":
            payload = {
                "application": "InCraft",
                "status": "startup_failed",
                "error_type": startup_error_type,
                "message": (
                    "The application could not initialize. "
                    "Check Vercel Runtime Logs for the Python traceback."
                ),
            }
        else:
            payload = {
                "application": "InCraft",
                "status": "unavailable",
                "message": "InCraft is temporarily unavailable.",
            }

        body = json.dumps(payload).encode("utf-8")
        status = "503 Service Unavailable"
        headers = [
            ("Content-Type", "application/json; charset=utf-8"),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-store"),
        ]

        start_response(status, headers)
        return [body]

__all__ = ["app"]
