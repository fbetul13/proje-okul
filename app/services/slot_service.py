from app.models.timeslot import TimeSlot
from app import db
from app.utils.logging_helper import log_action
from app.utils.turkey_time import now_tr
from datetime import date as _date, time as _time
from sqlalchemy import and_, or_

class SlotService:
    @staticmethod
    def create_slot(service_id, date, start_time, end_time, admin_id):
        # Normalize inputs (routes/seed may pass ISO strings)
        if isinstance(date, str):
            date = _date.fromisoformat(date)
        if isinstance(start_time, str):
            start_time = _time.fromisoformat(start_time)
        if isinstance(end_time, str):
            end_time = _time.fromisoformat(end_time)

        slot = TimeSlot(
            service_id=service_id,
            date=date,
            start_time=start_time,
            end_time=end_time,
            is_available=True
        )
        db.session.add(slot)
        db.session.commit()
        log_action(admin_id, f"CREATE_SLOT: Slot created for service {service_id}", slot.id)
        return slot

    @staticmethod
    def get_available_slots(service_id, date=None):
        query = TimeSlot.query.filter_by(service_id=service_id, is_available=True)

        now = now_tr()
        today = now.date()
        now_time = now.time()

        if date:
            query = query.filter_by(date=date)
            # If looking at today, hide past times
            if str(date) == str(today):
                query = query.filter(TimeSlot.start_time > now_time)
        else:
            # No date filter: never return past slots
            query = query.filter(
                or_(
                    TimeSlot.date > today,
                    and_(TimeSlot.date == today, TimeSlot.start_time > now_time)
                )
            )

        return query.order_by(TimeSlot.date.asc(), TimeSlot.start_time.asc()).all()

    @staticmethod
    def delete_slot(slot_id, admin_id):
        slot = TimeSlot.query.get(slot_id)
        if not slot:
            return False
        db.session.delete(slot)
        db.session.commit()
        log_action(admin_id, f"DELETE_SLOT: Slot {slot_id} deleted", slot_id)
        return True
