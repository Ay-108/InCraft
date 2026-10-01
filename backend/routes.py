"""
InCraft Routes
--------------
Application routes and request handling for:

- Authentication
- Dashboard
- Inventory
- Products
- Sales
- Analytics
- Activity / History
- Settings
- Search
- Import / Export
"""

from datetime import datetime

from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    jsonify,
    flash,
    session
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from backend.db import (
    fetch_one,
    fetch_all,
    execute_query,
    execute_many,
    execute_transaction
)

from backend.utils import (
    allowed_file,
    generate_csv_response,
    validate_email,
    validate_password,
    validate_required_fields,
    validate_positive_number,
    validate_non_negative_number,
    get_stock_status,
    calculate_stock_value,
    calculate_sale_total,
    format_currency,
    login_user,
    logout_user,
    login_required,
    get_current_user_id,
    create_activity_description,
    normalize_search_query,
    generate_reference,
    safe_int,
    safe_float
)


# ============================================================
# BLUEPRINT
# ============================================================

main_bp = Blueprint(
    "main",
    __name__
)


# ============================================================
# PUBLIC / GENERAL ROUTES
# ============================================================

@main_bp.route("/")
def index():
    """
    InCraft entry point.

    Logged-in users are sent to the dashboard.
    New users are sent to the login page.
    """

    if "user_id" in session:
        return redirect(url_for("main.dashboard"))

    return redirect(url_for("main.login"))


# ============================================================
# AUTHENTICATION
# ============================================================

@main_bp.route("/login", methods=["GET", "POST"])
def login():
    """
    User login.
    """

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        if not email or not password:

            flash(
                "Please enter your email and password.",
                "danger"
            )

            return render_template(
                "login.html"
            )

        user = fetch_one(
            """
            SELECT
                user_id,
                username,
                email,
                password,
                role,
                status
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        if user is None:

            flash(
                "Invalid email or password.",
                "danger"
            )

            return render_template(
                "login.html"
            )

        if user.get("status") != "active":

            flash(
                "Your account is inactive.",
                "danger"
            )

            return render_template(
                "login.html"
            )

        stored_password = user.get(
            "password",
            ""
        )

        if not stored_password:

            flash(
                "Invalid email or password.",
                "danger"
            )

            return render_template(
                "login.html"
            )

        try:

            password_valid = check_password_hash(
                stored_password,
                password
            )

        except Exception:

            password_valid = False

        if not password_valid:

            flash(
                "Invalid email or password.",
                "danger"
            )

            return render_template(
                "login.html"
            )

        login_user(user)

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user["user_id"],
                "LOGIN",
                "USER",
                user["user_id"],
                "User logged into InCraft",
                datetime.now()
            )
        )

        flash(
            f"Welcome back, {user['username']}!",
            "success"
        )

        return redirect(
            url_for("main.dashboard")
        )

    return render_template(
        "login.html"
    )


@main_bp.route(
    "/register",
    methods=["GET", "POST"]
)
def register():
    """
    User registration.
    """

    if request.method == "POST":

        username = request.form.get(
            "username",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        confirm_password = request.form.get(
            "confirm_password",
            ""
        )

        if not username or not email or not password:

            flash(
                "All required fields must be completed.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        if not validate_email(email):

            flash(
                "Please enter a valid email address.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        if not validate_password(password):

            flash(
                "Password must contain at least 8 characters, "
                "including a letter and a number.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        if password != confirm_password:

            flash(
                "Passwords do not match.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        existing_user = fetch_one(
            """
            SELECT user_id
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        if existing_user:

            flash(
                "An account with this email already exists.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        password_hash = generate_password_hash(
            password
        )

        user_id = execute_query(
            """
            INSERT INTO users
            (
                username,
                email,
                password,
                role,
                status,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                username,
                email,
                password_hash,
                "staff",
                "active",
                datetime.now()
            )
        )

        if user_id is None:

            flash(
                "Unable to create your account.",
                "danger"
            )

            return render_template(
                "register.html"
            )

        flash(
            "Registration successful. You can now log in.",
            "success"
        )

        return redirect(
            url_for("main.login")
        )

    return render_template(
        "register.html"
    )


@main_bp.route("/logout")
def logout():
    """
    Log out the current user.
    """

    user_id = get_current_user_id()

    if user_id:

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                "LOGOUT",
                "USER",
                user_id,
                "User logged out of InCraft",
                datetime.now()
            )
        )

    logout_user()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(
        url_for("main.login")
    )


# ============================================================
# DASHBOARD
# ============================================================

@main_bp.route("/dashboard")
@login_required
def dashboard():
    """
    Main InCraft dashboard.
    """

    total_products = fetch_one(
        """
        SELECT COUNT(*) AS total
        FROM products
        WHERE status = 'active'
        """
    )

    total_stock = fetch_one(
        """
        SELECT COALESCE(SUM(quantity), 0) AS total
        FROM products
        WHERE status = 'active'
        """
    )

    total_sales = fetch_one(
        """
        SELECT COALESCE(SUM(total_amount), 0) AS total
        FROM sales
        """
    )

    low_stock = fetch_one(
        """
        SELECT COUNT(*) AS total
        FROM products
        WHERE status = 'active'
        AND quantity <= minimum_stock
        """
    )

    recent_sales = fetch_all(
        """
        SELECT
            sale_id,
            invoice_number,
            customer_name,
            total_amount,
            sale_date
        FROM sales
        ORDER BY sale_date DESC
        LIMIT 5
        """
    )

    recent_activity = fetch_all(
        """
        SELECT
            activity_id,
            action,
            entity_type,
            description,
            created_at
        FROM activity_logs
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 8
        """,
        (
            get_current_user_id(),
        )
    )

    return render_template(
        "dashboard.html",
        total_products=(
            total_products["total"]
            if total_products
            else 0
        ),
        total_stock=(
            total_stock["total"]
            if total_stock
            else 0
        ),
        total_sales=(
            total_sales["total"]
            if total_sales
            else 0
        ),
        low_stock=(
            low_stock["total"]
            if low_stock
            else 0
        ),
        recent_sales=recent_sales,
        recent_activity=recent_activity
    )


# ============================================================
# INVENTORY
# ============================================================

@main_bp.route("/inventory")
@login_required
def inventory():
    """
    Display inventory with search and stock information.
    """

    search = normalize_search_query(
        request.args.get(
            "search",
            ""
        )
    )

    if search:

        search_pattern = f"%{search}%"

        products = fetch_all(
            """
            SELECT
                product_id,
                product_code,
                name,
                category,
                quantity,
                price,
                minimum_stock,
                supplier,
                status,
                created_at
            FROM products
            WHERE status = 'active'
            AND (
                name LIKE %s
                OR product_code LIKE %s
                OR category LIKE %s
                OR supplier LIKE %s
            )
            ORDER BY created_at DESC
            """,
            (
                search_pattern,
                search_pattern,
                search_pattern,
                search_pattern
            )
        )

    else:

        products = fetch_all(
            """
            SELECT
                product_id,
                product_code,
                name,
                category,
                quantity,
                price,
                minimum_stock,
                supplier,
                status,
                created_at
            FROM products
            WHERE status = 'active'
            ORDER BY created_at DESC
            """
        )

    for product in products:

        product["stock_status"] = get_stock_status(
            product.get(
                "quantity",
                0
            ),
            product.get(
                "minimum_stock",
                10
            )
        )

        product["stock_value"] = calculate_stock_value(
            product.get(
                "quantity",
                0
            ),
            product.get(
                "price",
                0
            )
        )

    return render_template(
        "inventory.html",
        products=products,
        search=search
    )


# ============================================================
# ADD PRODUCT
# ============================================================

@main_bp.route(
    "/inventory/add",
    methods=["GET", "POST"]
)
@login_required
def add_product():
    """
    Add a new inventory product.
    """

    if request.method == "POST":

        product_code = request.form.get(
            "product_code",
            ""
        ).strip()

        name = request.form.get(
            "name",
            ""
        ).strip()

        category = request.form.get(
            "category",
            ""
        ).strip()

        quantity = request.form.get(
            "quantity",
            "0"
        )

        price = request.form.get(
            "price",
            "0"
        )

        minimum_stock = request.form.get(
            "minimum_stock",
            "10"
        )

        supplier = request.form.get(
            "supplier",
            ""
        ).strip()

        required, missing = validate_required_fields(
            {
                "product_code": product_code,
                "name": name,
                "category": category
            },
            [
                "product_code",
                "name",
                "category"
            ]
        )

        if not required:

            flash(
                "Please complete all required product fields.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        if not validate_non_negative_number(
            quantity
        ):

            flash(
                "Quantity must be zero or greater.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        if not validate_positive_number(
            price
        ):

            flash(
                "Price must be greater than zero.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        if not validate_non_negative_number(
            minimum_stock
        ):

            flash(
                "Minimum stock must be zero or greater.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        existing_product = fetch_one(
            """
            SELECT product_id
            FROM products
            WHERE product_code = %s
            LIMIT 1
            """,
            (product_code,)
        )

        if existing_product:

            flash(
                "A product with this product code already exists.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        product_id = execute_query(
            """
            INSERT INTO products
            (
                product_code,
                name,
                category,
                quantity,
                price,
                minimum_stock,
                supplier,
                status,
                created_at,
                updated_at
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                product_code,
                name,
                category,
                safe_int(quantity),
                safe_float(price),
                safe_int(minimum_stock),
                supplier,
                "active",
                datetime.now(),
                datetime.now()
            )
        )

        if product_id is None:

            flash(
                "Unable to add the product.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=None
            )

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                get_current_user_id(),
                "CREATE",
                "PRODUCT",
                product_id,
                create_activity_description(
                    "Product added",
                    "Product",
                    name
                ),
                datetime.now()
            )
        )

        flash(
            "Product added successfully.",
            "success"
        )

        return redirect(
            url_for("main.inventory")
        )

    return render_template(
        "product_form.html",
        product=None
    )


# ============================================================
# EDIT PRODUCT
# ============================================================

@main_bp.route(
    "/inventory/edit/<int:product_id>",
    methods=["GET", "POST"]
)
@login_required
def edit_product(product_id):
    """
    Edit an existing inventory product.
    """

    product = fetch_one(
        """
        SELECT *
        FROM products
        WHERE product_id = %s
        LIMIT 1
        """,
        (product_id,)
    )

    if product is None:

        flash(
            "Product not found.",
            "danger"
        )

        return redirect(
            url_for("main.inventory")
        )

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        ).strip()

        category = request.form.get(
            "category",
            ""
        ).strip()

        quantity = request.form.get(
            "quantity",
            "0"
        )

        price = request.form.get(
            "price",
            "0"
        )

        minimum_stock = request.form.get(
            "minimum_stock",
            "10"
        )

        supplier = request.form.get(
            "supplier",
            ""
        ).strip()

        if not name or not category:

            flash(
                "Product name and category are required.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=product
            )

        if not validate_non_negative_number(
            quantity
        ):

            flash(
                "Quantity must be zero or greater.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=product
            )

        if not validate_positive_number(
            price
        ):

            flash(
                "Price must be greater than zero.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=product
            )

        if not validate_non_negative_number(
            minimum_stock
        ):

            flash(
                "Minimum stock must be zero or greater.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=product
            )

        update_result = execute_query(
            """
            UPDATE products
            SET
                name = %s,
                category = %s,
                quantity = %s,
                price = %s,
                minimum_stock = %s,
                supplier = %s,
                updated_at = %s
            WHERE product_id = %s
            """,
            (
                name,
                category,
                safe_int(quantity),
                safe_float(price),
                safe_int(minimum_stock),
                supplier,
                datetime.now(),
                product_id
            )
        )

        if update_result is None:

            flash(
                "Unable to update the product.",
                "danger"
            )

            return render_template(
                "product_form.html",
                product=product
            )

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                get_current_user_id(),
                "UPDATE",
                "PRODUCT",
                product_id,
                create_activity_description(
                    "Product updated",
                    "Product",
                    name
                ),
                datetime.now()
            )
        )

        flash(
            "Product updated successfully.",
            "success"
        )

        return redirect(
            url_for("main.inventory")
        )

    return render_template(
        "product_form.html",
        product=product
    )


# ============================================================
# DELETE / ARCHIVE PRODUCT
# ============================================================

@main_bp.route(
    "/inventory/delete/<int:product_id>",
    methods=["POST"]
)
@login_required
def delete_product(product_id):
    """
    Archive a product instead of permanently deleting it.

    This preserves historical sales and activity records.
    """

    product = fetch_one(
        """
        SELECT name
        FROM products
        WHERE product_id = %s
        LIMIT 1
        """,
        (product_id,)
    )

    if product is None:

        return jsonify({
            "success": False,
            "message": "Product not found."
        }), 404

    result = execute_query(
        """
        UPDATE products
        SET
            status = 'inactive',
            updated_at = %s
        WHERE product_id = %s
        """,
        (
            datetime.now(),
            product_id
        )
    )

    if result is None:

        return jsonify({
            "success": False,
            "message": "Unable to archive product."
        }), 500

    execute_query(
        """
        INSERT INTO activity_logs
        (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            get_current_user_id(),
            "DELETE",
            "PRODUCT",
            product_id,
            create_activity_description(
                "Product archived",
                "Product",
                product["name"]
            ),
            datetime.now()
        )
    )

    return jsonify({
        "success": True,
        "message": "Product archived successfully."
    })


# ============================================================
# PRODUCT SEARCH API
# ============================================================

@main_bp.route(
    "/api/products/search"
)
@login_required
def search_products():
    """
    Search products asynchronously.
    """

    search = normalize_search_query(
        request.args.get(
            "q",
            ""
        )
    )

    if not search:

        return jsonify({
            "success": True,
            "products": []
        })

    search_pattern = f"%{search}%"

    products = fetch_all(
        """
        SELECT
            product_id,
            product_code,
            name,
            category,
            quantity,
            price,
            minimum_stock
        FROM products
        WHERE status = 'active'
        AND (
            name LIKE %s
            OR product_code LIKE %s
            OR category LIKE %s
        )
        ORDER BY name ASC
        LIMIT 20
        """,
        (
            search_pattern,
            search_pattern,
            search_pattern
        )
    )

    return jsonify({
        "success": True,
        "products": products
    })


# ============================================================
# INVENTORY IMPORT
# ============================================================

@main_bp.route(
    "/inventory/import",
    methods=["POST"]
)
@login_required
def import_inventory():
    """
    Import inventory data from an uploaded CSV file.

    Expected CSV columns:

    product_code
    name
    category
    quantity
    price
    minimum_stock
    supplier
    """

    file = request.files.get(
        "file"
    )

    if file is None or not file.filename:

        flash(
            "Please select a file to import.",
            "danger"
        )

        return redirect(
            url_for("main.inventory")
        )

    if not allowed_file(
        file.filename
    ):

        flash(
            "Unsupported file format.",
            "danger"
        )

        return redirect(
            url_for("main.inventory")
        )

    extension = file.filename.rsplit(
        ".",
        1
    )[1].lower()

    if extension != "csv":

        flash(
            "Currently, inventory import supports CSV files.",
            "warning"
        )

        return redirect(
            url_for("main.inventory")
        )

    try:

        import csv
        import io

        content = file.read().decode(
            "utf-8-sig"
        )

        reader = csv.DictReader(
            io.StringIO(content)
        )

        rows = []

        for row in reader:

            product_code = (
                row.get(
                    "product_code",
                    ""
                ).strip()
            )

            name = (
                row.get(
                    "name",
                    ""
                ).strip()
            )

            category = (
                row.get(
                    "category",
                    ""
                ).strip()
            )

            if (
                not product_code
                or not name
                or not category
            ):
                continue

            quantity = safe_int(
                row.get(
                    "quantity",
                    0
                )
            )

            price = safe_float(
                row.get(
                    "price",
                    0
                )
            )

            minimum_stock = safe_int(
                row.get(
                    "minimum_stock",
                    10
                )
            )

            supplier = (
                row.get(
                    "supplier",
                    ""
                ).strip()
            )

            if quantity < 0:
                continue

            if price < 0:
                continue

            if minimum_stock < 0:
                continue

            rows.append(
                (
                    product_code,
                    name,
                    category,
                    quantity,
                    price,
                    minimum_stock,
                    supplier,
                    "active",
                    datetime.now(),
                    datetime.now()
                )
            )

        if not rows:

            flash(
                "No valid inventory records were found.",
                "warning"
            )

            return redirect(
                url_for("main.inventory")
            )

        imported_count = execute_many(
            """
            INSERT INTO products
            (
                product_code,
                name,
                category,
                quantity,
                price,
                minimum_stock,
                supplier,
                status,
                created_at,
                updated_at
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            rows
        )

        if imported_count is None:

            flash(
                "Inventory import failed. "
                "No records were imported.",
                "danger"
            )

            return redirect(
                url_for("main.inventory")
            )

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                get_current_user_id(),
                "IMPORT",
                "INVENTORY",
                f"Imported {imported_count} "
                f"inventory records",
                datetime.now()
            )
        )

        flash(
            f"{imported_count} inventory records "
            f"imported successfully.",
            "success"
        )

    except UnicodeDecodeError:

        flash(
            "Import failed: CSV file must use UTF-8 encoding.",
            "danger"
        )

    except Exception as error:

        flash(
            f"Import failed: {error}",
            "danger"
        )

    return redirect(
        url_for("main.inventory")
    )


