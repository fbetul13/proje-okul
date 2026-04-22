from datetime import date, timedelta

from tests.factories import (
    create_business,
    create_reservation_appointment,
    create_service,
    create_timeslot,
    create_user,
)
from tests.helpers import api_login, auth_headers


def test_business_generate_slots_creates_days(client, app):
    with app.app_context():
        biz = create_business()
        owner = create_user(
            name="Owner",
            email="owner@test.com",
            password="owner123",
            role="business_owner",
            business_id=biz.id,
        )
        svc = create_service(business_id=biz.id, category="appointment")
        svc_id = svc.id

    token, _ = api_login(client, "owner@test.com", "owner123")
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=1)
    res = client.post(
        f"/api/business/services/{svc_id}/generate-slots",
        json={"start_date": start.isoformat(), "end_date": end.isoformat()},
        headers=auth_headers(token),
    )
    assert res.status_code == 201


def test_business_toggle_slot_rejected_when_reserved(client, app):
    with app.app_context():
        biz = create_business()
        create_user(
            name="Owner",
            email="owner2@test.com",
            password="owner123",
            role="business_owner",
            business_id=biz.id,
        )
        customer = create_user(name="Cust", email="cust@test.com", password="pw123456", role="customer")
        svc = create_service(business_id=biz.id, category="appointment")
        ts = create_timeslot(service_id=svc.id, d=date.today() + timedelta(days=1), is_available=True)
        create_reservation_appointment(user_id=customer.id, service_id=svc.id, time_slot_id=ts.id, status="pending")
        slot_id = ts.id

    token, _ = api_login(client, "owner2@test.com", "owner123")
    res = client.post(f"/api/business/slots/{slot_id}/toggle", headers=auth_headers(token))
    assert res.status_code == 400

