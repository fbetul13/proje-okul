from datetime import date, timedelta, time

from tests.factories import (
    create_business,
    create_reservation_appointment,
    create_service,
    create_timeslot,
    create_user,
)
from tests.helpers import api_login, auth_headers


def test_customer_availability_appointment_hides_past_slots(client, app):
    with app.app_context():
        biz = create_business()
        svc = create_service(business_id=biz.id, category="appointment")
        svc_id = svc.id
        # Yesterday slot should be filtered out by SlotService.get_available_slots
        create_timeslot(service_id=svc.id, d=date.today() - timedelta(days=1), start=time(9, 0), end=time(9, 59))
        # Tomorrow slot should be returned
        create_timeslot(service_id=svc.id, d=date.today() + timedelta(days=1), start=time(10, 0), end=time(10, 59))

    res = client.get(f"/api/customer/services/{svc_id}/availability")
    assert res.status_code == 200
    data = res.get_json()
    assert data["type"] == "appointment"
    slots = data["slots"]
    assert all(s["date"] >= (date.today().isoformat()) for s in slots)


def test_customer_create_reservation_appointment_rejects_unavailable_slot(client, app):
    with app.app_context():
        biz = create_business()
        svc = create_service(business_id=biz.id, category="appointment")
        customer = create_user(name="C", email="c@test.com", password="pw123456", role="customer")
        ts = create_timeslot(service_id=svc.id, d=date.today() + timedelta(days=1), is_available=False)
        svc_id = svc.id
        ts_id = ts.id

    token, _ = api_login(client, "c@test.com", "pw123456")
    res = client.post(
        "/api/customer/reservations",
        json={"service_id": svc_id, "time_slot_id": ts_id},
        headers=auth_headers(token),
    )
    assert res.status_code == 400


def test_customer_create_reservation_hotel_invalid_range_400(client, app):
    with app.app_context():
        biz = create_business(type_="konaklama")
        svc = create_service(business_id=biz.id, category="hotel")
        create_user(name="D", email="d@test.com", password="pw123456", role="customer")
        svc_id = svc.id

    token, _ = api_login(client, "d@test.com", "pw123456")
    today = date.today()
    res = client.post(
        "/api/customer/reservations",
        json={"service_id": svc_id, "check_in": today.isoformat(), "check_out": today.isoformat()},
        headers=auth_headers(token),
    )
    assert res.status_code == 400

