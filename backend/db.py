# backend/db.py

"""
InCraft Database Module
-----------------------
Handles MySQL database connections and database operations.

All database-related operations should go through this module.
"""

import mysql.connector  # pyright: ignore[reportMissingImports]
from mysql.connector import Error  # pyright: ignore[reportMissingImports]

from backend.config import get_database_config


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

    except Error as error:
        print(f"Database connection error: {error}")

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
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


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
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


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
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


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
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


# ============================================================
# TRANSACTION SUPPORT
# ============================================================

def execute_transaction(queries):
    """
    Execute multiple SQL queries as a single transaction.

    If any query fails, all changes are rolled back.

    Parameters:
        queries (list):
            List of tuples in the form:
            (query, params)

    Example:
        queries = [
            (
                "INSERT INTO products (...) VALUES (...)",
                (...)
            ),
            (
                "UPDATE inventory SET ... WHERE ...",
                (...)
            )
        ]

    Returns:
        bool: True if the transaction succeeds, otherwise False.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        if connection is None:
            return False

        cursor = connection.cursor()

        for query, params in queries:
            cursor.execute(query, params or ())

        connection.commit()

        return True

    except Error as error:
        if connection is not None:
            connection.rollback()

        print(f"Transaction error: {error}")
        return False

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


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
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


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
    """
    Return basic database connection status.

    Returns:
        dict: Database status information.
    """

    connection = get_db_connection()

    if connection is None:
        return {
            "connected": False,
            "message": "Unable to connect to database."
        }

    try:
        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")

        database_name = cursor.fetchone()[0]

        cursor.close()
        connection.close()

        return {
            "connected": True,
            "database": database_name,
            "message": "Database connection successful."
        }

    except Error as error:
        if connection.is_connected():
            connection.close()

        return {
            "connected": False,
            "message": str(error)
        }


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