"""
Tests for the tiered cancellation policy added post-ATR.
Covers the penalty calculation logic in customer_routes.cancel_reservation:
  3+ days before  -> 0% penalty
  1-2 days before -> 20% penalty
  same day        -> 50% penalty
  past dates      -> cannot cancel
"""
from datetime import date, timedelta
from tests.factories import create_business, create_service, create_user
from tests.helpers import api_login, auth_headers


def _setup_paid_reservation(app, days_until_checkin):
    """Helper: create a hotel reservation with status=approved and a check-in date."""
    from app.models.reservation import Reservation
    from app import db
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        customer = create_user(
            name="Test Customer", email="cancel_test@test.com",
            password="pw123456", role="customer"
        )
        check_in = date.today() + timedelta(days=days_until_checkin)
        check_out = check_in + timedelta(days=2)
        res = Reservation(
            user_id=customer.id, service_id=svc.id,
            reservation_type="hotel",
            check_in_date=check_in, check_out_date=check_out,
            adult_count=2, total_guests=2, status="approved",
        )
        db.session.add(res)
        db.session.commit()
        return res.id, customer.email


def test_cancellation_3_days_before_is_free(client, app):
    """Cancelling 3+ days before check-in incurs 0% penalty."""
    res_id, email = _setup_paid_reservation(app, days_until_checkin=5)
    token, _ = api_login(client, email, "pw123456")
    response = client.post(
        f"/api/customer/reservations/{res_id}/cancel",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["penalty_percent"] == 0


def test_cancellation_2_days_before_is_20_percent(client, app):
    """Cancelling 1-2 days before check-in incurs 20% penalty."""
    res_id, email = _setup_paid_reservation(app, days_until_checkin=2)
    token, _ = api_login(client, email, "pw123456")
    response = client.post(
        f"/api/customer/reservations/{res_id}/cancel",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["penalty_percent"] == 20


def test_cancellation_1_day_before_is_20_percent(client, app):
    """Cancelling 1 day before check-in incurs 20% penalty."""
    res_id, email = _setup_paid_reservation(app, days_until_checkin=1)
    token, _ = api_login(client, email, "pw123456")
    response = client.post(
        f"/api/customer/reservations/{res_id}/cancel",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["penalty_percent"] == 20


def test_cancellation_same_day_is_50_percent(client, app):
    """Cancelling on check-in day incurs 50% penalty."""
    res_id, email = _setup_paid_reservation(app, days_until_checkin=0)
    token, _ = api_login(client, email, "pw123456")
    response = client.post(
        f"/api/customer/reservations/{res_id}/cancel",
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["penalty_percent"] == 50


def test_cancellation_past_date_rejected(client, app):
    """Cannot cancel a reservation whose check-in is already in the past."""
    res_id, email = _setup_paid_reservation(app, days_until_checkin=-2)
    token, _ = api_login(client, email, "pw123456")
    response = client.post(
        f"/api/customer/reservations/{res_id}/cancel",
        headers=auth_headers(token),
    )
    assert response.status_code == 400
