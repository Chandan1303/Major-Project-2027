import bcrypt
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import backend.app as auth_app


def make_user(*, role="user", email_verified=True, password="StrongPass123"):
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return SimpleNamespace(
        id=1,
        name="Test User",
        email="test@example.com",
        role=role,
        email_verified=email_verified,
        status="active",
        password_hash=password_hash,
        to_dict=lambda: {"id": 1, "email": "test@example.com", "role": role},
    )


class AuthenticationRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = auth_app.app.test_client()

    def test_public_registration_cannot_create_an_admin(self):
        response = self.client.post("/api/auth/register", json={
            "name": "Test Admin",
            "email": "admin@example.com",
            "password": "StrongPass123",
            "role": "admin",
        })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["code"], "ROLE_NOT_ALLOWED")

    def test_login_rejects_wrong_portal_before_issuing_a_cookie(self):
        user = make_user()
        query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(first=lambda: user)
        )
        with auth_app.app.app_context(), patch.object(auth_app.User, "query", query):
            response = self.client.post("/api/auth/login", json={
                "email": user.email,
                "password": "StrongPass123",
                "portal": "admin",
            })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["code"], "ROLE_MISMATCH")
        self.assertNotIn("token=", response.headers.get("Set-Cookie", ""))

    def test_verified_user_can_log_in_and_receives_an_http_only_cookie(self):
        user = make_user()
        query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(first=lambda: user)
        )
        with auth_app.app.app_context(), patch.object(auth_app.User, "query", query):
            response = self.client.post("/api/auth/login", json={
                "email": user.email,
                "password": "StrongPass123",
                "portal": "user",
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["user"]["role"], "user")
        cookie = response.headers.get("Set-Cookie", "")
        self.assertIn("token=", cookie)
        self.assertIn("HttpOnly", cookie)

    def test_login_requires_email_verification(self):
        user = make_user(email_verified=False)
        query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(first=lambda: user)
        )
        with auth_app.app.app_context(), patch.object(auth_app.User, "query", query):
            response = self.client.post("/api/auth/login", json={
                "email": user.email,
                "password": "StrongPass123",
                "portal": "user",
            })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["code"], "EMAIL_NOT_VERIFIED")
        self.assertNotIn("token=", response.headers.get("Set-Cookie", ""))

    def test_login_rejects_inactive_accounts(self):
        user = make_user()
        user.status = "suspended"
        query = SimpleNamespace(
            filter_by=lambda **_kwargs: SimpleNamespace(first=lambda: user)
        )
        with auth_app.app.app_context(), patch.object(auth_app.User, "query", query):
            response = self.client.post("/api/auth/login", json={
                "email": user.email,
                "password": "StrongPass123",
                "portal": "user",
            })

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["code"], "ACCOUNT_DISABLED")
        self.assertNotIn("token=", response.headers.get("Set-Cookie", ""))

    def test_admin_and_officer_apis_enforce_roles(self):
        standard_user = SimpleNamespace(role="user")
        with patch.object(auth_app, "get_current_user", return_value=standard_user):
            admin_response = self.client.get("/api/admin/stats")
            officer_response = self.client.get("/api/officer/stats")

        self.assertEqual(admin_response.status_code, 403)
        self.assertEqual(officer_response.status_code, 403)

    def test_admin_api_requires_authentication(self):
        with patch.object(auth_app, "get_current_user", return_value=None):
            response = self.client.get("/api/admin/stats")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
