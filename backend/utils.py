# backend/utils.py

"""
InCraft Utility Module
----------------------
Contains reusable helper functions used throughout the application.

This module should contain general-purpose utilities rather than
application-specific database queries.
"""

import csv
import io
import os
import re
import secrets
from datetime import datetime
from functools import wraps

from flask import (  # type: ignore[reportMissingImports]
    flash,
    redirect,
    session,
    url_for,
    send_file
)
try:
    # Preferred import
    from werkzeug.utils import secure_filename  # type: ignore[reportMissingImports]
except Exception:
    # Fallback simple implementation if werkzeug is not available (keeps filenames safe)
    import unicodedata

    _filename_strip_re = re.compile(r"[^A-Za-z0-9_.-]")

    def secure_filename(filename: str) -> str:
        """
        Simplified replacement for werkzeug.utils.secure_filename.
        Normalizes unicode, removes path separators and unsafe characters.
        """
        if not filename:
            return ""
        filename = os.path.basename(filename)
        filename = unicodedata.normalize("NFKD", filename)
        filename = filename.encode("ascii", "ignore").decode("ascii")
        filename = filename.replace(" ", "_")
        filename = _filename_strip_re.sub("", filename)
        return filename

from backend.config import (
    ALLOWED_EXTENSIONS,
    UPLOAD_FOLDER,
    EXPORT_FOLDER,
    DATE_FORMAT,
    DATETIME_FORMAT
)


# ============================================================
# FILE UTILITIES
# ============================================================

def allowed_file(filename):
    """
    Check whether a file has an allowed extension.

    Parameters:
        filename (str): Uploaded file name.

    Returns:
        bool: True if the extension is allowed.
    """

    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def get_file_extension(filename):
    """
    Return the extension of a file.

    Parameters:
        filename (str): File name.

    Returns:
        str: File extension without the dot.
    """

    if not filename or "." not in filename:
        return ""

    return filename.rsplit(".", 1)[1].lower()


def generate_unique_filename(filename):
    """
    Generate a unique and secure filename.

    Example:
        products.csv
        ->
        products_a8f32c91.csv

    Parameters:
        filename (str): Original file name.

    Returns:
        str: Unique secure filename.
    """

    filename = secure_filename(filename)

    if not filename:
        filename = "uploaded_file"

    name, extension = os.path.splitext(filename)

    unique_token = secrets.token_hex(4)

    return f"{name}_{unique_token}{extension.lower()}"


def save_uploaded_file(file):
    """
    Save an uploaded file to the configured upload directory.

    Parameters:
        file: Flask uploaded file object.

    Returns:
        str | None:
            Saved filename if successful,
            otherwise None.
    """

    if file is None or not file.filename:
        return None

    if not allowed_file(file.filename):
        return None

    filename = generate_unique_filename(file.filename)

    file_path = UPLOAD_FOLDER / filename

    file.save(str(file_path))

    return filename


def get_uploaded_file_path(filename):
    """
    Return the complete path of an uploaded file.

    Parameters:
        filename (str): Stored file name.

    Returns:
        str: Complete file path.
    """

    filename = secure_filename(filename)

    return str(UPLOAD_FOLDER / filename)


# ============================================================
# EXPORT UTILITIES
# ============================================================

def generate_csv_file(data, filename="incraft_export.csv"):
    """
    Generate a CSV file from a list of dictionaries.

    Parameters:
        data (list): List of dictionaries.
        filename (str): Export file name.

    Returns:
        str | None:
            Path of generated file or None if no data exists.
    """

    if not data:
        return None

    filename = generate_unique_filename(filename)

    file_path = EXPORT_FOLDER / filename

    fieldnames = list(data[0].keys())

    with open(
        file_path,
        "w",
        newline="",
        encoding="utf-8"
    ) as csv_file:

        writer = csv.DictWriter(
            csv_file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(data)

    return str(file_path)


def generate_csv_response(data, filename="incraft_export.csv"):
    """
    Generate an in-memory CSV file for browser download.

    Parameters:
        data (list): List of dictionaries.
        filename (str): Download filename.

    Returns:
        Flask response object.
    """

    if not data:
        return None

    output = io.StringIO()

    fieldnames = list(data[0].keys())

    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(data)

    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name=filename
    )


# ============================================================
# VALIDATION UTILITIES
# ============================================================

