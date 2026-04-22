from app import db

from tests.factories import create_user
from tests.helpers import api_login, auth_headers


def test_login_success_returns_token(client, app):
    with app.app_context():
        create_user(name="A", email="a@test.com", password="pw123456", role="customer")

    token, user = api_login(client, "a@test.com", "pw123456")
    assert token
    assert user["email"] == "a@test.com"


def test_login_wrong_password_401(client, app):
    with app.app_context():
        create_user(name="A", email="a2@test.com", password="pw123456", role="customer")

    res = client.post("/api/auth/login", json={"email": "a2@test.com", "password": "bad"})
    assert res.status_code == 401


def test_me_requires_token(client, app):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_with_token_returns_user(client, app):
    with app.app_context():
        create_user(name="B", email="b@test.com", password="pw123456", role="customer")

    token, _ = api_login(client, "b@test.com", "pw123456")
    res = client.get("/api/auth/me", headers=auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["email"] == "b@test.com"

