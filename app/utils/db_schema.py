"""Lightweight schema patches for dev / existing DBs (Flask-Migrate yokken)."""

from sqlalchemy import inspect, text


def _quote_ident(dialect_name: str, name: str) -> str:
    if dialect_name == "postgresql":
        return '"' + name.replace('"', '""') + '"'
    return name


def ensure_user_profile_columns(engine) -> None:
    """users tablosunda phone / avatar_url kolonları yoksa ALTER TABLE ile ekler."""
    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    dialect = engine.dialect.name
    existing = {c["name"] for c in insp.get_columns("users")}
    users = _quote_ident(dialect, "users")

    with engine.begin() as conn:
        if "phone" not in existing:
            conn.execute(
                text(f"ALTER TABLE {users} ADD COLUMN phone VARCHAR(20)")
            )
        if "avatar_url" not in existing:
            conn.execute(
                text(f"ALTER TABLE {users} ADD COLUMN avatar_url VARCHAR(500)")
            )
