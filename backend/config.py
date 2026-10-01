# backend/config.py

import os
from pathlib import Path


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

APP_NAME = "InCraft"
APP_TITLE = "InCraft — The Art of Intelligent Inventory"

SECRET_KEY = os.getenv(
    "INCRAFT_SECRET_KEY",
    "incraft-development-secret-key-change-in-production"
)

DEBUG = os.getenv("INCRAFT_DEBUG", "True").lower() == "true"


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "incraft")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "6174")


# ============================================================
# UPLOAD CONFIGURATION
# ============================================================

UPLOAD_FOLDER = BASE_DIR / "static" / "uploads"

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "pdf",
    "png",
    "jpg",
    "jpeg"
}

MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB


# ============================================================
# EXPORT CONFIGURATION
# ============================================================

EXPORT_FOLDER = BASE_DIR / "static" / "uploads" / "exports"


# ============================================================
# APPLICATION SETTINGS
# ============================================================

ITEMS_PER_PAGE = 10

LOW_STOCK_THRESHOLD = 10

CURRENCY_SYMBOL = "₹"

DATE_FORMAT = "%Y-%m-%d"

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


# ============================================================
# SESSION CONFIGURATION
# ============================================================

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# Set to True when deploying over HTTPS
SESSION_COOKIE_SECURE = False


# ============================================================
# PATH INITIALIZATION
# ============================================================

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
EXPORT_FOLDER.mkdir(parents=True, exist_ok=True)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_database_config():
    """
    Return database configuration as a dictionary.
    """

    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "database": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD
    }


def get_upload_config():
    """
    Return upload-related configuration.
    """

    return {
        "upload_folder": str(UPLOAD_FOLDER),
        "export_folder": str(EXPORT_FOLDER),
        "allowed_extensions": ALLOWED_EXTENSIONS,
        "max_content_length": MAX_CONTENT_LENGTH
    }


def allowed_file(filename):
    """
    Check whether a file has an allowed extension.

    Parameters:
        filename (str): Name of the uploaded file.

    Returns:
        bool: True if the extension is allowed, otherwise False.
    """

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS