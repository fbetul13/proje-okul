from tests.factories import create_business, create_user
from tests.helpers import api_login, auth_headers


def test_superadmin_users_pagination_and_search(client, app):
    with app.app_context():
        create_user(name="Admin", email="super@test.com", password="super123", role="superadmin")
        # Create >20 users for page=2
        for i in range(25):
            create_user(
                name=f"User {i}",
                email=f"u{i}@test.com",
                password="pw123456",
                role="customer",
            )
        create_user(name="FindMe", email="findme@example.com", password="pw123456", role="customer")

    token, _ = api_login(client, "super@test.com", "super123")
    res = client.get("/api/superadmin/users?page=2", headers=auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "pages" in data and data["pages"] >= 2
    assert "total" in data and data["total"] >= 26

    res2 = client.get("/api/superadmin/users?page=1&search=findme", headers=auth_headers(token))
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert any(u["email"] == "findme@example.com" for u in data2["users"])


def test_superadmin_businesses_pagination_and_search(client, app):
    with app.app_context():
        create_user(name="Admin", email="super2@test.com", password="super123", role="superadmin")
        for i in range(25):
            create_business(name=f"Biz {i}")
        create_business(name="UniqueBizName")

    token, _ = api_login(client, "super2@test.com", "super123")
    res = client.get("/api/superadmin/businesses?page=2", headers=auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "pages" in data and data["pages"] >= 2
    assert "total" in data and data["total"] >= 26

    res2 = client.get("/api/superadmin/businesses?page=1&search=UniqueBizName", headers=auth_headers(token))
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert any(b["name"] == "UniqueBizName" for b in data2["businesses"])


def test_superadmin_logs_smoke(client, app):
    with app.app_context():
        create_user(name="Admin", email="super3@test.com", password="super123", role="superadmin")

    token, _ = api_login(client, "super3@test.com", "super123")
    res = client.get("/api/superadmin/logs?page=1&search=", headers=auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert "logs" in data
    assert "pages" in data
    assert "total" in data

