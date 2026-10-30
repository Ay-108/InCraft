# backend/app.py
# pyright: reportMissingImports=false

"""
InCraft Application
-------------------
Main Flask application initialization file.

InCraft: The Art of Intelligent Inventory
"""

from html import escape

from flask import Flask, render_template
from jinja2 import TemplateNotFound
from flask_wtf.csrf import CSRFProtect

from backend.config import (
    APP_NAME,
    APP_TITLE,
    SECRET_KEY,
    DEBUG,
    UPLOAD_FOLDER,
    MAX_CONTENT_LENGTH,
    SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
)


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app():
    """Create and configure the InCraft Flask application."""

    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )

    # --------------------------------------------------------
    # Basic application configuration
    # --------------------------------------------------------

    app.config.update(
        APP_NAME=APP_NAME,
        APP_TITLE=APP_TITLE,
        SECRET_KEY=SECRET_KEY,
        DEBUG=DEBUG,
        MAX_CONTENT_LENGTH=MAX_CONTENT_LENGTH,
        SESSION_COOKIE_HTTPONLY=SESSION_COOKIE_HTTPONLY,
        SESSION_COOKIE_SAMESITE=SESSION_COOKIE_SAMESITE,
        SESSION_COOKIE_SECURE=SESSION_COOKIE_SECURE,
        UPLOAD_FOLDER=str(UPLOAD_FOLDER),
    )

    # --------------------------------------------------------
    # CSRF PROTECTION
    # --------------------------------------------------------
    # Protect state-changing requests such as POST, PUT,
    # PATCH, and DELETE. HTML forms must include a valid
    # CSRF token before these requests will be accepted.

    CSRFProtect(app)

    # --------------------------------------------------------
    # Template context
    # --------------------------------------------------------

    @app.context_processor
    def inject_app_config():
        return {
            "app_name": APP_NAME,
            "app_title": APP_TITLE,
        }

    # --------------------------------------------------------
    # Error handlers
    # --------------------------------------------------------

    @app.errorhandler(400)
    def bad_request(error):
        return render_error_page(
            "400",
            "Bad Request",
            "The request could not be processed.",
        ), 400

    @app.errorhandler(403)
    def forbidden(error):
        return render_error_page(
            "403",
            "Access Denied",
            "You do not have permission to access this resource.",
        ), 403

    @app.errorhandler(404)
    def page_not_found(error):
        return render_error_page(
            "404",
            "Page Not Found",
            "The page you are looking for does not exist.",
        ), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return render_error_page(
            "413",
            "File Too Large",
            "The uploaded file exceeds the maximum allowed size.",
        ), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        # Flask logs unhandled exceptions. Avoid exposing
        # internal exception details to the user.
        return render_error_page(
            "500",
            "Internal Server Error",
            "Something went wrong on the server.",
        ), 500

    # --------------------------------------------------------
    # Register routes
    # --------------------------------------------------------

    register_routes(app)

    return app


# ============================================================
# ROUTE REGISTRATION
# ============================================================

def register_routes(app):
    """
    Register the main application blueprint.

    A missing routes module is temporarily tolerated during
    initial project scaffolding. Import errors inside an
    existing routes module are not suppressed.
    """

    try:
        from backend.routes import main_bp

    except ModuleNotFoundError as error:
        if error.name == "backend.routes":
            app.logger.warning(
                "backend.routes is not available yet. "
                "The main blueprint has not been registered."
            )
            return

        # Do not hide missing dependencies used by routes.py.
        raise

    app.register_blueprint(main_bp)


# ============================================================
# ERROR PAGE HELPER
# ============================================================

def render_error_page(error_code, error_title, error_message):
    """
    Render a dedicated error template when available.
    Fall back to a minimal HTML page if error.html is absent.
    """

    try:
        return render_template(
            "error.html",
            error_code=error_code,
            error_title=error_title,
            error_message=error_message,
        )

    except TemplateNotFound as error:
        # Only fall back when the dedicated error template
        # itself is missing. Other template errors should
        # remain visible in server logs.
        if error.name != "error.html":
            raise

    safe_code = escape(str(error_code))
    safe_title = escape(str(error_title))
    safe_message = escape(str(error_message))
    safe_app_name = escape(str(APP_NAME))

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{safe_code} - {safe_app_name}</title>
</head>
<body>
    <main>
        <h1>{safe_code}</h1>
        <h2>{safe_title}</h2>
        <p>{safe_message}</p>
        <a href="/">Return to InCraft</a>
    </main>
</body>
</html>"""


# ============================================================
# APPLICATION INSTANCE
# ============================================================

app = create_app()


# ============================================================
# DEVELOPMENT SERVER
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=DEBUG,
    )