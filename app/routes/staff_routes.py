from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.reservation import Reservation
from app.models.review import Review
from app.models.service import Service
from app.models.timeslot import TimeSlot
from app.utils.logging_helper import log_action
from app.services.reservation_service import ReservationService
from app.services.slot_service import SlotService
from app import db
from app.utils.turkey_time import today_tr

staff_bp = Blueprint('staff', __name__)


def _require_staff(claims):
    return claims.get('role') == 'staff'


def _get_business_id(claims):
    return claims.get('business_id')


@staff_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_schedule():
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    view = request.args.get('view', 'daily')

    from datetime import timedelta
    today = today_tr()

    if view == 'weekly':
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=7)
    else:
        start = today
        end = today + timedelta(days=1)

    from app.models.timeslot import TimeSlot
    from sqlalchemy import and_

    # Appointment reservations (timeslot-based)
    appt_reservations = Reservation.query.join(
        TimeSlot, Reservation.time_slot_id == TimeSlot.id
    ).join(
        Service, Reservation.service_id == Service.id
    ).filter(
        Service.business_id == business_id,
        Reservation.status.in_(['pending', 'approved']),
        and_(
            TimeSlot.date >= start,
            TimeSlot.date < end
        )
    ).order_by(TimeSlot.date, TimeSlot.start_time).all()

    # Hotel reservations (date-range based) that overlap the requested window
    hotel_reservations = Reservation.query.join(
        Service, Reservation.service_id == Service.id
    ).filter(
        Service.business_id == business_id,
        Reservation.status.in_(['pending', 'approved']),
        Reservation.check_in_date.isnot(None),
        Reservation.check_out_date.isnot(None),
        Reservation.check_in_date < end,
        Reservation.check_out_date > start
    ).order_by(Reservation.check_in_date.asc(), Reservation.id.asc()).all()

    # Merge and de-dup (in case of any edge overlaps)
    by_id = {r.id: r for r in (appt_reservations + hotel_reservations)}
    reservations = list(by_id.values())
    reservations.sort(key=lambda r: (
        (r.slot.date if r.slot else r.check_in_date) or start,
        (r.slot.start_time.strftime("%H:%M") if r.slot else ""),
        r.id
    ))

    return jsonify({
        "view": view,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "reservations": [r.to_dict() for r in reservations]
    })


@staff_bp.route('/reservations', methods=['GET'])
@jwt_required()
def staff_reservations():
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    page = request.args.get('page', 1, type=int)
    status = request.args.get('status', None)

    query = Reservation.query.join(Service).filter(Service.business_id == business_id)
    if status:
        query = query.filter(Reservation.status == status)

    reservations = db.paginate(
        query.order_by(Reservation.id.desc()),
        page=page,
        per_page=20,
        error_out=False
    )
    return jsonify({
        "reservations": [r.to_dict() for r in reservations.items],
        "total": reservations.total,
        "pages": reservations.pages
    })


@staff_bp.route('/reservations/<int:res_id>', methods=['GET'])
@jwt_required()
def staff_reservation_detail(res_id):
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    reservation = Reservation.query.join(Service).filter(
        Reservation.id == res_id,
        Service.business_id == business_id
    ).first()

    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı veya yetkiniz yok"}), 404
    return jsonify(reservation.to_dict())