# ============================================================
# INVENTORY EXPORT
# ============================================================

@main_bp.route(
    "/inventory/export"
)
@login_required
def export_inventory():
    """
    Export active inventory as CSV.
    """

    products = fetch_all(
        """
        SELECT
            product_code,
            name,
            category,
            quantity,
            price,
            minimum_stock,
            supplier,
            status
        FROM products
        WHERE status = 'active'
        ORDER BY name ASC
        """
    )

    if not products:

        flash(
            "There is no inventory data to export.",
            "warning"
        )

        return redirect(
            url_for("main.inventory")
        )

    execute_query(
        """
        INSERT INTO activity_logs
        (
            user_id,
            action,
            entity_type,
            description,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            get_current_user_id(),
            "EXPORT",
            "INVENTORY",
            "Inventory exported as CSV",
            datetime.now()
        )
    )

    return generate_csv_response(
        products,
        "incraft_inventory.csv"
    )


# ============================================================
# SALES
# ============================================================

@main_bp.route("/sales")
@login_required
def sales():
    """
    Display sales records and active inventory
    products for the Record Sale form.
    """

    sales_records = fetch_all(
        """
        SELECT
            sale_id,
            invoice_number,
            customer_name,
            total_amount,
            payment_method,
            sale_date
        FROM sales
        ORDER BY sale_date DESC
        """
    )

    products = fetch_all(
        """
        SELECT
            product_id,
            product_code,
            name,
            category,
            quantity,
            price,
            minimum_stock,
            supplier,
            status
        FROM products
        WHERE status = 'active'
        ORDER BY name ASC
        """
    )

    return render_template(
        "sales.html",
        sales=sales_records,
        products=products
    )


# ============================================================
# CREATE SALE
# ============================================================

@main_bp.route(
    "/sales/create",
    methods=["POST"]
)
@login_required
def create_sale():
    """
    Record a new sale and update product stock.

    The sale header, sale item, and inventory update
    are executed inside one transaction.
    """

    product_id = safe_int(
        request.form.get(
            "product_id"
        )
    )

    quantity = safe_int(
        request.form.get(
            "quantity"
        )
    )

    customer_name = request.form.get(
        "customer_name",
        ""
    ).strip()

    payment_method = request.form.get(
        "payment_method",
        "cash"
    ).strip().lower()

    allowed_payment_methods = {
        "cash",
        "card",
        "upi",
        "bank_transfer",
        "other"
    }

    if payment_method not in allowed_payment_methods:

        return jsonify({
            "success": False,
            "message": "Invalid payment method."
        }), 400

    if product_id <= 0 or quantity <= 0:

        return jsonify({
            "success": False,
            "message": "Invalid product or quantity."
        }), 400

    product = fetch_one(
        """
        SELECT
            product_id,
            name,
            quantity,
            price
        FROM products
        WHERE product_id = %s
        AND status = 'active'
        LIMIT 1
        """,
        (product_id,)
    )

    if product is None:

        return jsonify({
            "success": False,
            "message": "Product not found."
        }), 404

    current_stock = safe_int(
        product["quantity"]
    )

    if quantity > current_stock:

        return jsonify({
            "success": False,
            "message": "Insufficient stock."
        }), 400

    unit_price = safe_float(
        product["price"]
    )

    total_amount = calculate_sale_total(
        quantity,
        unit_price
    )

    invoice_number = generate_reference(
        "INV"
    )

    sale_date = datetime.now()

    queries = [

        (
            """
            INSERT INTO sales
            (
                invoice_number,
                customer_name,
                total_amount,
                payment_method,
                sale_date,
                user_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                invoice_number,
                customer_name or None,
                total_amount,
                payment_method,
                sale_date,
                get_current_user_id()
            )
        ),

        (
            """
            INSERT INTO sale_items
            (
                sale_id,
                product_id,
                quantity,
                unit_price
            )
            SELECT
                sale_id,
                %s,
                %s,
                %s
            FROM sales
            WHERE invoice_number = %s
            LIMIT 1
            """,
            (
                product_id,
                quantity,
                unit_price,
                invoice_number
            )
        ),

        (
            """
            UPDATE products
            SET
                quantity = quantity - %s,
                updated_at = %s
            WHERE product_id = %s
            AND status = 'active'
            AND quantity >= %s
            """,
            (
                quantity,
                datetime.now(),
                product_id,
                quantity
            )
        )
    ]

    success = execute_transaction(
        queries
    )

    if not success:

        return jsonify({
            "success": False,
            "message": "Unable to record the sale."
        }), 500

    execute_query(
        """
        INSERT INTO activity_logs
        (
            user_id,
            action,
            entity_type,
            description,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            get_current_user_id(),
            "CREATE",
            "SALE",
            f"Sale {invoice_number} recorded for "
            f"{product['name']}",
            datetime.now()
        )
    )

    return jsonify({
        "success": True,
        "message": "Sale recorded successfully.",
        "invoice_number": invoice_number,
        "total_amount": total_amount,
        "formatted_total": format_currency(
            total_amount
        )
    })


# ============================================================
# SALES EXPORT
# ============================================================

@main_bp.route(
    "/sales/export"
)
@login_required
def export_sales():
    """
    Export sales records as CSV.
    """

    sales_records = fetch_all(
        """
        SELECT
            invoice_number,
            customer_name,
            total_amount,
            payment_method,
            sale_date
        FROM sales
        ORDER BY sale_date DESC
        """
    )

    if not sales_records:

        flash(
            "There are no sales records to export.",
            "warning"
        )

        return redirect(
            url_for("main.sales")
        )

    execute_query(
        """
        INSERT INTO activity_logs
        (
            user_id,
            action,
            entity_type,
            description,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            get_current_user_id(),
            "EXPORT",
            "SALES",
            "Sales records exported as CSV",
            datetime.now()
        )
    )

    return generate_csv_response(
        sales_records,
        "incraft_sales.csv"
    )


