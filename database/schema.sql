-- ============================================================
-- INCRAFT DATABASE SCHEMA
-- InCraft — The Art of Intelligent Inventory
-- ============================================================

-- ============================================================
-- DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS incraft
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE incraft;


-- ============================================================
-- TABLE 1: USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'admin',
        'manager',
        'staff'
    ) NOT NULL DEFAULT 'staff',

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NULL
);


-- ============================================================
-- TABLE 2: PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,

    product_code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    category VARCHAR(100) NOT NULL,

    quantity INT NOT NULL DEFAULT 0,

    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    minimum_stock INT NOT NULL DEFAULT 10,

    supplier VARCHAR(150) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NULL,

    CONSTRAINT chk_product_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_product_price
        CHECK (price >= 0),

    CONSTRAINT chk_product_minimum_stock
        CHECK (minimum_stock >= 0)
);


-- ============================================================
-- TABLE 3: SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,

    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    customer_name VARCHAR(150) NULL,

    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    payment_method ENUM(
        'cash',
        'card',
        'upi',
        'bank_transfer',
        'other'
    ) NOT NULL DEFAULT 'cash',

    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    user_id INT NULL,

    CONSTRAINT chk_sale_total
        CHECK (total_amount >= 0),

    CONSTRAINT fk_sales_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- TABLE 4: SALE ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,

    sale_id INT NOT NULL,

    product_id INT NOT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(12, 2) NOT NULL,

    subtotal DECIMAL(12, 2)
        GENERATED ALWAYS AS
        (quantity * unit_price) STORED,

    CONSTRAINT chk_sale_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_sale_item_price
        CHECK (unit_price >= 0),

    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- TABLE 5: ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action VARCHAR(50) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,

    entity_id INT NULL,

    description VARCHAR(500) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_username
ON users(username);

CREATE INDEX idx_users_status
ON users(status);


-- Products
CREATE INDEX idx_products_name
ON products(name);

CREATE INDEX idx_products_category
ON products(category);

CREATE INDEX idx_products_status
ON products(status);

CREATE INDEX idx_products_quantity
ON products(quantity);

CREATE INDEX idx_products_supplier
ON products(supplier);


-- Sales
CREATE INDEX idx_sales_date
ON sales(sale_date);

CREATE INDEX idx_sales_customer
ON sales(customer_name);

CREATE INDEX idx_sales_user
ON sales(user_id);


-- Sale Items
CREATE INDEX idx_sale_items_sale
ON sale_items(sale_id);

CREATE INDEX idx_sale_items_product
ON sale_items(product_id);


-- Activity
CREATE INDEX idx_activity_user
ON activity_logs(user_id);

CREATE INDEX idx_activity_created
ON activity_logs(created_at);

CREATE INDEX idx_activity_entity
ON activity_logs(entity_type, entity_id);


-- ============================================================
-- VIEW 1: INVENTORY SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW inventory_summary AS

SELECT
    p.product_id,
    p.product_code,
    p.name,
    p.category,
    p.quantity,
    p.price,
    p.minimum_stock,
    p.supplier,
    p.status,

    (p.quantity * p.price) AS stock_value,

    CASE
        WHEN p.quantity <= 0
            THEN 'OUT_OF_STOCK'

        WHEN p.quantity <= p.minimum_stock
            THEN 'LOW_STOCK'

        ELSE 'IN_STOCK'
    END AS stock_status

FROM products p;


-- ============================================================
-- VIEW 2: SALES SUMMARY
-- ============================================================

CREATE OR REPLACE VIEW sales_summary AS

SELECT
    s.sale_id,
    s.invoice_number,
    s.customer_name,
    s.total_amount,
    s.payment_method,
    s.sale_date,
    s.user_id,

    COUNT(si.sale_item_id) AS total_items,

    COALESCE(
        SUM(si.quantity),
        0
    ) AS total_quantity

FROM sales s

LEFT JOIN sale_items si
    ON s.sale_id = si.sale_id

GROUP BY
    s.sale_id,
    s.invoice_number,
    s.customer_name,
    s.total_amount,
    s.payment_method,
    s.sale_date,
    s.user_id;


-- ============================================================
-- VIEW 3: PRODUCT SALES PERFORMANCE
-- ============================================================

CREATE OR REPLACE VIEW product_sales_performance AS

SELECT
    p.product_id,

    p.product_code,

    p.name,

    p.category,

    COALESCE(
        SUM(si.quantity),
        0
    ) AS quantity_sold,

    COALESCE(
        SUM(si.subtotal),
        0
    ) AS revenue

FROM products p

LEFT JOIN sale_items si
    ON p.product_id = si.product_id

GROUP BY
    p.product_id,
    p.product_code,
    p.name,
    p.category;


-- ============================================================
-- VIEW 4: CATEGORY PERFORMANCE
-- ============================================================

CREATE OR REPLACE VIEW category_performance AS

SELECT
    p.category,

    COUNT(
        DISTINCT p.product_id
    ) AS product_count,

    COALESCE(
        SUM(p.quantity),
        0
    ) AS total_stock,

    COALESCE(
        SUM(p.quantity * p.price),
        0
    ) AS stock_value,

    COALESCE(
        SUM(si.quantity),
        0
    ) AS quantity_sold,

    COALESCE(
        SUM(si.subtotal),
        0
    ) AS sales_revenue

FROM products p

LEFT JOIN sale_items si
    ON p.product_id = si.product_id

WHERE p.status = 'active'

GROUP BY p.category;


-- ============================================================
-- VIEW 5: LOW STOCK PRODUCTS
-- ============================================================

CREATE OR REPLACE VIEW low_stock_products AS

SELECT
    product_id,
    product_code,
    name,
    category,
    quantity,
    minimum_stock,
    supplier

FROM products

WHERE status = 'active'

AND quantity <= minimum_stock;


-- ============================================================
-- OPTIONAL SAMPLE ADMIN USER
-- ============================================================

-- Do NOT insert a plain-text password.
--
-- A proper password hash will be generated by the
-- registration system.
--
-- Therefore, no default password is inserted here.


-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================