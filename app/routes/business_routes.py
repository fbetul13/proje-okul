from flask import Blueprint, request, jsonify
import os
import uuid
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app.services.slot_service import SlotService
from app.services.reservation_service import ReservationService
from app.services.user_service import UserService
from app.utils.phone_utils import normalize_tr_mobile_phone
from app import db
from app.utils.turkey_time import today_tr
from app.models.business import Business
from app.models.reservation import Reservation
from app.models.user import User
from app.models.service import Service
from app.models.timeslot import TimeSlot
from app.utils.logging_helper import log_action

business_bp = Blueprint('business', __name__)


def _require_business_owner(claims):
    return claims.get('role') == 'business_owner'


def _get_business_id(claims):
    return claims.get('business_id')


@business_bp.route('/me', methods=['GET', 'PUT'])
@jwt_required()
def my_business():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    business = Business.query.get(business_id)
    if not business:
        return jsonify({"msg": "İşletme bulunamadı"}), 404

    if request.method == 'GET':
        return jsonify(business.to_dict())

    if request.method == 'PUT':
        data = request.json
        business.name = data.get('name', business.name)
        business.description = data.get('description', business.description)
        business.type = data.get('type', business.type)
        business.image_url = data.get('image_url', business.image_url)
        business.il = data.get('il', business.il)
        business.ilce = data.get('ilce', business.ilce)
        business.address = data.get('address', business.address)
        business.phone = data.get('phone', business.phone)
        business.email = data.get('email', business.email)
        if 'latitude' in data:
            business.latitude = data['latitude']
        if 'longitude' in data:
            business.longitude = data['longitude']
        if 'working_hours' in data:
            business.working_hours = data['working_hours']
        if 'cancellation_hours' in data:
            business.cancellation_hours = data['cancellation_hours']
        if 'cancellation_fee_percent' in data:
            business.cancellation_fee_percent = data['cancellation_fee_percent']
        db.session.commit()
        log_action(user_id, f"UPDATE_BUSINESS: {business.name}", business.id)
        return jsonify(business.to_dict())


@business_bp.route('/services', methods=['GET', 'POST'])
@jwt_required()
def manage_services():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)

    if request.method == 'GET':
        services = Service.query.filter_by(business_id=business_id).all()
        return jsonify([s.to_dict() for s in services])

    if request.method == 'POST':
        data = request.json
        service = Service(
            name=data.get('name'),
            description=data.get('description'),
            duration=data.get('duration', 60),
            image_url=data.get('image_url'),
            business_id=business_id,
            category=data.get('category', 'hotel'),
            room_number=data.get('room_number'),
            room_type=data.get('room_type'),
            price=data.get('price')
        )
        db.session.add(service)
        db.session.commit()
        log_action(user_id, f"CREATE_SERVICE: {service.name}", service.id)
        return jsonify(service.to_dict()), 201


