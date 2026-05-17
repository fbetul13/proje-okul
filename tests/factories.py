from __future__ import annotations

from dataclasses import dataclass
from datetime import date, time
from typing import Optional

from app import db
from app.models.business import Business
from app.models.reservation import Reservation
from app.models.service import Service
from app.models.timeslot import TimeSlot
from app.models.user import User


@dataclass
class SeedContext:
    business: Business
    owner: User
    staff: User
    customer: User


def create_business(name: str = "Test Business", type_: str = "guzellik") -> Business:
    b = Business(name=name, type=type_)
    db.session.add(b)
    db.session.commit()
    return b


def create_user(
    *,
    name: str,
    email: str,
    password: str,
    role: str,
    business_id: Optional[int] = None,
) -> User:
    u = User(name=name, email=email, role=role, business_id=business_id)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    return u


def create_service(
    *,
    business_id: int,
    name: str = "Test Service",
    category: str = "appointment",
    room_type: Optional[str] = None,
    price: Optional[float] = None,
) -> Service:
    kwargs = {"business_id": business_id, "name": name, "category": category}
    if room_type is not None:
        kwargs["room_type"] = room_type
    if price is not None:
        kwargs["price"] = price
    s = Service(**kwargs)
    db.session.add(s)
    db.session.commit()
    return s


def create_timeslot(
    *,
    service_id: int,
    d: date,
    start: time = time(9, 0),
    end: time = time(9, 59),
    is_available: bool = True,
) -> TimeSlot:
    ts = TimeSlot(service_id=service_id, date=d, start_time=start, end_time=end, is_available=is_available)
    db.session.add(ts)
    db.session.commit()
    return ts


def create_reservation_appointment(
    *,
    user_id: int,
    service_id: int,
    time_slot_id: int,
    status: str = "pending",
) -> Reservation:
    r = Reservation(
        user_id=user_id,
        service_id=service_id,
        reservation_type="appointment",
        time_slot_id=time_slot_id,
        status=status,
    )
    db.session.add(r)
    db.session.commit()
    return r


def create_reservation_hotel(
    *,
    user_id: int,
    service_id: int,
    check_in: date,
    check_out: date,
    status: str = "pending",
) -> Reservation:
    r = Reservation(
        user_id=user_id,
        service_id=service_id,
        reservation_type="hotel",
        check_in_date=check_in,
        check_out_date=check_out,
        status=status,
    )
    db.session.add(r)
    db.session.commit()
    return r

