from datetime import date, timedelta

from tests.factories import (
    create_business,
    create_reservation_appointment,
    create_reservation_hotel,
    create_service,
    create_timeslot,
    create_user,
)
from tests.helpers import api_login, auth_headers


def test_staff_schedule_includes_hotel_and_appointment(client, app):
    with app.app_context():
        biz = create_business(type_="konaklama")
        staff = create_user(
            name="Staff",
            email="staff@test.com",
            password="staff123",
            role="staff",
            business_id=biz.id,
        )
        customer = create_user(name="Cust", email="cust2@test.com", password="pw123456", role="customer")

        hotel_svc = create_service(business_id=biz.id, category="hotel", name="Room")
        appt_svc = create_service(business_id=biz.id, category="appointment", name="Appt")

        today = date.today()
        create_reservation_hotel(
            user_id=customer.id,
            service_id=hotel_svc.id,
            check_in=today,
            check_out=today + timedelta(days=1),
            status="pending",
        )

        ts = create_timeslot(service_id=appt_svc.id, d=today + timedelta(days=1))
        create_reservation_appointment(
            user_id=customer.id,
            service_id=appt_svc.id,
            time_slot_id=ts.id,
            status="approved",
        )

    token, _ = api_login(client, "staff@test.com", "staff123")
    res = client.get("/api/staff/schedule?view=weekly", headers=auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert data["view"] == "weekly"
    # Should contain both reservation types
    types = {r["type"] for r in data["reservations"]}
    assert "hotel" in types
    assert "appointment" in types


def test_staff_generate_slots_for_own_business(client, app):
    with app.app_context():
        biz = create_business()
        create_user(
            name="Staff2",
            email="staff2@test.com",
            password="staff123",
            role="staff",
            business_id=biz.id,
        )
        svc = create_service(business_id=biz.id, category="appointment")
        svc_id = svc.id

    token, _ = api_login(client, "staff2@test.com", "staff123")
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=2)
    res = client.post(
        f"/api/staff/services/{svc_id}/generate-slots",
        json={"start_date": start.isoformat(), "end_date": end.isoformat()},
        headers=auth_headers(token),
    )
    assert res.status_code == 201


def test_staff_toggle_slot_rejected_when_reserved(client, app):
    with app.app_context():
        biz = create_business()
        create_user(
            name="Staff3",
            email="staff3@test.com",
            password="staff123",
            role="staff",
            business_id=biz.id,
        )
        customer = create_user(name="Cust3", email="cust3@test.com", password="pw123456", role="customer")
        svc = create_service(business_id=biz.id, category="appointment")
        ts = create_timeslot(service_id=svc.id, d=date.today() + timedelta(days=1), is_available=True)
        create_reservation_appointment(user_id=customer.id, service_id=svc.id, time_slot_id=ts.id, status="pending")
        slot_id = ts.id

    token, _ = api_login(client, "staff3@test.com", "staff123")
    res = client.post(f"/api/staff/slots/{slot_id}/toggle", headers=auth_headers(token))
    assert res.status_code == 400