def clean_text(value):
    """
    Remove unnecessary whitespace from text.

    Parameters:
        value: Input value.

    Returns:
        str: Cleaned text.
    """

    if value is None:
        return ""

    return str(value).strip()


def validate_required_fields(data, fields):
    """
    Check whether required fields are present.

    Parameters:
        data (dict): Input data.
        fields (list): Required field names.

    Returns:
        tuple:
            (True, [])
            or
            (False, [missing fields])
    """

    missing_fields = []

    for field in fields:
        value = data.get(field)

        if value is None or str(value).strip() == "":
            missing_fields.append(field)

    return len(missing_fields) == 0, missing_fields


def validate_email(email):
    """
    Validate an email address.

    Parameters:
        email (str): Email address.

    Returns:
        bool: True if valid.
    """

    if not email:
        return False

    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    return bool(re.match(pattern, email))


def validate_password(password):
    """
    Basic password validation.

    Requirements:
        - At least 8 characters
        - At least one letter
        - At least one number

    Parameters:
        password (str): Password.

    Returns:
        bool: True if valid.
    """

    if not password or len(password) < 8:
        return False

    has_letter = bool(re.search(r"[A-Za-z]", password))
    has_number = bool(re.search(r"\d", password))

    return has_letter and has_number


def validate_positive_number(value):
    """
    Check whether a value is a positive number.

    Parameters:
        value: Number-like value.

    Returns:
        bool: True if positive.
    """

    try:
        return float(value) > 0
    except (TypeError, ValueError):
        return False


def validate_non_negative_number(value):
    """
    Check whether a value is zero or greater.

    Parameters:
        value: Number-like value.

    Returns:
        bool: True if valid.
    """

    try:
        return float(value) >= 0
    except (TypeError, ValueError):
        return False


# ============================================================
# DATE & TIME UTILITIES
# ============================================================

def current_datetime():
    """
    Return the current local date and time.

    Returns:
        datetime: Current datetime.
    """

    return datetime.now()


def current_datetime_string():
    """
    Return current datetime as a formatted string.

    Returns:
        str: Formatted datetime.
    """

    return datetime.now().strftime(DATETIME_FORMAT)


def current_date_string():
    """
    Return current date as a formatted string.

    Returns:
        str: Formatted date.
    """

    return datetime.now().strftime(DATE_FORMAT)


def format_datetime(value):
    """
    Format a datetime value for display.

    Parameters:
        value: datetime object.

    Returns:
        str: Formatted datetime.
    """

    if value is None:
        return ""

    if isinstance(value, str):
        return value

    return value.strftime(DATETIME_FORMAT)


def format_date(value):
    """
    Format a date value for display.

    Parameters:
        value: date/datetime object.

    Returns:
        str: Formatted date.
    """

    if value is None:
        return ""

    if isinstance(value, str):
        return value

    return value.strftime(DATE_FORMAT)


# ============================================================
# INVENTORY UTILITIES
# ============================================================

def get_stock_status(quantity, minimum_stock=10):
    """
    Determine inventory stock status.

    Status values:
        OUT_OF_STOCK
        LOW_STOCK
        IN_STOCK

    Parameters:
        quantity: Current stock quantity.
        minimum_stock: Low-stock threshold.

    Returns:
        str: Stock status.
    """

    try:
        quantity = float(quantity)
        minimum_stock = float(minimum_stock)

    except (TypeError, ValueError):
        return "UNKNOWN"

    if quantity <= 0:
        return "OUT_OF_STOCK"

    if quantity <= minimum_stock:
        return "LOW_STOCK"

    return "IN_STOCK"


def calculate_stock_value(quantity, price):
    """
    Calculate total inventory value.

    Formula:
        quantity × price

    Parameters:
        quantity: Product quantity.
        price: Product price.

    Returns:
        float: Total stock value.
    """

    try:
        return round(float(quantity) * float(price), 2)

    except (TypeError, ValueError):
        return 0.0


def calculate_sale_total(quantity, price, discount=0):
    """
    Calculate total value of a sale.

    Formula:
        (quantity × price) - discount

    Parameters:
        quantity: Quantity sold.
        price: Unit price.
        discount: Discount amount.

    Returns:
        float: Final sale amount.
    """

    try:
        subtotal = float(quantity) * float(price)
        discount = float(discount or 0)

        total = subtotal - discount

        return round(max(total, 0), 2)

    except (TypeError, ValueError):
        return 0.0


# ============================================================
# NUMBER FORMATTING
# ============================================================

