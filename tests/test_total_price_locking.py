"""
Tests for total_price persistence and price locking logic.
Covers:
  - total_price is computed and stored at reservation creation time
  - calculate_amount prefers the stored total_price over recomputing
  - Breakfast option (+15%) is folded into the total
  - Fallback path works for reservations without stored total_price
"""
from datetime import date, timedelta
from tests.factories import create_business, create_service, create_user
from tests.helpers import api_login, auth_headers


def test_create_reservation_stores_total_price(client, app):
    """When a customer creates a reservation, total_price is saved on the row."""
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        create_user(
            name="Customer", email="price_test@test.com",
            password="pw123456", role="customer"
        )
        svc_id = svc.id

    token, _ = api_login(client, "price_test@test.com", "pw123456")
    check_in = (date.today() + timedelta(days=5)).isoformat()
    check_out = (date.today() + timedelta(days=7)).isoformat()

    response = client.post(
        "/api/customer/reservations",
        json={
            "service_id": svc_id,
            "check_in": check_in,
            "check_out": check_out,
            "guests": {"adults": 2, "children": 0},
        },
        headers=auth_headers(token),
    )
    assert response.status_code in (200, 201)

    # Verify total_price was saved
    with app.app_context():
        from app.models.reservation import Reservation
        res = Reservation.query.order_by(Reservation.id.desc()).first()
        assert res.total_price is not None
        # 1000 * 2 nights = 2000 (no extras, no breakfast)
        assert float(res.total_price) == 2000.0


def test_breakfast_adds_15_percent(client, app):
    """Reservation with breakfast_included=True should be 1.15x base."""
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        create_user(
            name="Customer", email="breakfast_test@test.com",
            password="pw123456", role="customer"
        )
        svc_id = svc.id

    token, _ = api_login(client, "breakfast_test@test.com", "pw123456")
    check_in = (date.today() + timedelta(days=5)).isoformat()
    check_out = (date.today() + timedelta(days=6)).isoformat()

    response = client.post(
        "/api/customer/reservations",
        json={
            "service_id": svc_id,
            "check_in": check_in,
            "check_out": check_out,
            "guests": {"adults": 2, "children": 0},
            "breakfast_included": True,
        },
        headers=auth_headers(token),
    )
    assert response.status_code in (200, 201)

    with app.app_context():
        from app.models.reservation import Reservation
        res = Reservation.query.order_by(Reservation.id.desc()).first()
        # 1000 * 1 night * 1.15 = 1150
        assert float(res.total_price) == 1150.0
        assert res.breakfast_included is True


def test_calculate_amount_prefers_stored_total_price(app):
    """When total_price is set, calculate_amount returns it verbatim."""
    from app.services.payment_service import calculate_amount
    from app.models.reservation import Reservation
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        res = Reservation(
            user_id=1, service_id=svc.id, reservation_type="hotel",
            check_in_date=date.today() + timedelta(days=3),
            check_out_date=date.today() + timedelta(days=5),
            adult_count=2, total_guests=2,
            total_price=9999.99,  # Locked-in price (different from live calc)
        )
        amount = calculate_amount(res)
        assert amount == 9999.99


def test_calculate_amount_falls_back_when_total_price_null(app):
    """When total_price is None, calculate_amount computes from live values."""
    from app.services.payment_service import calculate_amount
    from app.models.reservation import Reservation
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        res = Reservation(
            user_id=1, service_id=svc.id, reservation_type="hotel",
            check_in_date=date.today() + timedelta(days=3),
            check_out_date=date.today() + timedelta(days=4),
            adult_count=2, total_guests=2,
            total_price=None,
        )
        amount = calculate_amount(res)
        # Falls back to live calc: 1000 * 1 night = 1000
        assert amount == 1000.0
