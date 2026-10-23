import sqlite3
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from fastapi.security import HTTPAuthorizationCredentials

from app import main
from app.models import PasswordChangeRequest, UserLoginRequest


class PasswordChangeTests(unittest.TestCase):
    def setUp(self):
        self.database = f"file:password-{uuid4().hex}?mode=memory&cache=shared"
        self.keeper = self.connect()
        self.addCleanup(self.keeper.close)
        self.keeper.executescript(
            """
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                target_exam TEXT NOT NULL,
                avatar TEXT,
                created_at TEXT NOT NULL,
                password_hash TEXT
            );
            """
        )
        self.original_hash = main.password_hash.hash("correct-current-password")
        self.other_hash = main.password_hash.hash("other-current-password")
        self.keeper.executemany(
            """INSERT INTO users
               (id, email, name, target_exam, avatar, created_at, password_hash)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [
                ("member", "member@example.com", "Member", "JEE", None, "today", self.original_hash),
                ("other", "other@example.com", "Other", "NEET", None, "today", self.other_hash),
            ],
        )
        self.keeper.commit()
        self.connection_patch = patch("app.main.get_db_connection", side_effect=self.connect)
        self.connection_patch.start()
        self.addCleanup(self.connection_patch.stop)

    def connect(self):
        connection = sqlite3.connect(self.database, uri=True)
        connection.row_factory = sqlite3.Row
        return connection

    def login(self, email, password):
        return main.login(UserLoginRequest(email=email, password=password))

    def change(self, current_password, new_password, user_id="member"):
        request = PasswordChangeRequest(
            current_password=current_password,
            new_password=new_password,
        )
        return main.change_my_password(request, {"id": user_id})

    def test_password_change_updates_only_authenticated_user_and_new_password_works(self):
        result = self.change("correct-current-password", "new-valid-password")
        self.assertEqual(result, {"message": "Password updated successfully"})
        with self.assertRaises(HTTPException):
            self.login("member@example.com", "correct-current-password")
        self.assertIn("access_token", self.login("member@example.com", "new-valid-password"))

    def test_wrong_current_password_does_not_change_password(self):
        with self.assertRaises(HTTPException) as error:
            self.change("wrong-password", "new-valid-password")
        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "Current password is incorrect")
        with self.assertRaises(HTTPException):
            self.login("member@example.com", "new-valid-password")
        self.assertIn("access_token", self.login("member@example.com", "correct-current-password"))

    def test_password_change_uses_authenticated_identity_and_preserves_other_users(self):
        token = main.create_access_token("member")
        user = main.get_current_user(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        )
        self.change("correct-current-password", "new-valid-password", user["id"])
        self.assertIn("access_token", self.login("other@example.com", "other-current-password"))
        with self.assertRaises(HTTPException):
            self.login("other@example.com", "new-valid-password")

    def test_password_change_requires_authentication_and_enforces_length(self):
        with self.assertRaises(HTTPException) as error:
            main.get_current_user(None)
        self.assertEqual(error.exception.status_code, 401)
        with self.assertRaises(ValidationError):
            PasswordChangeRequest(current_password="current-password", new_password="short")

    def test_route_is_authenticated_and_does_not_return_password_hash(self):
        route = next(route for route in main.app.routes if getattr(route, "path", None) == "/users/me/password")
        self.assertIn("PATCH", route.methods)
        self.assertEqual(len(route.dependant.dependencies), 1)
        response = self.change("correct-current-password", "new-valid-password")
        self.assertNotIn("password_hash", response)


if __name__ == "__main__":
    unittest.main()