def format_currency(value):
    """
    Format a number as Indian currency.

    Example:
        12500.50
        -> ₹12,500.50

    Parameters:
        value: Numeric value.

    Returns:
        str: Formatted currency.
    """

    try:
        value = float(value)
    except (TypeError, ValueError):
        value = 0.0

    return f"₹{value:,.2f}"


def format_number(value):
    """
    Format a number with comma separators.

    Parameters:
        value: Numeric value.

    Returns:
        str: Formatted number.
    """

    try:
        value = float(value)

        if value.is_integer():
            return f"{int(value):,}"

        return f"{value:,.2f}"

    except (TypeError, ValueError):
        return "0"


# ============================================================
# AUTHENTICATION UTILITIES
# ============================================================

def is_logged_in():
    """
    Check whether a user is currently logged in.

    Returns:
        bool: True if user session exists.
    """

    return "user_id" in session


def get_current_user_id():
    """
    Return the logged-in user's ID.

    Returns:
        int | None: User ID.
    """

    return session.get("user_id")


def get_current_username():
    """
    Return the logged-in user's username.

    Returns:
        str | None: Username.
    """

    return session.get("username")


def login_user(user):
    """
    Store user information in the Flask session.

    Parameters:
        user (dict): User record.
    """

    session.clear()

    session["user_id"] = user.get("user_id")
    session["username"] = user.get("username")

    if user.get("email"):
        session["email"] = user.get("email")

    if user.get("role"):
        session["role"] = user.get("role")


def logout_user():
    """
    Clear the current user's session.
    """

    session.clear()


def login_required(function):
    """
    Decorator that protects routes requiring authentication.

    If the user is not logged in, they are redirected
    to the login page.
    """

    @wraps(function)
    def decorated_function(*args, **kwargs):

        if not is_logged_in():
            flash(
                "Please log in to continue.",
                "warning"
            )

            return redirect(url_for("main.login"))

        return function(*args, **kwargs)

    return decorated_function


# ============================================================
# ROLE / PERMISSION UTILITIES
# ============================================================

def get_current_user_role():
    """
    Return the current user's role.

    Returns:
        str: User role or empty string.
    """

    return session.get("role", "")


def has_role(role):
    """
    Check whether the logged-in user has a specific role.

    Parameters:
        role (str): Required role.

    Returns:
        bool: True if the user has the role.
    """

    return get_current_user_role().lower() == role.lower()


# ============================================================
# ACTIVITY / HISTORY UTILITIES
# ============================================================

def create_activity_description(
    action,
    entity_type,
    entity_name=None
):
    """
    Create a standardized activity description.

    Examples:
        Product added: Laptop
        Product updated: Keyboard
        Sale recorded: INV-1001

    Parameters:
        action (str): Performed action.
        entity_type (str): Entity type.
        entity_name (str): Optional entity name.

    Returns:
        str: Activity description.
    """

    action = clean_text(action)
    entity_type = clean_text(entity_type)

    if entity_name:
        entity_name = clean_text(entity_name)

        return f"{action}: {entity_type} - {entity_name}"

    return f"{action}: {entity_type}"


# ============================================================
# SEARCH UTILITIES
# ============================================================

def normalize_search_query(query):
    """
    Normalize a search query.

    Parameters:
        query (str): Search input.

    Returns:
        str: Normalized search query.
    """

    if not query:
        return ""

    query = clean_text(query)

    return re.sub(r"\s+", " ", query)



# ============================================================
# SMART DECISION SUPPORT UTILITIES
# ============================================================

def _get_value(record, *keys, default=None):
    """Return the first available value from a dictionary."""
    if not isinstance(record, dict):
        return default

    for key in keys:
        if key in record and record[key] is not None:
            return record[key]

    return default


