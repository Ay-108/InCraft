"""
InCraft — The Art of Intelligent Inventory
Application Entry Point
"""

from backend.app import app
from backend.config import DEBUG


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=DEBUG
    )