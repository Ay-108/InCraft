# backend/db.py

"""
InCraft Database Module
-----------------------
Handles MySQL database connections and database operations.

All database-related operations should go through this module.
"""

import mysql.connector  # pyright: ignore[reportMissingImports]
from mysql.connector import Error  # pyright: ignore[reportMissingImports]
from typing import Optional, Tuple, cast

from backend.config import get_database_config


def _safe_close_resources(cursor=None, connection=None):
    """Close database resources without masking the original operation result."""
    if cursor is not None:
        try:
            cursor.close()
        except Exception as error:
            print(f"Database cursor cleanup error: {error}")

    if connection is not None:
        try:
            if connection.is_connected():
                connection.close()
        except Exception as error:
            print(f"Database connection cleanup error: {error}")


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():
    """
    Create and return a MySQL database connection.

    Returns:
        mysql.connector.connection.MySQLConnection | None
        A database connection if successful, otherwise None.
    """

    connection = None
    try:
        db_config = get_database_config()

        connection = mysql.connector.connect(
            host=db_config["host"],
            port=db_config["port"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"]
        )

        if connection.is_connected():
            return connection

    except Exception as error:
        # Connection/configuration details belong in server logs, not responses.
        print(f"Database connection error: {error}")

    _safe_close_resources(connection=connection)
    return None


# ============================================================
# DATABASE CONNECTION CHECK
# ============================================================

def test_connection():
    """
    Test whether the InCraft database is accessible.

    Returns:
        bool: True if connection is successful, otherwise False.
    """

    connection = get_db_connection()

    if connection is not None:
        connection.close()
        return True

    return False


# ============================================================
# SELECT OPERATIONS
# ============================================================

def fetch_one(query, params=None):
    """
    Execute a SELECT query and return one record.

    Parameters:
        query (str): SQL SELECT query.
        params (tuple | list | None): Query parameters.

    Returns:
        dict | None: A single record or None.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return None

        cursor = connection.cursor(dictionary=True)

        cursor.execute(query, params or ())

        return cursor.fetchone()

    except Error as error:
        print(f"Database fetch error: {error}")
        return None

    finally:
        _safe_close_resources(cursor, connection)


def fetch_all(query, params=None):
    """
    Execute a SELECT query and return all records.

    Parameters:
        query (str): SQL SELECT query.
        params (tuple | list | None): Query parameters.

    Returns:
        list: List of records.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return []

        cursor = connection.cursor(dictionary=True)

        cursor.execute(query, params or ())

        return cursor.fetchall()

    except Error as error:
        print(f"Database fetch error: {error}")
        return []

    finally:
        _safe_close_resources(cursor, connection)


# ============================================================
# INSERT / UPDATE / DELETE OPERATIONS
# ============================================================

def execute_query(query, params=None):
    """
    Execute an INSERT, UPDATE, or DELETE query.

    Parameters:
        query (str): SQL query.
        params (tuple | list | None): Query parameters.

    Returns:
        int | None:
            Last inserted ID for INSERT operations,
            affected row count for UPDATE/DELETE,
            None if the operation fails.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return None

        cursor = connection.cursor()

        cursor.execute(query, params or ())

        connection.commit()

        if query.strip().upper().startswith("INSERT"):
            return cursor.lastrowid

        return cursor.rowcount

    except Error as error:
        if connection is not None:
            connection.rollback()

        print(f"Database execution error: {error}")
        return None

    finally:
        _safe_close_resources(cursor, connection)


# ============================================================
# MULTIPLE QUERY OPERATIONS
# ============================================================

def execute_many(query, data):
    """
    Execute the same query for multiple sets of values.

    Useful for bulk imports such as CSV or Excel inventory data.

    Parameters:
        query (str): SQL INSERT/UPDATE query.
        data (list): List of tuples containing query values.

    Returns:
        int | None: Number of affected rows or None on failure.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return None

        cursor = connection.cursor()

        cursor.executemany(query, data)

        connection.commit()

        return cursor.rowcount

    except Error as error:
        if connection is not None:
            connection.rollback()

        print(f"Bulk database execution error: {error}")
        return None

    finally:
        _safe_close_resources(cursor, connection)


# ============================================================
# TRANSACTION SUPPORT
# ============================================================


def execute_transaction(queries):
    """
    Execute multiple SQL statements as one atomic transaction.

    Each item can be:
        (query, params)
        (query, params, expected_rowcount)

    If expected_rowcount is provided, the transaction is rolled
    back when the statement affects a different number of rows.
    """
    connection = None
    cursor = None

    try:
        if not queries:
            print("Transaction error: no statements were supplied.")
            return False

        connection = get_db_connection()

        if connection is None:
            return False

        cursor = connection.cursor()

        for item in queries:
            if len(item) == 2:
                query, params = item
                expected_rowcount = None
            elif len(item) == 3:
                query, params, expected_rowcount = item
            else:
                raise ValueError(
                    "Each transaction item must contain 2 or 3 elements."
                )

            cursor.execute(query, params or ())

            if (
                expected_rowcount is not None
                and cursor.rowcount != expected_rowcount
            ):
                raise RuntimeError(
                    "Transaction aborted: unexpected affected-row count."
                )

        connection.commit()
        return True

    except Exception as error:
        if connection is not None:
            try:
                connection.rollback()
            except Error as rollback_error:
                print(f"Transaction rollback error: {rollback_error}")

        print(f"Transaction error: {error}")
        return False

    finally:
        _safe_close_resources(cursor, connection)



# ============================================================
# DATABASE UTILITY FUNCTIONS
# ============================================================

def get_last_inserted_id(query, params=None):
    """
    Execute an INSERT query and return the newly generated ID.

    Parameters:
        query (str): INSERT query.
        params (tuple | list | None): Query parameters.

    Returns:
        int | None: Newly inserted record ID.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return None

        cursor = connection.cursor()

        cursor.execute(query, params or ())

        connection.commit()

        return cursor.lastrowid

    except Error as error:
        if connection is not None:
            connection.rollback()

        print(f"Insert error: {error}")
        return None

    finally:
        _safe_close_resources(cursor, connection)


def record_exists(query, params=None):
    """
    Check whether a database record exists.

    Parameters:
        query (str): SELECT query designed to check existence.
        params (tuple | list | None): Query parameters.

    Returns:
        bool: True if a record exists, otherwise False.
    """

    result = fetch_one(query, params)

    return result is not None


# ============================================================
# DATABASE HEALTH INFORMATION
# ============================================================

def get_database_status():
    """Return basic database connection status without exposing internals."""
    connection = get_db_connection()

    if connection is None:
        return {
            "connected": False,
            "message": "Unable to connect to database."
        }

    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_row = cast(Optional[Tuple[object, ...]], cursor.fetchone())
        database_name = database_row[0] if database_row is not None else None

        return {
            "connected": True,
            "database": database_name,
            "message": "Database connection successful."
        }

    except Exception as error:
        print(f"Database status probe failed: {error}")
        return {
            "connected": False,
            "message": "Database status is unavailable."
        }

    finally:
        _safe_close_resources(cursor, connection)


# ============================================================
# MODULE TEST
# ============================================================

if __name__ == "__main__":
    status = get_database_status()

    print("\n========================================")
    print("        INCRAFT DATABASE STATUS")
    print("========================================")
    print(f"Connected : {status.get('connected')}")

    if status.get("connected"):
        print(f"Database  : {status.get('database')}")

    print(f"Message   : {status.get('message')}")
    print("========================================\n")