# ============================================================
# SMART DECISION SUPPORT API
# ============================================================

@main_bp.route(
    "/api/dashboard/insights"
)
@login_required
def dashboard_insights():
    """
    Generate data-driven Smart Decision Support insights.

    The analysis uses:
        - Current inventory levels
        - Minimum stock levels
        - Product prices
        - Recent sales quantities
        - Recent sales revenue
        - Monthly revenue trends

    Returns:
        JSON response containing six insight categories.
    """

    try:
        products = fetch_all(
            """
            SELECT
                product_id,
                product_code,
                name,
                category,
                quantity,
                price,
                minimum_stock
            FROM products
            WHERE status = 'active'
            ORDER BY name ASC
            """
        )

        product_sales = fetch_all(
            """
            SELECT
                p.product_id,
                p.name,
                p.category,
                COALESCE(SUM(si.quantity), 0) AS quantity_sold,
                COALESCE(
                    SUM(si.quantity * si.unit_price),
                    0
                ) AS revenue
            FROM products p
            LEFT JOIN sale_items si
                ON p.product_id = si.product_id
            LEFT JOIN sales s
                ON si.sale_id = s.sale_id
            WHERE
                p.status = 'active'
                AND (
                    s.sale_id IS NULL
                    OR s.sale_date >= DATE_SUB(
                        NOW(),
                        INTERVAL 90 DAY
                    )
                )
            GROUP BY
                p.product_id,
                p.name,
                p.category
            ORDER BY quantity_sold DESC
            """
        )

        monthly_sales = fetch_all(
            """
            SELECT
                DATE_FORMAT(
                    sale_date,
                    '%Y-%m'
                ) AS month,
                COALESCE(
                    SUM(total_amount),
                    0
                ) AS revenue
            FROM sales
            WHERE sale_date >= DATE_SUB(
                NOW(),
                INTERVAL 6 MONTH
            )
            GROUP BY month
            ORDER BY month ASC
            """
        )

        sales_lookup = {}

        for row in product_sales:
            sales_lookup[row["product_id"]] = row

        insights = [
            {
                "type": "restock",
                "priority": "low",
                "title": "Restock Recommendation",
                "message": (
                    "No products currently require "
                    "immediate restocking."
                ),
                "metric": "Stock levels healthy",
                "data": {}
            },
            {
                "type": "sales",
                "priority": "low",
                "title": "Sales Opportunity",
                "message": (
                    "No significant sales opportunity "
                    "was detected."
                ),
                "metric": "No strong signal",
                "data": {}
            },
            {
                "type": "slow-moving",
                "priority": "low",
                "title": "Slow-Moving Products",
                "message": (
                    "No slow-moving inventory "
                    "was detected."
                ),
                "metric": "Inventory turnover healthy",
                "data": {}
            },
            {
                "type": "revenue",
                "priority": "low",
                "title": "Revenue Insight",
                "message": (
                    "Not enough sales data to identify "
                    "a revenue trend."
                ),
                "metric": "Insufficient data",
                "data": {}
            },
            {
                "type": "forecast",
                "priority": "low",
                "title": "Demand Forecast",
                "message": (
                    "Not enough historical sales data "
                    "for a reliable demand indication."
                ),
                "metric": "Insufficient data",
                "data": {}
            },
            {
                "type": "optimization",
                "priority": "low",
                "title": "Inventory Optimization",
                "message": (
                    "Inventory appears reasonably balanced."
                ),
                "metric": "No major imbalance",
                "data": {}
            }
        ]

        # --------------------------------------------------------
        # 1. RESTOCK RECOMMENDATION
        # --------------------------------------------------------

        restock_products = []

        for product in products:
            quantity = safe_int(
                product.get("quantity", 0)
            )

            minimum_stock = safe_int(
                product.get("minimum_stock", 0)
            )

            if quantity <= minimum_stock:
                shortage = max(
                    minimum_stock - quantity,
                    0
                )

                recommended_quantity = max(
                    minimum_stock * 2 - quantity,
                    1
                )

                restock_products.append({
                    "name": product.get(
                        "name",
                        "Unknown Product"
                    ),
                    "quantity": quantity,
                    "minimum_stock": minimum_stock,
                    "recommended_quantity": (
                        recommended_quantity
                    ),
                    "shortage": shortage
                })

        if restock_products:
            restock_products.sort(
                key=lambda item: (
                    item["shortage"],
                    item["minimum_stock"]
                ),
                reverse=True
            )

            item = restock_products[0]

            if item["quantity"] == 0:
                priority = "high"
            elif item["quantity"] < item["minimum_stock"]:
                priority = "high"
            else:
                priority = "medium"

            insights[0] = {
                "type": "restock",
                "priority": priority,
                "title": "Restock Recommendation",
                "message": (
                    f"{item['name']} is at "
                    f"{item['quantity']} units, "
                    f"which is at or below its "
                    f"minimum stock level of "
                    f"{item['minimum_stock']}. "
                    f"Consider adding approximately "
                    f"{item['recommended_quantity']} "
                    f"units."
                ),
                "metric": (
                    f"{len(restock_products)} "
                    f"product(s) need attention"
                ),
                "data": {
                    "products": restock_products
                }
            }

        # --------------------------------------------------------
        # 2. SALES OPPORTUNITY
        # --------------------------------------------------------

        sales_candidates = []

        for row in product_sales:
            quantity_sold = safe_int(
                row.get("quantity_sold", 0)
            )

            revenue = safe_float(
                row.get("revenue", 0)
            )

            product_id = row.get("product_id")

            product = next(
                (
                    p for p in products
                    if p.get("product_id") == product_id
                ),
                None
            )

            if product is None:
                continue

            stock = safe_int(
                product.get("quantity", 0)
            )

            if quantity_sold > 0 and stock > 0:
                sales_candidates.append({
                    "name": row.get(
                        "name",
                        "Unknown Product"
                    ),
                    "quantity_sold": quantity_sold,
                    "revenue": revenue,
                    "stock": stock
                })

        if sales_candidates:
            sales_candidates.sort(
                key=lambda item: (
                    item["quantity_sold"],
                    item["revenue"]
                ),
                reverse=True
            )

            item = sales_candidates[0]

            insights[1] = {
                "type": "sales",
                "priority": "medium",
                "title": "Sales Opportunity",
                "message": (
                    f"{item['name']} has recorded "
                    f"{item['quantity_sold']} units "
                    f"sold during the recent analysis "
                    f"period. Current stock is "
                    f"{item['stock']} units."
                ),
                "metric": (
                    f"{item['quantity_sold']} units sold"
                ),
                "data": item
            }

        # --------------------------------------------------------
        # 3. SLOW-MOVING PRODUCTS
        # --------------------------------------------------------

        slow_products = []

        for product in products:
            product_id = product.get("product_id")

            sales = sales_lookup.get(
                product_id,
                {}
            )

            quantity_sold = safe_int(
                sales.get("quantity_sold", 0)
            )

            stock = safe_int(
                product.get("quantity", 0)
            )

            if stock > 0 and quantity_sold <= 2:
                stock_value = round(
                    stock * safe_float(
                        product.get("price", 0)
                    ),
                    2
                )

                slow_products.append({
                    "name": product.get(
                        "name",
                        "Unknown Product"
                    ),
                    "stock": stock,
                    "quantity_sold": quantity_sold,
                    "stock_value": stock_value
                })

        if slow_products:
            slow_products.sort(
                key=lambda item: item["stock_value"],
                reverse=True
            )

            item = slow_products[0]

            insights[2] = {
                "type": "slow-moving",
                "priority": "medium",
                "title": "Slow-Moving Products",
                "message": (
                    f"{item['name']} currently has "
                    f"{item['stock']} units in stock "
                    f"but only {item['quantity_sold']} "
                    f"units were sold during the "
                    f"recent analysis period. "
                    f"Consider reviewing its stock level."
                ),
                "metric": (
                    f"{len(slow_products)} "
                    f"slow-moving product(s)"
                ),
                "data": {
                    "products": slow_products
                }
            }

        # --------------------------------------------------------
        # 4. REVENUE INSIGHT
        # --------------------------------------------------------

        total_revenue = sum(
            safe_float(
                row.get("revenue", 0)
            )
            for row in product_sales
        )

        revenue_products = [
            row
            for row in product_sales
            if safe_float(
                row.get("revenue", 0)
            ) > 0
        ]

        if revenue_products:
            revenue_products.sort(
                key=lambda row: safe_float(
                    row.get("revenue", 0)
                ),
                reverse=True
            )

            top_revenue = revenue_products[0]

            insights[3] = {
                "type": "revenue",
                "priority": "low",
                "title": "Revenue Insight",
                "message": (
                    f"{top_revenue.get('name', 'Product')} "
                    f"generated the highest product-level "
                    f"revenue during the recent analysis "
                    f"period."
                ),
                "metric": (
                    f"₹{safe_float(top_revenue.get('revenue', 0)):,.2f}"
                ),
                "data": {
                    "product": top_revenue.get(
                        "name",
                        "Unknown Product"
                    ),
                    "revenue": safe_float(
                        top_revenue.get(
                            "revenue",
                            0
                        )
                    ),
                    "total_revenue": total_revenue
                }
            }

        # --------------------------------------------------------
        # 5. DEMAND FORECAST
        # --------------------------------------------------------

        monthly_values = [
            safe_float(
                row.get("revenue", 0)
            )
            for row in monthly_sales
        ]

        if len(monthly_values) >= 2:
            recent_revenue = monthly_values[-1]
            previous_revenue = monthly_values[-2]

            if previous_revenue > 0:
                change_percent = (
                    (
                        recent_revenue -
                        previous_revenue
                    )
                    / previous_revenue
                ) * 100

                if change_percent > 10:
                    forecast_message = (
                        "Recent revenue increased "
                        f"by {change_percent:.1f}% "
                        "compared with the previous "
                        "month. Demand may continue "
                        "to require closer stock monitoring."
                    )

                    forecast_priority = "medium"

                elif change_percent < -10:
                    forecast_message = (
                        "Recent revenue decreased "
                        f"by {abs(change_percent):.1f}% "
                        "compared with the previous "
                        "month. Review demand before "
                        "increasing inventory."
                    )

                    forecast_priority = "medium"

                else:
                    forecast_message = (
                        "Recent revenue has remained "
                        "relatively stable compared "
                        "with the previous month."
                    )

                    forecast_priority = "low"

                insights[4] = {
                    "type": "forecast",
                    "priority": forecast_priority,
                    "title": "Demand Forecast",
                    "message": forecast_message,
                    "metric": (
                        f"{change_percent:+.1f}% "
                        "month-over-month"
                    ),
                    "data": {
                        "current_revenue": (
                            recent_revenue
                        ),
                        "previous_revenue": (
                            previous_revenue
                        ),
                        "change_percent": round(
                            change_percent,
                            2
                        )
                    }
                }

        # --------------------------------------------------------
        # 6. INVENTORY OPTIMIZATION
        # --------------------------------------------------------

        total_inventory_value = 0
        excess_stock_value = 0
        excess_products = []

        for product in products:
            quantity = safe_int(
                product.get("quantity", 0)
            )

            minimum_stock = safe_int(
                product.get("minimum_stock", 0)
            )

            price = safe_float(
                product.get("price", 0)
            )

            stock_value = quantity * price

            total_inventory_value += stock_value

            sales = sales_lookup.get(
                product.get("product_id"),
                {}
            )

            quantity_sold = safe_int(
                sales.get("quantity_sold", 0)
            )

            if (
                minimum_stock > 0
                and quantity >= minimum_stock * 3
                and quantity_sold <= 2
            ):
                excess_products.append({
                    "name": product.get(
                        "name",
                        "Unknown Product"
                    ),
                    "stock": quantity,
                    "minimum_stock": minimum_stock,
                    "stock_value": round(
                        stock_value,
                        2
                    )
                })

                excess_stock_value += stock_value

        if excess_products:
            excess_products.sort(
                key=lambda item: item["stock_value"],
                reverse=True
            )

            insights[5] = {
                "type": "optimization",
                "priority": "medium",
                "title": "Inventory Optimization",
                "message": (
                    f"{len(excess_products)} product(s) "
                    "have relatively high stock compared "
                    "with their recent sales activity. "
                    "Review these products before "
                    "purchasing additional stock."
                ),
                "metric": (
                    f"₹{excess_stock_value:,.2f} "
                    "potentially tied in excess stock"
                ),
                "data": {
                    "products": excess_products,
                    "inventory_value": round(
                        total_inventory_value,
                        2
                    ),
                    "excess_stock_value": round(
                        excess_stock_value,
                        2
                    )
                }
            }

        return jsonify({
            "success": True,
            "insights": insights,
            "generated_at": datetime.now().isoformat()
        })

    except Exception as error:
        print(
            f"Smart insights error: {error}"
        )

        return jsonify({
            "success": False,
            "message": (
                "Unable to generate smart "
                "inventory insights."
            ),
            "insights": []
        }), 500


