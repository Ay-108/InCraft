-- ============================================================
-- MIGRATION: ADD SALES IDEMPOTENCY KEY
-- InCraft — The Art of Intelligent Inventory
-- ============================================================
--
-- Apply this migration once to an existing InCraft MySQL database.
-- It is safe to re-run: the column and unique index are checked
-- independently before being created.
--
-- The application generates UUIDs for new sale attempts and stores
-- the key on the sales row. A unique index prevents concurrent
-- retries with the same key from creating duplicate transactions.
-- Existing sales remain valid because the column is nullable.
--
-- Run with a MySQL client connected to the InCraft database, or
-- execute the script after USE incraft.
-- ============================================================

USE incraft;

-- Add the nullable column only when it does not already exist.
SET @has_idempotency_column = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND COLUMN_NAME = 'idempotency_key'
);

SET @add_idempotency_column_sql = IF(
    @has_idempotency_column = 0,
    'ALTER TABLE sales ADD COLUMN idempotency_key CHAR(36) NULL AFTER invoice_number',
    'SELECT ''sales.idempotency_key already exists'' AS migration_status'
);

PREPARE add_idempotency_column_stmt FROM @add_idempotency_column_sql;
EXECUTE add_idempotency_column_stmt;
DEALLOCATE PREPARE add_idempotency_column_stmt;

-- Add the unique index only when the named index is absent.
SET @has_idempotency_index = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND INDEX_NAME = 'uq_sales_idempotency_key'
);

SET @add_idempotency_index_sql = IF(
    @has_idempotency_index = 0,
    'CREATE UNIQUE INDEX uq_sales_idempotency_key ON sales (idempotency_key)',
    'SELECT ''uq_sales_idempotency_key already exists'' AS migration_status'
);

PREPARE add_idempotency_index_stmt FROM @add_idempotency_index_sql;
EXECUTE add_idempotency_index_stmt;
DEALLOCATE PREPARE add_idempotency_index_stmt;

SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'sales'
  AND COLUMN_NAME = 'idempotency_key';

SHOW INDEX FROM sales WHERE Key_name = 'uq_sales_idempotency_key';