@business_bp.route('/services/<int:service_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_service(service_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    service = Service.query.get(service_id)

    if not service or service.business_id != business_id:
        return jsonify({"msg": "Servis bulunamadı veya yetkiniz yok"}), 404

    if request.method == 'PUT':
        data = request.json
        service.name = data.get('name', service.name)
        service.description = data.get('description', service.description)
        service.duration = data.get('duration', service.duration)
        service.image_url = data.get('image_url', service.image_url)
        service.category = data.get('category', service.category)
        service.room_number = data.get('room_number', service.room_number)
        service.room_type = data.get('room_type', service.room_type)
        if 'price' in data:
            service.price = data.get('price')
        db.session.commit()
        log_action(user_id, f"UPDATE_SERVICE: {service.name}", service.id)
        return jsonify(service.to_dict())

    if request.method == 'DELETE':
        db.session.delete(service)
        db.session.commit()
        log_action(user_id, f"DELETE_SERVICE: {service.name}", service_id)
        return jsonify({"msg": "Servis silindi"})


@business_bp.route('/services/<int:service_id>/generate-slots', methods=['POST'])
@jwt_required()
def generate_slots(service_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    service = Service.query.get(service_id)

    if not service or service.business_id != business_id:
        return jsonify({"msg": "Servis bulunamadı veya yetkiniz yok"}), 404

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


@business_bp.route('/slots', methods=['GET', 'POST'])
@jwt_required()
def manage_slots():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)

    if request.method == 'GET':
        service_id = request.args.get('service_id', type=int)
        date = request.args.get('date')
        
        query = TimeSlot.query.join(Service).filter(Service.business_id == business_id)
        if service_id:
            query = query.filter(TimeSlot.service_id == service_id)
        if date:
            query = query.filter(TimeSlot.date == date)
        
        slots = query.order_by(TimeSlot.date, TimeSlot.start_time).all()
        return jsonify([s.to_dict() for s in slots])

    if request.method == 'POST':
        data = request.json
        service_id = data.get('service_id')

        service = Service.query.get(service_id)
        if not service or service.business_id != business_id:
            return jsonify({"msg": "Servis bulunamadı veya yetkiniz yok"}), 403

        slot = SlotService.create_slot(
            service_id,
            data.get('date'),
            data.get('start_time'),
            data.get('end_time'),
            user_id
        )
        return jsonify(slot.to_dict()), 201


@business_bp.route('/services/<int:service_id>/availability-summary', methods=['GET'])
@jwt_required()
def get_availability_summary(service_id):
    claims = get_jwt()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    service = Service.query.get(service_id)

    if not service or service.business_id != business_id:
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


@business_bp.route('/slots/<int:slot_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_slot_availability(slot_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    
    slot = TimeSlot.query.join(Service).filter(
        TimeSlot.id == slot_id,
        Service.business_id == business_id
    ).first()

    if not slot:
        return jsonify({"msg": "Slot bulunamadı veya yetkiniz yok"}), 404

    # Rezerve edilmiş slot/gün kapatılamasın (iptal etmeden)
    # - Appointment: time_slot_id üzerinden
    # - Hotel: check-in/check-out aralığı slot.date'i kapsıyorsa
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
    log_action(user_id, f"TOGGLE_SLOT: {slot_id} -> {'available' if slot.is_available else 'blocked'}", slot_id)
    
    return jsonify(slot.to_dict())


@business_bp.route('/reservations', methods=['GET'])
@jwt_required()
def list_reservations():
    claims = get_jwt()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    if not business_id:
        return jsonify({"msg": "Business id missing for this account"}), 400
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


@business_bp.route('/reservations/<int:res_id>/status', methods=['POST'])
@jwt_required()
def update_reservation_status(res_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    reservation = Reservation.query.join(Service).filter(
        Reservation.id == res_id,
        Service.business_id == business_id
    ).first()

    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı veya yetkiniz yok"}), 404

    data = request.json
    reservation, error = ReservationService.update_reservation_status(res_id, data.get('status'), user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(reservation.to_dict())


@business_bp.route('/staff', methods=['GET', 'POST'])
@jwt_required()
def manage_staff():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)

    if request.method == 'GET':
        staff = User.query.filter_by(business_id=business_id, role='staff').all()
        return jsonify([u.to_dict() for u in staff])

    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')

        if not all([name, email, password]):
            return jsonify({"msg": "Tüm alanlar zorunludur"}), 400

        staff, err = UserService.create_staff(name, email, password, business_id, phone=phone)
        if err:
            return jsonify({"msg": err}), 400

        return jsonify(staff.to_dict()), 201


@business_bp.route('/staff/<int:staff_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_single_staff(staff_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    staff = User.query.filter_by(id=staff_id, business_id=business_id, role='staff').first()

    if not staff:
        return jsonify({"msg": "Personel bulunamadı veya yetkiniz yok"}), 404

    if request.method == 'PUT':
        data = request.json
        staff.name = data.get('name', staff.name)
        staff.email = data.get('email', staff.email)
        if data.get('password'):
            staff.set_password(data['password'])
        if 'phone' in data:
            err, normalized = normalize_tr_mobile_phone(data.get('phone'))
            if err:
                return jsonify({"msg": err}), 400
            staff.phone = normalized
        db.session.commit()
        log_action(user_id, f"UPDATE_STAFF: {staff.email}", staff.id)
        return jsonify(staff.to_dict())

    if request.method == 'DELETE':
        db.session.delete(staff)
        db.session.commit()
        log_action(user_id, f"DELETE_STAFF: {staff.email}", staff_id)
        return jsonify({"msg": "Personel silindi"})


@business_bp.route('/stats', methods=['GET'])
@jwt_required()
def business_stats():
    claims = get_jwt()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)

    total = Reservation.query.join(Service).filter(Service.business_id == business_id).count()
    pending = Reservation.query.join(Service).filter(
        Service.business_id == business_id,
        Reservation.status == 'pending'
    ).count()
    approved = Reservation.query.join(Service).filter(
        Service.business_id == business_id,
        Reservation.status == 'approved'
    ).count()
    rejected = Reservation.query.join(Service).filter(
        Service.business_id == business_id,
        Reservation.status == 'rejected'
    ).count()

    total_services = Service.query.filter_by(business_id=business_id).count()
    total_staff = User.query.filter_by(business_id=business_id, role='staff').count()

    return jsonify({
        "total_reservations": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_services": total_services,
        "total_staff": total_staff
    })


@business_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    claims = get_jwt()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"

        upload_dir = os.path.join('app', 'static', 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)

        url = f"/static/uploads/{unique_filename}"
        return jsonify({"url": url}), 200


@business_bp.route('/reservations/manual', methods=['POST'])
@jwt_required()
def create_manual_reservation():
    claims = get_jwt()
    user_id = get_jwt_identity()
    if not _require_business_owner(claims):
        return jsonify({"msg": "Business owner access required"}), 403

    business_id = _get_business_id(claims)
    data = request.json
    
    service_id = data.get('service_id')
    customer_name = data.get('customer_name')
    customer_phone = data.get('customer_phone')
    customer_email = data.get('customer_email')
    
    if not service_id or not customer_name:
        return jsonify({"msg": "Hizmet ve müşteri adı gerekli"}), 400
    
    service = Service.query.filter_by(id=service_id, business_id=business_id).first()
    if not service:
        return jsonify({"msg": "Hizmet bulunamadı"}), 404
    
    walk_in_user = User.query.filter_by(email=f"walkin_{business_id}@system.local").first()
    if not walk_in_user:
        walk_in_user = User(
            name="Walk-in Müşteri",
            email=f"walkin_{business_id}@system.local",
            role="customer"
        )
        walk_in_user.set_password("system_walkin_" + str(business_id))
        db.session.add(walk_in_user)
        db.session.commit()
    
    reservation = Reservation(
        user_id=walk_in_user.id,
        service_id=service_id,
        status='approved',
        note=f"Manuel: {customer_name}" + (f" - {customer_phone}" if customer_phone else "")
    )
    
    if service.category == 'hotel':
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        if not check_in or not check_out:
            return jsonify({"msg": "Giriş ve çıkış tarihi gerekli"}), 400
        reservation.check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        reservation.check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        reservation.reservation_type = 'hotel'
    else:
        slot_id = data.get('slot_id')
        if not slot_id:
            return jsonify({"msg": "Zaman dilimi gerekli"}), 400
        slot = TimeSlot.query.filter_by(id=slot_id, service_id=service_id, is_available=True).first()
        if not slot:
            return jsonify({"msg": "Seçilen slot müsait değil"}), 400
        slot.is_available = False
        reservation.time_slot_id = slot_id
        reservation.reservation_type = 'appointment'
    
    db.session.add(reservation)
    db.session.commit()
    
    log_action(user_id, f"MANUAL_RESERVATION: {customer_name}", reservation.id)
    
    return jsonify({
        "msg": "Manuel rezervasyon oluşturuldu",
        "reservation": reservation.to_dict()
    }), 201