# ============================================================
# ANALYTICS
# ============================================================

@main_bp.route("/analytics")
@login_required
def analytics():
    """
    Analytics page.
    """

    total_revenue = fetch_one(
        """
        SELECT
            COALESCE(
                SUM(total_amount),
                0
            ) AS total
        FROM sales
        """
    )

    total_transactions = fetch_one(
        """
        SELECT COUNT(*) AS total
        FROM sales
        """
    )

    inventory_value = fetch_one(
        """
        SELECT
            COALESCE(
                SUM(quantity * price),
                0
            ) AS total
        FROM products
        WHERE status = 'active'
        """
    )

    category_data = fetch_all(
        """
        SELECT
            category,
            COUNT(*) AS product_count,
            COALESCE(
                SUM(quantity),
                0
            ) AS total_stock,
            COALESCE(
                SUM(quantity * price),
                0
            ) AS stock_value
        FROM products
        WHERE status = 'active'
        GROUP BY category
        ORDER BY stock_value DESC
        """
    )

    monthly_sales = fetch_all(
        """
        SELECT
            DATE_FORMAT(
                sale_date,
                '%Y-%m'
            ) AS month,
            COUNT(*) AS transactions,
            COALESCE(
                SUM(total_amount),
                0
            ) AS revenue
        FROM sales
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
        """
    )

    top_products = fetch_all(
        """
        SELECT
            p.name,
            SUM(si.quantity) AS quantity_sold,
            SUM(
                si.quantity * si.unit_price
            ) AS revenue
        FROM sale_items si
        INNER JOIN products p
            ON p.product_id = si.product_id
        GROUP BY
            p.product_id,
            p.name
        ORDER BY quantity_sold DESC
        LIMIT 10
        """
    )

    low_stock_products = fetch_all(
        """
        SELECT
            product_id,
            product_code,
            name,
            quantity,
            minimum_stock
        FROM products
        WHERE status = 'active'
        AND quantity <= minimum_stock
        ORDER BY quantity ASC
        """
    )

    return render_template(
        "analytics.html",
        total_revenue=(
            total_revenue["total"]
            if total_revenue
            else 0
        ),
        total_transactions=(
            total_transactions["total"]
            if total_transactions
            else 0
        ),
        inventory_value=(
            inventory_value["total"]
            if inventory_value
            else 0
        ),
        category_data=category_data,
        monthly_sales=monthly_sales,
        top_products=top_products,
        low_stock_products=low_stock_products
    )


