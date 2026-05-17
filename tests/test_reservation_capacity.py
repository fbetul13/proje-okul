"""
Tests for room capacity logic and extra-guest fee calculation.
Covers the post-ATR capacity feature added to payment_service._room_capacity
and the related calculate_amount logic.
"""
from datetime import date, timedelta
from tests.factories import create_business, create_service


def test_capacity_standard_room_is_2(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("Standard") == 2
    assert _room_capacity("standart") == 2


def test_capacity_deluxe_room_is_2(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("Deluxe") == 2
    assert _room_capacity("deluxe room") == 2


def test_capacity_suite_room_is_3(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("Suite") == 3
    assert _room_capacity("Honeymoon Suite") == 3


def test_capacity_family_room_is_4(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("Family") == 4
    assert _room_capacity("Aile Odası") == 4


def test_capacity_presidential_room_is_4(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("Presidential Suite") == 4
    assert _room_capacity("Baskanlik Suite") == 4


def test_capacity_unknown_defaults_to_2(app):
    from app.services.payment_service import _room_capacity
    assert _room_capacity("") == 2
    assert _room_capacity(None) == 2
    assert _room_capacity("Some Other Type") == 2


def test_extra_guest_fee_applied_when_over_capacity(app):
    """Standard room (cap 2), 4 guests, 2 nights -> base + extras."""
    from app.services.payment_service import calculate_amount
    from app.models.reservation import Reservation
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=2)
        res = Reservation(
            user_id=1, service_id=svc.id, reservation_type="hotel",
            check_in_date=check_in, check_out_date=check_out,
            adult_count=3, child_count=1, total_guests=4,
        )
        # Expected: base 1000*2 + extras (4-2=2) * (1000*0.25=250) * 2 = 2000 + 1000 = 3000
        amount = calculate_amount(res)
        assert amount == 3000.0, f"Expected 3000.0, got {amount}"


def test_no_extra_fee_when_at_or_below_capacity(app):
    """Standard room (cap 2), 2 guests, 1 night -> just base."""
    from app.services.payment_service import calculate_amount
    from app.models.reservation import Reservation
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Standard", price=1000.0
        )
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=1)
        res = Reservation(
            user_id=1, service_id=svc.id, reservation_type="hotel",
            check_in_date=check_in, check_out_date=check_out,
            adult_count=2, child_count=0, total_guests=2,
        )
        amount = calculate_amount(res)
        assert amount == 1000.0, f"Expected 1000.0, got {amount}"


def test_family_room_holds_4_guests_no_extra(app):
    """Family room (cap 4), 4 guests, 1 night -> no extras."""
    from app.services.payment_service import calculate_amount
    from app.models.reservation import Reservation
    
    with app.app_context():
        biz = create_business()
        svc = create_service(
            business_id=biz.id, category="hotel",
            room_type="Family", price=1500.0
        )
        check_in = date.today() + timedelta(days=5)
        check_out = check_in + timedelta(days=1)
        res = Reservation(
            user_id=1, service_id=svc.id, reservation_type="hotel",
            check_in_date=check_in, check_out_date=check_out,
            adult_count=2, child_count=2, total_guests=4,
        )
        amount = calculate_amount(res)
        assert amount == 1500.0, f"Family room with 4 guests should be base only, got {amount}"
