from unittest.mock import MagicMock, patch

import backend.db as db


def test_transaction_rollback():
    connection = MagicMock()
    cursor = MagicMock()
    connection.cursor.return_value = cursor
    connection.is_connected.return_value = True

    def fake_execute(query, params=None):
        cursor.rowcount = 0 if "FORCE_FAILURE" in query else 1

    cursor.execute.side_effect = fake_execute

    with patch.object(db, "get_db_connection", return_value=connection):
        result = db.execute_transaction([
            ("FIRST_TEST_STATEMENT", (), 1),
            ("FORCE_FAILURE", (), 1),
        ])

    assert result is False, "Expected transaction to fail."
    connection.rollback.assert_called_once()
    connection.commit.assert_not_called()
    cursor.close.assert_called_once()
    connection.close.assert_called_once()

    print("PASS: Transaction returned False.")
    print("PASS: Rollback was called.")
    print("PASS: Commit was not called.")
    print("PASS: Cursor was closed.")
    print("PASS: Connection was closed.")
    print("\nTransaction rollback test passed.")


if __name__ == "__main__":
    test_transaction_rollback()
