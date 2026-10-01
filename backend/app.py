# backend/app.py
# pyright: reportMissingImports=false

"""
InCraft Application
-------------------
Main Flask application initialization file.

InCraft:
The Art of Intelligent Inventory
"""

from flask import Flask

from backend.config import (
    APP_NAME,
    APP_TITLE,
    SECRET_KEY,
    DEBUG,
    UPLOAD_FOLDER,
    MAX_CONTENT_LENGTH,
    SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE
)


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app():
    """
    Create and configure the InCraft Flask application.

    Returns:
        Flask: Configured Flask application instance.
    """

    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static"
    )

    # --------------------------------------------------------
    # Basic application configuration
    # --------------------------------------------------------

    app.config["APP_NAME"] = APP_NAME
    app.config["APP_TITLE"] = APP_TITLE

    app.config["SECRET_KEY"] = SECRET_KEY

    app.config["DEBUG"] = DEBUG

    # --------------------------------------------------------
    # File upload configuration
    # --------------------------------------------------------

    app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)

    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # --------------------------------------------------------
    # Session configuration
    # --------------------------------------------------------

    app.config["SESSION_COOKIE_HTTPONLY"] = SESSION_COOKIE_HTTPONLY
    app.config["SESSION_COOKIE_SAMESITE"] = SESSION_COOKIE_SAMESITE
    app.config["SESSION_COOKIE_SECURE"] = SESSION_COOKIE_SECURE

    # --------------------------------------------------------
    # Register template context
    # --------------------------------------------------------

    @app.context_processor
    def inject_app_config():
        """
        Make common application information available
        inside all Jinja templates.
        """

        return {
            "app_name": APP_NAME,
            "app_title": APP_TITLE
        }

    # --------------------------------------------------------
    # Register custom error handlers
    # --------------------------------------------------------

    @app.errorhandler(400)
    def bad_request(error):
        """
        Handle HTTP 400 errors.
        """

        return render_error_page(
            "400",
            "Bad Request",
            "The request could not be processed."
        ), 400

    @app.errorhandler(403)
    def forbidden(error):
        """
        Handle HTTP 403 errors.
        """

        return render_error_page(
            "403",
            "Access Denied",
            "You do not have permission to access this resource."
        ), 403

    @app.errorhandler(404)
    def page_not_found(error):
        """
        Handle HTTP 404 errors.
        """

        return render_error_page(
            "404",
            "Page Not Found",
            "The page you are looking for does not exist."
        ), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        """
        Handle files exceeding the configured upload limit.
        """

        return render_error_page(
            "413",
            "File Too Large",
            "The uploaded file exceeds the maximum allowed size."
        ), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        """
        Handle unexpected server errors.
        """

        return render_error_page(
            "500",
            "Internal Server Error",
            "Something went wrong on the server."
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
    Register InCraft application routes.

    The actual route definitions will be implemented in
    backend/routes.py.

    Keeping route registration here prevents app.py from
    becoming responsible for business logic.
    """

    try:
        from backend.routes import main_bp

        app.register_blueprint(main_bp)

    except ImportError:
        """
        routes.py may not exist yet while the project is being
        built file-by-file.

        Once backend/routes.py is generated, the blueprint
        will be registered automatically.
        """

        print(
            "Warning: backend.routes could not be imported. "
            "Generate backend/routes.py before running InCraft."
        )


# ============================================================
# ERROR PAGE HELPER
# ============================================================

def render_error_page(
    error_code,
    error_title,
    error_message
):
    """
    Render an error page.

    If a dedicated error template does not exist yet,
    return a simple HTML response.

    Parameters:
        error_code (str): HTTP error code.
        error_title (str): Error title.
        error_message (str): Error description.

    Returns:
        str: HTML response.
    """

    try:
        from flask import render_template

        return render_template(
            "error.html",
            error_code=error_code,
            error_title=error_title,
            error_message=error_message
        )

    except Exception:
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">

            <title>{error_code} - {APP_NAME}</title>
        </head>

        <body>
            <h1>{error_code}</h1>
            <h2>{error_title}</h2>
            <p>{error_message}</p>
            <a href="/">Return to InCraft</a>
        </body>
        </html>
        """


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
        debug=DEBUG
    )

    