# ============================================================
# ANALYTICS API
# ============================================================

@main_bp.route(
    "/api/analytics"
)
@login_required
def analytics_api():
    """
    Return analytics data for JavaScript charts.
    """

    monthly_sales = fetch_all(
        """
        SELECT
            DATE_FORMAT(
                sale_date,
                '%Y-%m'
            ) AS month,
            COALESCE(
                SUM(total_amount),
                0
            ) AS revenue
        FROM sales
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
        """
    )

    category_data = fetch_all(
        """
        SELECT
            category,
            COALESCE(
                SUM(quantity * price),
                0
            ) AS value
        FROM products
        WHERE status = 'active'
        GROUP BY category
        ORDER BY value DESC
        """
    )

    return jsonify({
        "success": True,
        "monthly_sales": monthly_sales,
        "category_data": category_data
    })


# ============================================================
# ACTIVITY / HISTORY
# ============================================================

@main_bp.route("/activity")
@login_required
def activity():
    """
    Display user activity history.
    """

    activities = fetch_all(
        """
        SELECT
            a.activity_id,
            a.action,
            a.entity_type,
            a.entity_id,
            a.description,
            a.created_at,
            u.username
        FROM activity_logs a
        INNER JOIN users u
            ON u.user_id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 100
        """
    )

    return render_template(
        "activity.html",
        activities=activities
    )


