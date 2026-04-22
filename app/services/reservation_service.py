import datetime
from app.models.reservation import Reservation
from app import db
from app.utils.logging_helper import log_action
from app.utils.turkey_time import now_tr, today_tr, combine_tr
from sqlalchemy import and_, or_

class ReservationService:
    @staticmethod
    def create_reservation(user_id, service_id, data):
        """
        Hybrid booking logic.
        data can contain {check_in, check_out, guests, note} OR {slot_id, note}
        """
        from app.models.service import Service
        from app.models.timeslot import TimeSlot
        
        service = Service.query.get(service_id)
        if not service:
            return None, "Hizmet bulunamadı."

        note = data.get('note')

        if service.category == 'hotel':
            # --- Hotel Flow ---
            check_in_str = data.get('check_in')
            check_out_str = data.get('check_out')
            guests = data.get('guests', {})

            if not check_in_str or not check_out_str:
                return None, "Giriş ve çıkış tarihleri gereklidir."
            
            check_in = datetime.date.fromisoformat(check_in_str)
            check_out = datetime.date.fromisoformat(check_out_str)

            if check_out <= check_in:
                return None, "Çıkış tarihi giriş tarihinden sonra olmalıdır."
            if check_in < today_tr():
                return None, "Geçmiş tarihe rezervasyon yapılamaz."

            overlapping = Reservation.query.filter(
                Reservation.service_id == service_id,
                Reservation.status.in_(['approved', 'pending']),
                and_(
                    Reservation.check_in_date < check_out,
                    Reservation.check_out_date > check_in
                )
            ).with_for_update().first()

            if overlapping:
                return None, "Seçilen tarihler arasında zaten başka bir rezervasyon bulunmaktadır."

            adults = int(guests.get('adults', 1))
            children = int(guests.get('children', 0))
            total_guests = adults + children

            reservation = Reservation(
                user_id=user_id, service_id=service_id, reservation_type='hotel',
                check_in_date=check_in, check_out_date=check_out,
                adult_count=adults, male_count=int(guests.get('male', 0)),
                female_count=int(guests.get('female', 0)), child_count=children,
                total_guests=total_guests, note=note, status='pending'
            )
        else:
            # --- Appointment Flow ---
            slot_id = data.get('time_slot_id')
            if not slot_id:
                return None, "Randevu için saat dilimi seçilmelidir."
            
            slot = TimeSlot.query.filter_by(id=slot_id).with_for_update().first()
            if not slot or not slot.is_available:
                return None, "Seçilen saat dilimi artık müsait değil."

            now = now_tr()
            slot_dt = combine_tr(slot.date, slot.start_time)
            if slot_dt <= now:
                return None, "Seçilen saat dilimi geçmişte kaldı."
            
            reservation = Reservation(
                user_id=user_id, service_id=service_id, reservation_type='appointment',
                time_slot_id=slot_id, status='pending', note=note
            )
            slot.is_available = False

        try:
            db.session.add(reservation)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return None, f"Rezervasyon kaydedilemedi: {str(e)}"
        
        log_action(user_id, f"CREATE_RESERVATION: {service.category} type", reservation.id)
        return reservation, None

    @staticmethod
    def get_user_reservations(user_id, page=1, per_page=20):
        q = Reservation.query.filter_by(user_id=user_id).order_by(Reservation.id.desc())
        return db.paginate(q, page=page, per_page=per_page, error_out=False)

    @staticmethod
    def get_all_reservations(page=1, per_page=20):
        q = Reservation.query.order_by(Reservation.id.desc())
        return db.paginate(q, page=page, per_page=per_page, error_out=False)

    @staticmethod
    def update_reservation_status(res_id, status, admin_id):
        reservation = Reservation.query.get(res_id)
        if not reservation:
            return None, "Rezervasyon bulunamadı."
        
        old_status = reservation.status
        reservation.status = status

        if status == 'rejected' and reservation.reservation_type == 'appointment' and reservation.time_slot_id:
            from app.models.timeslot import TimeSlot
            slot = TimeSlot.query.get(reservation.time_slot_id)
            if slot:
                slot.is_available = True

        db.session.commit()

        # Send email notification asynchronously
        if old_status != status and status in ('approved', 'rejected'):
            try:
                from app.services.mail_service import send_reservation_confirmed, send_reservation_rejected
                user_email = reservation.user.email
                if status == 'approved':
                    send_reservation_confirmed(user_email, reservation)
                else:
                    send_reservation_rejected(user_email, reservation)
            except Exception as e:
                print(f"Mail bildirim hatası: {e}")

        log_action(admin_id, f"UPDATE_STATUS: Reservation {res_id} changed to {status}", res_id)
        return reservation, None

    @staticmethod
    def delete_reservation(res_id, user_id, is_admin=False):
        if is_admin:
            reservation = Reservation.query.get(res_id)
        else:
            reservation = Reservation.query.filter_by(id=res_id, user_id=user_id).first()

        if not reservation:
            return False, "Rezervasyon bulunamadı."
        
        # If it's an appointment, make the slot available again
        if reservation.reservation_type == 'appointment' and reservation.time_slot_id:
            from app.models.timeslot import TimeSlot
            slot = TimeSlot.query.get(reservation.time_slot_id)
            if slot:
                slot.is_available = True

        db.session.delete(reservation)
        db.session.commit()
        
        log_action(user_id, f"DELETE_RESERVATION: Reservation {res_id} deleted", res_id)
        return True, None