@staff_bp.route('/reservations/<int:res_id>/status', methods=['POST'])
@jwt_required()
def staff_update_reservation_status(res_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    reservation = Reservation.query.join(Service).filter(
        Reservation.id == res_id,
        Service.business_id == business_id
    ).first()
    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı veya yetkiniz yok"}), 404

    data = request.json or {}
    status = data.get('status')
    reservation, error = ReservationService.update_reservation_status(res_id, status, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(reservation.to_dict())


@staff_bp.route('/reviews/<int:review_id>/reply', methods=['PUT'])
@jwt_required()
def reply_review(review_id):
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    review = Review.query.join(Service).filter(
        Review.id == review_id,
        Service.business_id == business_id
    ).first()

    if not review:
        return jsonify({"msg": "Yorum bulunamadı veya yetkiniz yok"}), 404

    data = request.json
    reply = data.get('reply', '').strip()
    if not reply:
        return jsonify({"msg": "Yanıt boş olamaz"}), 400

    review.staff_reply = reply
    db.session.commit()
    return jsonify(review.to_dict())


@staff_bp.route('/slots', methods=['GET'])
@jwt_required()
def list_slots():
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    service_id = request.args.get('service_id', type=int)
    date = request.args.get('date')

    query = TimeSlot.query.join(Service).filter(Service.business_id == business_id)
    if service_id:
        query = query.filter(TimeSlot.service_id == service_id)
    if date:
        query = query.filter(TimeSlot.date == date)

    slots = query.order_by(TimeSlot.date, TimeSlot.start_time).all()
    return jsonify([s.to_dict() for s in slots])


@staff_bp.route('/slots/<int:slot_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_slot(slot_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    slot = TimeSlot.query.join(Service).filter(
        TimeSlot.id == slot_id,
        Service.business_id == business_id
    ).first()

    if not slot:
        return jsonify({"msg": "Slot bulunamadı veya yetkiniz yok"}), 404

    # Rezerve edilmiş slot/gün kapatılamasın (iptal etmeden)
    if slot.is_available:
        svc = slot.service
        if svc and svc.category == 'appointment':
            has_res = Reservation.query.filter(
                Reservation.time_slot_id == slot.id,
                Reservation.status.in_(['pending', 'approved'])
            ).first()
            if has_res:
                return jsonify({"msg": "Bu slot zaten rezerve. İptal etmeden kapatamazsınız."}), 400
        elif svc and svc.category == 'hotel':
            has_res = Reservation.query.filter(
                Reservation.service_id == slot.service_id,
                Reservation.status.in_(['pending', 'approved']),
                Reservation.check_in_date <= slot.date,
                Reservation.check_out_date > slot.date
            ).first()
            if has_res:
                return jsonify({"msg": "Bu tarih zaten rezerve. Rezervasyonu iptal etmeden kapatamazsınız."}), 400

    slot.is_available = not slot.is_available
    db.session.commit()
    log_action(user_id, f"STAFF_TOGGLE_SLOT: {slot_id} -> {'available' if slot.is_available else 'blocked'}", slot_id)

    return jsonify(slot.to_dict())


@staff_bp.route('/services', methods=['GET'])
@jwt_required()
def list_services():
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    services = Service.query.filter_by(business_id=business_id).all()
    return jsonify([s.to_dict() for s in services])


@staff_bp.route('/services/<int:service_id>/availability-summary', methods=['GET'])
@jwt_required()
def get_availability_summary(service_id):
    claims = get_jwt()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    service = Service.query.filter_by(id=service_id, business_id=business_id).first()
    if not service:
        return jsonify({"msg": "Servis bulunamadı veya yetkiniz yok"}), 404

    from sqlalchemy import func
    
    result = db.session.query(
        func.min(TimeSlot.date).label('min_date'),
        func.max(TimeSlot.date).label('max_date'),
        func.count(TimeSlot.id).label('total_slots'),
        func.sum(db.case((TimeSlot.is_available == True, 1), else_=0)).label('available_slots')
    ).filter(TimeSlot.service_id == service_id).first()
    
    return jsonify({
        "service_id": service_id,
        "service_name": service.name,
        "min_date": result.min_date.isoformat() if result.min_date else None,
        "max_date": result.max_date.isoformat() if result.max_date else None,
        "total_slots": result.total_slots or 0,
        "available_slots": result.available_slots or 0
    })


@staff_bp.route('/services/<int:service_id>/generate-slots', methods=['POST'])
@jwt_required()
def staff_generate_slots(service_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_staff(claims):
        return jsonify({"msg": "Staff access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business atanmamış"}), 403

    service = Service.query.get(service_id)
    if not service or service.business_id != business_id:
        return jsonify({"msg": "Servis bulunamadı veya yetkiniz yok"}), 404

    from datetime import datetime, timedelta
    data = request.json or {}
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    else:
        days = data.get('days', 30 if service.category == 'hotel' else 7)
        start_date = today_tr()
        end_date = start_date + timedelta(days=days - 1)

    if end_date < start_date:
        return jsonify({"msg": "Bitiş tarihi başlangıçtan önce olamaz"}), 400

    created_count = 0
    current_date = start_date
    while current_date <= end_date:
        existing = TimeSlot.query.filter_by(service_id=service_id, date=current_date).first()
        if not existing:
            if service.category == 'hotel':
                SlotService.create_slot(
                    service_id,
                    current_date.isoformat(),
                    "00:00",
                    "23:59",
                    user_id
                )
                created_count += 1
            else:
                for hour in range(9, 17):
                    SlotService.create_slot(
                        service_id,
                        current_date.isoformat(),
                        f"{hour:02}:00",
                        f"{hour:02}:59",
                        user_id
                    )
                created_count += 1
        current_date += timedelta(days=1)

    total_days = (end_date - start_date).days + 1
    msg = f"{start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')} tarihleri arası ({created_count} yeni gün) rezervasyona açıldı"
    return jsonify({"msg": msg, "created": created_count, "total_days": total_days}), 201
