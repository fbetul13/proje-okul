from __future__ import annotations

from datetime import datetime, date, time

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore


_TR_TZ = ZoneInfo("Europe/Istanbul") if ZoneInfo else None


def now_tr() -> datetime:
    """
    Returns current time in Turkey (Europe/Istanbul).
    Falls back to local server time if zoneinfo is unavailable.
    """
    if _TR_TZ is None:
        return datetime.now()
    return datetime.now(_TR_TZ)


def today_tr() -> date:
    return now_tr().date()


def combine_tr(d: date, t: time) -> datetime:
    dt = datetime.combine(d, t)
    if _TR_TZ is None:
        return dt
    return dt.replace(tzinfo=_TR_TZ)