def _to_number(value, default=0.0):
    """Safely convert a value to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def analyze_restock(products):
    """Generate a restock insight from current inventory levels."""
    products = products or []
    critical = []
    low = []

    for product in products:
        name = _get_value(
            product, "name", "product_name", default="Unknown Product"
        )
        stock = _to_number(
            _get_value(
                product, "stock", "quantity", "current_stock", default=0
            )
        )
        reorder_level = _to_number(
            _get_value(
                product,
                "reorder_level",
                "minimum_stock",
                "min_stock",
                default=10,
            )
        )

        item = {
            "name": name,
            "stock": stock,
            "reorder_level": reorder_level,
        }

        if stock <= 0:
            critical.append(item)
        elif stock <= reorder_level:
            low.append(item)

    if critical:
        item = critical[0]
        return {
            "type": "restock",
            "priority": "high",
            "title": "Restock Recommendation",
            "message": (
                f"{item['name']} is out of stock. "
                "Restocking should be considered immediately."
            ),
            "metric": f"{len(critical)} out of stock",
            "data": critical,
        }

    if low:
        item = low[0]
        return {
            "type": "restock",
            "priority": "medium",
            "title": "Restock Recommendation",
            "message": (
                f"{item['name']} is below its reorder level. "
                "Consider replenishing the stock."
            ),
            "metric": f"{len(low)} low-stock products",
            "data": low,
        }

    return {
        "type": "restock",
        "priority": "low",
        "title": "Restock Recommendation",
        "message": "Current inventory is above the defined reorder levels.",
        "metric": "No urgent restocking",
        "data": [],
    }


def analyze_sales_opportunity(sales):
    """Identify the product with the highest recorded sales volume."""
    sales = sales or []
    product_sales = {}

    for sale in sales:
        name = _get_value(
            sale, "product_name", "name", "product", default="Unknown Product"
        )
        quantity = _to_number(
            _get_value(sale, "quantity", "qty", "units", default=0)
        )
        amount = _to_number(
            _get_value(
                sale,
                "total_amount",
                "total",
                "amount",
                "sale_total",
                default=0,
            )
        )

        if name not in product_sales:
            product_sales[name] = {"quantity": 0, "revenue": 0}

        product_sales[name]["quantity"] += quantity
        product_sales[name]["revenue"] += amount

    if not product_sales:
        return {
            "type": "sales",
            "priority": "low",
            "title": "Sales Opportunity",
            "message": "There is not enough sales data to identify an opportunity yet.",
            "metric": "No sales data",
            "data": [],
        }

    name, values = max(
        product_sales.items(),
        key=lambda item: item[1]["quantity"],
    )

    return {
        "type": "sales",
        "priority": "high",
        "title": "Sales Opportunity",
        "message": (
            f"{name} has the highest recorded sales volume. "
            "Monitor its stock and sales performance."
        ),
        "metric": f"{format_number(values['quantity'])} units sold",
        "data": [{
            "name": name,
            "quantity": values["quantity"],
            "revenue": round(values["revenue"], 2),
        }],
    }


def analyze_slow_moving_products(products, sales):
    """Identify products with stock but no recorded sales."""
    products = products or []
    sales = sales or []
    sold_quantities = {}

    for sale in sales:
        name = _get_value(
            sale, "product_name", "name", "product", default=""
        )
        quantity = _to_number(
            _get_value(sale, "quantity", "qty", "units", default=0)
        )

        if name:
            sold_quantities[name] = sold_quantities.get(name, 0) + quantity

    slow = []

    for product in products:
        name = _get_value(
            product, "name", "product_name", default="Unknown Product"
        )
        stock = _to_number(
            _get_value(
                product, "stock", "quantity", "current_stock", default=0
            )
        )

        if stock > 0 and sold_quantities.get(name, 0) <= 0:
            slow.append({
                "name": name,
                "stock": stock,
                "sold": 0,
            })

    if slow:
        item = slow[0]
        return {
            "type": "slow-moving",
            "priority": "medium",
            "title": "Slow-Moving Products",
            "message": (
                f"{item['name']} has stock available but no recorded "
                "sales activity."
            ),
            "metric": f"{len(slow)} products need review",
            "data": slow,
        }

    return {
        "type": "slow-moving",
        "priority": "low",
        "title": "Slow-Moving Products",
        "message": "No products with available stock and zero recorded sales were identified.",
        "metric": "No immediate concern",
        "data": [],
    }


def analyze_revenue(sales):
    """Identify total revenue and the highest revenue-generating product."""
    sales = sales or []
    total_revenue = 0
    product_revenue = {}

    for sale in sales:
        name = _get_value(
            sale, "product_name", "name", "product", default="Unknown Product"
        )
        amount = _to_number(
            _get_value(
                sale,
                "total_amount",
                "total",
                "amount",
                "sale_total",
                default=0,
            )
        )

        total_revenue += amount
        product_revenue[name] = product_revenue.get(name, 0) + amount

    if not sales:
        return {
            "type": "revenue",
            "priority": "low",
            "title": "Revenue Insight",
            "message": "Not enough sales data is available for revenue analysis.",
            "metric": "₹0.00",
            "data": [],
        }

    name, revenue = max(
        product_revenue.items(),
        key=lambda item: item[1],
    )

    return {
        "type": "revenue",
        "priority": "high",
        "title": "Revenue Insight",
        "message": (
            f"{name} generated the highest recorded revenue. "
            "This product is an important contributor to sales."
        ),
        "metric": format_currency(total_revenue),
        "data": [{
            "name": name,
            "revenue": round(revenue, 2),
        }],
    }


def analyze_demand_forecast(sales):
    """
    Estimate basic demand using average recorded sale quantity.

    This is an analytical baseline, not an ML prediction model.
    """
    sales = sales or []
    quantities = []

    for sale in sales:
        quantity = _to_number(
            _get_value(sale, "quantity", "qty", "units", default=0)
        )
        if quantity > 0:
            quantities.append(quantity)

    if not quantities:
        return {
            "type": "forecast",
            "priority": "low",
            "title": "Demand Forecast",
            "message": (
                "More historical sales data is required before demand "
                "can be estimated."
            ),
            "metric": "Insufficient data",
            "data": [],
        }

    average = sum(quantities) / len(quantities)

    return {
        "type": "forecast",
        "priority": "medium",
        "title": "Demand Forecast",
        "message": (
            "Recorded sales indicate ongoing demand. "
            "Use the average sales quantity as a basic planning reference."
        ),
        "metric": f"{average:.1f} units per sale",
        "data": [{
            "average_quantity": round(average, 2),
            "records": len(quantities),
        }],
    }


def analyze_inventory_optimization(products, sales):
    """Compare total inventory with recorded sales activity."""
    products = products or []
    sales = sales or []

    total_stock = sum(
        _to_number(
            _get_value(
                product,
                "stock",
                "quantity",
                "current_stock",
                default=0,
            )
        )
        for product in products
    )

    total_sold = sum(
        _to_number(
            _get_value(sale, "quantity", "qty", "units", default=0)
        )
        for sale in sales
    )

    if total_stock <= 0:
        return {
            "type": "optimization",
            "priority": "medium",
            "title": "Inventory Optimization",
            "message": "There is currently no recorded inventory to analyze.",
            "metric": "No stock",
            "data": [],
        }

    if total_sold <= 0:
        return {
            "type": "optimization",
            "priority": "medium",
            "title": "Inventory Optimization",
            "message": (
                "Inventory is available but there are no recorded sales. "
                "Review stock utilization before adding more inventory."
            ),
            "metric": f"{format_number(total_stock)} units in stock",
            "data": [],
        }

    ratio = total_stock / total_sold

    return {
        "type": "optimization",
        "priority": "low",
        "title": "Inventory Optimization",
        "message": (
            "Monitor inventory against sales volume to reduce the risk "
            "of shortages and excess stock."
        ),
        "metric": f"{ratio:.1f} stock/sales ratio",
        "data": [{
            "total_stock": round(total_stock, 2),
            "total_sold": round(total_sold, 2),
            "stock_to_sales_ratio": round(ratio, 2),
        }],
    }


def generate_smart_insights(products=None, sales=None):
    """Generate the six Smart Decision Support insights."""
    products = products or []
    sales = sales or []

    return [
        analyze_restock(products),
        analyze_sales_opportunity(sales),
        analyze_slow_moving_products(products, sales),
        analyze_revenue(sales),
        analyze_demand_forecast(sales),
        analyze_inventory_optimization(products, sales),
    ]


# ============================================================
# GENERAL UTILITIES
# ============================================================

def generate_reference(prefix="INC"):
    """
    Generate a unique reference number.

    Example:
        INC-20260809-A8F32C

    Parameters:
        prefix (str): Reference prefix.

    Returns:
        str: Unique reference number.
    """

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    token = secrets.token_hex(3).upper()

    return f"{prefix}-{timestamp}-{token}"


def safe_int(value, default=0):
    """
    Safely convert a value to integer.

    Parameters:
        value: Value to convert.
        default: Value returned when conversion fails.

    Returns:
        int: Converted integer.
    """

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default=0.0):
    """
    Safely convert a value to float.

    Parameters:
        value: Value to convert.
        default: Value returned when conversion fails.

    Returns:
        float: Converted float.
    """

    try:
        return float(value)
    except (TypeError, ValueError):
        return default