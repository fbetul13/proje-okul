from __future__ import annotations

from typing import Any, Dict, Tuple


def api_login(client, email: str, password: str) -> Tuple[str, Dict[str, Any]]:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    data = res.get_json()
    return data["access_token"], data["user"]


def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}