# ============================================================
# SETTINGS
# ============================================================

@main_bp.route(
    "/settings",
    methods=["GET", "POST"]
)
@login_required
def settings():
    """
    User settings and password update.
    """

    user_id = get_current_user_id()

    user = fetch_one(
        """
        SELECT
            user_id,
            username,
            email,
            role
        FROM users
        WHERE user_id = %s
        LIMIT 1
        """,
        (user_id,)
    )

    if user is None:

        logout_user()

        return redirect(
            url_for("main.login")
        )

    if request.method == "POST":

        username = request.form.get(
            "username",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        current_password = request.form.get(
            "current_password",
            ""
        )

        new_password = request.form.get(
            "new_password",
            ""
        )

        confirm_password = request.form.get(
            "confirm_password",
            ""
        )

        if not username or not email:

            flash(
                "Username and email are required.",
                "danger"
            )

            return render_template(
                "settings.html",
                user=user
            )

        if not validate_email(email):

            flash(
                "Please enter a valid email address.",
                "danger"
            )

            return render_template(
                "settings.html",
                user=user
            )

        existing_email = fetch_one(
            """
            SELECT user_id
            FROM users
            WHERE email = %s
            AND user_id != %s
            LIMIT 1
            """,
            (
                email,
                user_id
            )
        )

        if existing_email:

            flash(
                "This email is already in use.",
                "danger"
            )

            return render_template(
                "settings.html",
                user=user
            )

        password_hash = None

        if new_password:

            if not current_password:

                flash(
                    "Current password is required.",
                    "danger"
                )

                return render_template(
                    "settings.html",
                    user=user
                )

            password_record = fetch_one(
                """
                SELECT password
                FROM users
                WHERE user_id = %s
                LIMIT 1
                """,
                (user_id,)
            )

            if (
                password_record is None
                or not check_password_hash(
                    password_record["password"],
                    current_password
                )
            ):

                flash(
                    "Current password is incorrect.",
                    "danger"
                )

                return render_template(
                    "settings.html",
                    user=user
                )

            if not validate_password(
                new_password
            ):

                flash(
                    "New password must contain at least "
                    "8 characters, including a letter "
                    "and a number.",
                    "danger"
                )

                return render_template(
                    "settings.html",
                    user=user
                )

            if new_password != confirm_password:

                flash(
                    "New passwords do not match.",
                    "danger"
                )

                return render_template(
                    "settings.html",
                    user=user
                )

            password_hash = generate_password_hash(
                new_password
            )

        update_result = execute_query(
            """
            UPDATE users
            SET
                username = %s,
                email = %s,
                password = COALESCE(%s, password),
                updated_at = %s
            WHERE user_id = %s
            """,
            (
                username,
                email,
                password_hash,
                datetime.now(),
                user_id
            )
        )

        if update_result is None:

            flash(
                "Unable to update your settings.",
                "danger"
            )

            return render_template(
                "settings.html",
                user=user
            )

        session["username"] = username
        session["email"] = email

        execute_query(
            """
            INSERT INTO activity_logs
            (
                user_id,
                action,
                entity_type,
                entity_id,
                description,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                "UPDATE",
                "SETTINGS",
                user_id,
                "User settings updated",
                datetime.now()
            )
        )

        flash(
            "Settings updated successfully.",
            "success"
        )

        return redirect(
            url_for("main.settings")
        )

    return render_template(
        "settings.html",
        user=user
    )


# ============================================================
# PRODUCT DETAILS API
# ============================================================

@main_bp.route(
    "/api/products/<int:product_id>"
)
@login_required
def product_details(product_id):
    """
    Return product information as JSON.
    """

    product = fetch_one(
        """
        SELECT
            product_id,
            product_code,
            name,
            category,
            quantity,
            price,
            minimum_stock,
            supplier,
            status,
            created_at,
            updated_at
        FROM products
        WHERE product_id = %s
        LIMIT 1
        """,
        (product_id,)
    )

    if product is None:

        return jsonify({
            "success": False,
            "message": "Product not found."
        }), 404

    product["stock_status"] = get_stock_status(
        product["quantity"],
        product["minimum_stock"]
    )

    product["stock_value"] = calculate_stock_value(
        product["quantity"],
        product["price"]
    )

    return jsonify({
        "success": True,
        "product": product
    })


# ============================================================
# LOW STOCK API
# ============================================================

@main_bp.route(
    "/api/inventory/low-stock"
)
@login_required
def low_stock_api():
    """
    Return products requiring restocking.
    """

    products = fetch_all(
        """
        SELECT
            product_id,
            product_code,
            name,
            quantity,
            minimum_stock
        FROM products
        WHERE status = 'active'
        AND quantity <= minimum_stock
        ORDER BY quantity ASC
        """
    )

    return jsonify({
        "success": True,
        "count": len(products),
        "products": products
    })


# ============================================================
# HEALTH CHECK
# ============================================================

@main_bp.route(
    "/api/health"
)
def health_check():
    """
    Simple backend health-check endpoint.
    """

    from backend.db import get_database_status

    database_status = get_database_status()

    return jsonify({
        "application": "InCraft",
        "status": "running",
        "database": database_status
    })