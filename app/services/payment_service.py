"""
Payment Service — Stripe Checkout integration for BetulBooking
"""
import os
import json
import logging
from datetime import datetime
from urllib import request as urlrequest, parse as urlparse, error as urlerror

logger = logging.getLogger(__name__)

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_API_BASE = "https://api.stripe.com/v1"


def is_configured():
    return bool(STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY)


def _flatten_params(params, parent_key=""):
    items = []
    for k, v in params.items():
        new_key = f"{parent_key}[{k}]" if parent_key else k
        if isinstance(v, dict):
            items.extend(_flatten_params(v, new_key).items())
        elif isinstance(v, list):
            for i, item in enumerate(v):
                if isinstance(item, dict):
                    items.extend(_flatten_params(item, f"{new_key}[{i}]").items())
                else:
                    items.append((f"{new_key}[{i}]", item))
        elif v is not None:
            items.append((new_key, str(v)))
    return dict(items)


def _stripe_request(endpoint, method="POST", params=None, timeout=30):
    if not STRIPE_SECRET_KEY:
        return None, "Stripe secret key not configured"
    url = f"{STRIPE_API_BASE}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
        "User-Agent": "BetulBooking/1.0 Python-urllib",
    }
    body = None
    if method == "POST" and params:
        flat = _flatten_params(params)
        body = urlparse.urlencode(flat).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urlrequest.Request(url, data=body, method=method, headers=headers)
    try:
        with urlrequest.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8")), None
    except urlerror.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode("utf-8"))
            err_msg = err_data.get("error", {}).get("message", str(e))
        except Exception:
            err_msg = str(e)
        logger.error("Stripe HTTP %s: %s", e.code, err_msg[:300])
        return None, f"Stripe error: {err_msg}"
    except urlerror.URLError as e:
        logger.exception("Stripe URLError")
        return None, f"Network error: {e.reason}"
    except Exception as e:
        logger.exception("Stripe request failed")
        return None, str(e)


def _room_capacity(room_type):
    """Returns max number of guests for a room type. Matches frontend logic."""
    t = (room_type or '').lower()
    if 'family' in t or 'aile' in t:
        return 4
    if 'presidential' in t or 'baskanl' in t:
        return 4
    if 'suite' in t or 'suit' in t:
        return 3
    return 2


def calculate_amount(reservation):
    from app.models.service import Service
    svc = Service.query.get(reservation.service_id)
    if not svc or not svc.price:
        return None
    base_price = float(svc.price)
    if reservation.reservation_type == "hotel" or svc.category == "hotel":
        if reservation.check_in_date and reservation.check_out_date:
            nights = (reservation.check_out_date - reservation.check_in_date).days
            if nights < 1:
                nights = 1
            base_total = base_price * nights
            # Extra-guest fee: 25% of room price per extra guest per night
            capacity = _room_capacity(getattr(svc, "room_type", ""))
            guests = (reservation.total_guests
                      or reservation.adult_count
                      or 1)
            extras = max(0, int(guests) - capacity)
            extra_fee_per_night = round(base_price * 0.25)
            extra_total = extras * extra_fee_per_night * nights
            return base_total + extra_total
        return base_price
    return base_price


def create_checkout_session(reservation, customer_email, success_url, cancel_url):
    if not is_configured():
        return None, "Stripe is not configured"
    amount = calculate_amount(reservation)
    if not amount or amount <= 0:
        return None, "Could not determine reservation amount"
    amount_kurus = int(round(amount * 100))
    service_name = "Reservation"
    business_name = ""
    try:
        from app.models.service import Service
        from app.models.business import Business
        svc = Service.query.get(reservation.service_id)
        if svc:
            service_name = svc.name or "Reservation"
            biz = Business.query.get(svc.business_id) if svc.business_id else None
            if biz:
                business_name = biz.name or ""
    except Exception:
        logger.exception("Could not load service/business")
    description = f"{business_name} — {service_name}" if business_name else service_name
    if reservation.check_in_date and reservation.check_out_date:
        description += f" ({reservation.check_in_date.isoformat()} → {reservation.check_out_date.isoformat()})"
    params = {
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "customer_email": customer_email or "",
        "client_reference_id": str(reservation.id),
        "metadata": {"reservation_id": str(reservation.id)},
        "line_items": [{
            "quantity": 1,
            "price_data": {
                "currency": "try",
                "unit_amount": amount_kurus,
                "product_data": {
                    "name": (service_name[:100] if service_name else "Reservation"),
                    "description": (description[:200] if description else ""),
                },
            },
        }],
    }
    data, err = _stripe_request("checkout/sessions", "POST", params)
    if err:
        return None, err
    return {
        "id": data.get("id"),
        "url": data.get("url"),
        "amount": amount,
        "currency": "TRY",
    }, None


def retrieve_session(session_id):
    if not is_configured():
        return None, "Stripe is not configured"
    return _stripe_request(f"checkout/sessions/{session_id}", "GET")


def is_session_paid(session_data):
    if not session_data:
        return False
    return session_data.get("payment_status") == "paid"


def refund_payment(reservation, refund_amount=None):
    """Issue a Stripe refund. Optional partial refund_amount in TRY."""
    if not is_configured():
        return None, "Stripe is not configured"
    if not reservation.stripe_session_id:
        return None, "Reservation was not paid via Stripe"
    session_data, err = retrieve_session(reservation.stripe_session_id)
    if err or not session_data:
        return None, f"Could not retrieve Stripe session: {err}"
    payment_intent = session_data.get("payment_intent")
    if not payment_intent:
        return None, "No payment_intent found on session"
    params = {"payment_intent": payment_intent}
    if refund_amount is not None:
        params["amount"] = int(round(float(refund_amount) * 100))
    data, err = _stripe_request("refunds", "POST", params)
    if err:
        return None, err
    return data, None
