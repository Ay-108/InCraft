"""
Vercel WSGI entry point for InCraft.

The Flask application continues to live in backend.app so the same
application factory and routes are used locally and in production.
"""

from backend.app import app

__all__ = ["app"]
