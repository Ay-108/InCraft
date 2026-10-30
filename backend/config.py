
"""
InCraft — The Art of Intelligent Inventory
Centralized application configuration.
"""

import os
from pathlib import Path


# ============================================================
# BASE DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
INSTANCE_DIR = BASE_DIR / "instance"


# ============================================================
# ENVIRONMENT HELPERS
# ============================================================

def get_bool_env(name, default=False):
    """Read and validate a boolean environment variable."""

    value = os.getenv(name)

    if value is None:
        return default

    value = value.strip().lower()

    if value in {"true", "1", "yes", "on"}:
        return True

    if value in {"false", "0", "no", "off"}:
        return False

    raise ValueError(
        f"{name} must be true/false, 1/0, yes/no, or on/off."
    )


def get_int_env(name, default, minimum=None, maximum=None):
    """Read an integer environment variable with validation."""

    value = os.getenv(name, str(default)).strip()

    try:
        number = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(
            f"{name} must be a valid integer."
        ) from error

    if minimum is not None and number < minimum:
        raise ValueError(
            f"{name} must be at least {minimum}."
        )

    if maximum is not None and number > maximum:
        raise ValueError(
            f"{name} must not exceed {maximum}."
        )

    return number


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

APP_NAME = "InCraft"
APP_TITLE = "InCraft — The Art of Intelligent Inventory"
APP_DESCRIPTION = "An intelligent inventory management system."

# Vercel and explicit production deployments must never start in debug mode.
IS_VERCEL = any(
    os.getenv(name, "").strip().lower() == "1"
    for name in ("VERCEL", "VERCEL_ENV", "NOW_REGION")
) or bool(os.getenv("VERCEL_URL", "").strip())
IS_PRODUCTION = (
    IS_VERCEL
    or os.getenv("INCRAFT_ENV", "").strip().lower() == "production"
)

DEBUG = get_bool_env("INCRAFT_DEBUG", default=not IS_PRODUCTION)

_secret_key = os.getenv("INCRAFT_SECRET_KEY", "").strip()

if not DEBUG and not _secret_key:
    raise RuntimeError(
        "INCRAFT_SECRET_KEY is required when debug mode is off. "
        "Set it in your environment before starting InCraft."
    )

# Development-only fallback.
# Configure INCRAFT_SECRET_KEY before deployment.
SECRET_KEY = (
    _secret_key
    or "incraft-development-only-change-before-deployment"
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_HOST = os.getenv("DB_HOST", "localhost").strip()

DB_PORT = get_int_env(
    "DB_PORT",
    default=3306,
    minimum=1,
    maximum=65535,
)

DB_NAME = os.getenv("DB_NAME", "incraft").strip()
DB_USER = os.getenv("DB_USER", "root").strip()

# MySQL password configuration.
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

if not DB_HOST:
    raise ValueError("DB_HOST cannot be empty.")

if not DB_NAME:
    raise ValueError("DB_NAME cannot be empty.")

if not DB_USER:
    raise ValueError("DB_USER cannot be empty.")


def get_database_config():
    """Return MySQL connection settings."""

    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "database": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "charset": "utf8mb4",
        "connection_timeout": 10,
    }


# ============================================================
# UPLOAD CONFIGURATION
# ============================================================

# Vercel Functions have a read-only application filesystem. Keep temporary
# uploads and generated exports under /tmp there; on a traditional host,
# use the instance directory or override these paths with environment vars.
DEFAULT_STORAGE_ROOT = Path("/tmp/incraft") if IS_VERCEL else INSTANCE_DIR

UPLOAD_FOLDER = Path(
    os.getenv("INCRAFT_UPLOAD_DIR", str(DEFAULT_STORAGE_ROOT / "uploads"))
).expanduser()

ALLOWED_EXTENSIONS = frozenset({
    "csv",
    "xlsx",
    "xls",
    "pdf",
    "png",
    "jpg",
    "jpeg",
})

# Vercel limits function request bodies to 4.5 MB. Leave headroom for
# multipart/form-data overhead; traditional hosts retain the 16 MB default.
MAX_CONTENT_LENGTH = get_int_env(
    "INCRAFT_MAX_CONTENT_LENGTH",
    default=(4 * 1024 * 1024 if IS_VERCEL else 16 * 1024 * 1024),
    minimum=1,
)


# ============================================================
# EXPORT CONFIGURATION
# ============================================================

# Keep exports outside the publicly served static directory.
EXPORT_FOLDER = Path(
    os.getenv("INCRAFT_EXPORT_DIR", str(DEFAULT_STORAGE_ROOT / "exports"))
).expanduser()


# ============================================================
# APPLICATION SETTINGS
# ============================================================

ITEMS_PER_PAGE = get_int_env(
    "INCRAFT_ITEMS_PER_PAGE",
    default=10,
    minimum=1,
    maximum=500,
)

LOW_STOCK_THRESHOLD = get_int_env(
    "INCRAFT_LOW_STOCK_THRESHOLD",
    default=10,
    minimum=0,
)

CURRENCY_SYMBOL = "₹"

DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


# ============================================================
# SESSION CONFIGURATION
# ============================================================

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = get_bool_env(
    "INCRAFT_SESSION_COOKIE_SECURE",
    default=IS_PRODUCTION,
)


# ============================================================
# PATH INITIALIZATION
# ============================================================

def initialize_directories():
    """Create required application storage directories when writable.

    Vercel Functions allow writes only in /tmp. Directory creation is
    limited to that temporary storage when running on Vercel.
    """

    for directory in (UPLOAD_FOLDER, EXPORT_FOLDER):
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            # Do not prevent the Flask app from booting because optional
            # temporary file storage is unavailable. File operations will
            # report their own error when a user attempts an upload/export.
            print(f"Unable to initialize storage directory {directory}: {error}")


initialize_directories()


# ============================================================
# UPLOAD CONFIGURATION HELPER
# ============================================================

def get_upload_config():
    """Return upload-related configuration."""

    return {
        "upload_folder": str(UPLOAD_FOLDER),
        "export_folder": str(EXPORT_FOLDER),
        "allowed_extensions": ALLOWED_EXTENSIONS,
        "max_content_length": MAX_CONTENT_LENGTH,
    }


# ============================================================
# FILE VALIDATION
# ============================================================

def allowed_file(filename):
    """
    Check whether a filename has an allowed extension.

    This checks the extension only, not the actual file content.
    """

    if not isinstance(filename, str) or not filename:
        return False

    if (
        "\x00" in filename
        or "/" in filename
        or "\\" in filename
        or filename in {".", ".."}
    ):
        return False

    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS
