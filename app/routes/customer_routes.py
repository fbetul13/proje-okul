from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.services.service_manager import ServiceManager
from app.services.slot_service import SlotService
from app.services.reservation_service import ReservationService
from app.models.reservation import Reservation
from app.models.review import Review
from app import db
import os
from app.utils.turkey_time import now_tr, today_tr, combine_tr

customer_bp = Blueprint('customer', __name__)


@customer_bp.route('/partner-inquiry', methods=['POST'])
def partner_inquiry():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    business_name = (data.get('business_name') or '').strip()
    category = (data.get('category') or '').strip()
    message = (data.get('message') or '').strip()
    if not name or not email:
        return jsonify({"msg": "Ad soyad ve e-posta zorunludur."}), 400
    if len(message) > 5000:
        return jsonify({"msg": "Mesaj çok uzun."}), 400
    from app.services.mail_service import send_partner_inquiry
    try:
        send_partner_inquiry(name, email, phone, business_name, category, message)
    except Exception as e:
        current_app.logger.exception("partner_inquiry mail")
        return jsonify({"msg": "Talep kaydedilemedi. Lütfen daha sonra tekrar deneyin."}), 500
    return jsonify({"msg": "Talebiniz alındı. Ekibimiz en kısa sürede size dönüş yapacaktır."})


@customer_bp.route('/locations', methods=['GET'])
def get_locations():
    from app.models.location import Il, Ilce
    iller = Il.query.order_by(Il.name).all()
    ilceler = Ilce.query.all()
    return jsonify({
        "iller": [i.to_dict() for i in iller],
        "ilceler": [i.to_dict() for i in ilceler]
    })

@customer_bp.route('/businesses', methods=['GET'])
def list_businesses():
    from app.models.business import Business
    from app.models.service import Service
    from app.models.review import Review
    from sqlalchemy import func
    
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', None)
    il = request.args.get('il', None)
    ilce = request.args.get('ilce', None)
    btype = request.args.get('type', None)
    min_price = request.args.get('min_price', None, type=float)
    max_price = request.args.get('max_price', None, type=float)
    min_rating = request.args.get('min_rating', None, type=float)

    query = Business.query
    if search:
        query = query.filter(Business.name.ilike(f'%{search}%'))
    if il:
        query = query.filter(Business.il == il)
    if ilce:
        query = query.filter(Business.ilce == ilce)
    if btype:
        query = query.filter(Business.type == btype)

    if min_price is not None or max_price is not None:
        subq = db.session.query(Service.business_id).filter(Service.price.isnot(None))
        if min_price is not None:
            subq = subq.filter(Service.price >= min_price)
        if max_price is not None:
            subq = subq.filter(Service.price <= max_price)
        query = query.filter(Business.id.in_(subq))

    businesses = db.paginate(query, page=page, per_page=12, error_out=False)
    
    result = []
    for b in businesses.items:
        biz_dict = b.to_dict()
        
        avg_rating = db.session.query(func.avg(Review.rating)).join(
            Service, Review.service_id == Service.id
        ).filter(Service.business_id == b.id).scalar()
        
        biz_dict['avg_rating'] = round(float(avg_rating), 1) if avg_rating else None
        
        min_svc_price = db.session.query(func.min(Service.price)).filter(
            Service.business_id == b.id,
            Service.price.isnot(None)
        ).scalar()
        biz_dict['min_price'] = float(min_svc_price) if min_svc_price else None
        
        result.append(biz_dict)
    
    if min_rating is not None:
        result = [b for b in result if b['avg_rating'] and b['avg_rating'] >= min_rating]
    
    return jsonify({
        "businesses": result,
        "total": len(result) if min_rating else businesses.total,
        "pages": businesses.pages
    })

@customer_bp.route('/businesses/<int:business_id>', methods=['GET'])
def get_business_detail(business_id):
    from app.models.business import Business
    from app.models.service import Service
    from app.models.review import Review
    from app.models.user import User
    from sqlalchemy import func
    
    business = Business.query.get(business_id)
    if not business:
        return jsonify({"msg": "İşletme bulunamadı"}), 404
    
    services = Service.query.filter_by(business_id=business_id).all()
    result = business.to_dict()
    result['services'] = [s.to_dict() for s in services]
    
    avg_rating = db.session.query(func.avg(Review.rating)).join(
        Service, Review.service_id == Service.id
    ).filter(Service.business_id == business_id).scalar()
    result['avg_rating'] = round(float(avg_rating), 1) if avg_rating else None
    
    review_count = db.session.query(func.count(Review.id)).join(
        Service, Review.service_id == Service.id
    ).filter(Service.business_id == business_id).scalar()
    result['review_count'] = review_count or 0
    
    reviews = db.session.query(Review, User.name, Service.name).join(
        User, Review.user_id == User.id
    ).join(
        Service, Review.service_id == Service.id
    ).filter(Service.business_id == business_id).order_by(Review.created_at.desc()).limit(20).all()
    
    result['reviews'] = [{
        "id": r[0].id,
        "rating": r[0].rating,
        "comment": r[0].comment,
        "created_at": r[0].created_at.isoformat() if r[0].created_at else None,
        "user_name": r[1],
        "service_name": r[2],
        "staff_reply": r[0].staff_reply
    } for r in reviews]
    
    return jsonify(result)

@customer_bp.route('/hotels', methods=['GET'])
def list_hotels():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', None)
    businesses = ServiceManager.get_all_businesses(page=page, search_query=search)
    return jsonify({
        "businesses": [b.to_dict() for b in businesses.items],
        "total": businesses.total,
        "pages": businesses.pages
    })

@customer_bp.route('/hotels/<int:hotel_id>/rooms', methods=['GET'])
def list_hotel_rooms(hotel_id):
    page = request.args.get('page', 1, type=int)
    rooms = ServiceManager.get_all_services(page=page, business_id=hotel_id)
    return jsonify({
        "rooms": [r.to_dict() for r in rooms.items],
        "total": rooms.total,
        "pages": rooms.pages
    })

@customer_bp.route('/services/<int:service_id>', methods=['GET'])
def get_service_detail(service_id):
    from app.models.service import Service
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"msg": "Hizmet bulunamadı"}), 404
    return jsonify(service.to_dict())

@customer_bp.route('/services', methods=['GET'])
def list_services():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', None)
    category = request.args.get('category', None)
    services = ServiceManager.get_all_services(page=page, search_query=search, category=category)
    return jsonify({
        "services": [s.to_dict() for s in services.items],
        "total": services.total,
        "pages": services.pages
    })

@customer_bp.route('/services/<int:service_id>/availability', methods=['GET'])
def get_availability(service_id):
    from app.models.service import Service
    from app.models.timeslot import TimeSlot
    import datetime
    service = Service.query.get(service_id)
    if not service:
        return jsonify({"msg": "Not found"}), 404
        
    if service.category == 'hotel':
        # Return date ranges (değiştirme modunda müşterinin kendi rezervasyonu hariç tutulabilir)
        exclude_id = request.args.get('exclude_reservation_id', type=int)
        q = Reservation.query.filter(
            Reservation.service_id == service_id,
            Reservation.status.in_(['approved', 'pending'])
        )
        if exclude_id is not None:
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"msg": "Bu işlem için giriş yapmalısınız."}), 401
            uid = int(get_jwt_identity())
            ex = Reservation.query.filter_by(id=exclude_id, service_id=service_id).first()
            if not ex or ex.user_id != uid:
                return jsonify({"msg": "Geçersiz rezervasyon"}), 403
            q = q.filter(Reservation.id != exclude_id)
        bookings = q.all()
        return jsonify({
            "type": "hotel",
            "booked_ranges": [{"check_in": b.check_in_date.isoformat(), "check_out": b.check_out_date.isoformat()} for b in bookings]
        })
    else:
        # Return available slots
        date_str = request.args.get('date', None)
        date = None
        if date_str:
            try:
                date = datetime.date.fromisoformat(date_str)
            except ValueError:
                return jsonify({"msg": "Geçersiz tarih formatı. (YYYY-MM-DD)"}), 400

        slots = SlotService.get_available_slots(service_id, date)
        return jsonify({
            "type": "appointment",
            "slots": [s.to_dict() for s in slots]
        })

@customer_bp.route('/reservations', methods=['POST'])
@jwt_required()
def create_reservation():
    user_id = get_jwt_identity()
    data = request.json
    service_id = data.get('service_id')

    reservation, error = ReservationService.create_reservation(user_id, service_id, data)
    if error:
        return jsonify({"msg": error}), 400

    return jsonify({"msg": "Rezervasyon oluşturuldu", "reservation": reservation.to_dict()}), 201

@customer_bp.route('/reservations', methods=['GET'])
@jwt_required()
def my_reservations():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    reservations = ReservationService.get_user_reservations(user_id, page=page)
    return jsonify({
        "reservations": [r.to_dict() for r in reservations.items],
        "total": reservations.total,
        "pages": reservations.pages
    })

@customer_bp.route('/reservations/<int:res_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(res_id):
    from app.models.timeslot import TimeSlot
    from datetime import datetime, timedelta, date as _date
    
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        pass
    
    reservation = Reservation.query.filter_by(id=res_id, user_id=user_id).first()
    
    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı"}), 404
    
    if reservation.status == 'rejected':
        return jsonify({"msg": "Bu rezervasyon zaten iptal edilmiş"}), 400
    
    # Tiered cancellation policy: 3+ days free, 1-2 days 20%, same day 50%
    today = _date.today()
    target_date = None
    if reservation.reservation_type == 'hotel' and reservation.check_in_date:
        target_date = reservation.check_in_date
    elif reservation.slot:
        target_date = reservation.slot.date
    
    penalty_percent = 0
    days_until = None
    if target_date:
        days_until = (target_date - today).days
        if days_until < 0:
            return jsonify({"msg": "Bu rezervasyon iptal edilemez (geçmiş tarih)."}), 400
        elif days_until == 0:
            penalty_percent = 50
        elif days_until <= 2:
            penalty_percent = 20
        else:
            penalty_percent = 0
    
    # Stripe refund if paid
    refund_amount = None
    refund_status = "N/A"
    if getattr(reservation, 'payment_status', None) == 'paid' and reservation.stripe_session_id:
        try:
            from app.services.payment_service import calculate_amount, refund_payment
            paid_amount = calculate_amount(reservation) or 0
            refund_amount = paid_amount * (100 - penalty_percent) / 100.0
            if refund_amount > 0:
                refund_data, refund_err = refund_payment(reservation, refund_amount)
                if refund_err:
                    refund_status = f"FAILED: {refund_err}"
                    import logging
                    logging.error("Stripe refund failed for reservation %s: %s", res_id, refund_err)
                else:
                    refund_status = f"REFUNDED: {refund_amount:.2f} TRY"
        except Exception as e:
            import logging
            logging.exception("Refund attempt failed")
            refund_status = f"ERROR: {str(e)}"
    
    if reservation.slot:
        reservation.slot.is_available = True
    
    reservation.status = 'rejected'
    db.session.commit()
    
    if penalty_percent == 0:
        msg = "Rezervasyon ücretsiz olarak iptal edildi."
    elif penalty_percent == 20:
        msg = f"Rezervasyon iptal edildi. {days_until} gün kala iptal nedeniyle %20 kesinti uygulandı."
    else:
        msg = f"Rezervasyon iptal edildi. Aynı gün iptal nedeniyle %50 kesinti uygulandı."
    
    if refund_amount and refund_status.startswith("REFUNDED"):
        msg += f" İade tutarı: {refund_amount:.2f} TL Stripe üzerinden iade edildi."
    elif refund_status.startswith("FAILED") or refund_status.startswith("ERROR"):
        msg += " (İade işlemi sırasında bir sorun oluştu, lütfen iletişime geçin.)"
    
    return jsonify({
        "msg": msg,
        "penalty_percent": penalty_percent,
        "refund_amount": refund_amount,
        "refund_status": refund_status,
        "days_until": days_until
    }), 200


@customer_bp.route('/reservations/<int:res_id>', methods=['PUT'])
@jwt_required()
def modify_reservation(res_id):
    from app.models.timeslot import TimeSlot
    from datetime import datetime
    
    user_id = get_jwt_identity()
    reservation = Reservation.query.filter_by(id=res_id, user_id=user_id).first()
    
    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı"}), 404
    
    if reservation.status != 'pending':
        return jsonify({"msg": "Sadece bekleyen rezervasyonlar değiştirilebilir"}), 400
    
    data = request.json
    
    if reservation.reservation_type == 'hotel':
        new_check_in = data.get('check_in')
        new_check_out = data.get('check_out')
        
        if new_check_in and new_check_out:
            new_ci = datetime.strptime(new_check_in, '%Y-%m-%d').date()
            new_co = datetime.strptime(new_check_out, '%Y-%m-%d').date()

            if new_co <= new_ci:
                return jsonify({"msg": "Çıkış tarihi giriş tarihinden sonra olmalıdır."}), 400
            if new_ci < today_tr():
                return jsonify({"msg": "Geçmiş tarihe rezervasyon taşınamaz."}), 400

            overlapping = Reservation.query.filter(
                Reservation.id != reservation.id,
                Reservation.service_id == reservation.service_id,
                Reservation.status.in_(['approved', 'pending']),
                db.and_(
                    Reservation.check_in_date < new_co,
                    Reservation.check_out_date > new_ci
                )
            ).first()

            if overlapping:
                return jsonify({"msg": "Seçilen tarihler arasında zaten başka bir rezervasyon bulunmaktadır."}), 400

            reservation.check_in_date = new_ci
            reservation.check_out_date = new_co
    else:
        new_slot_id = data.get('slot_id')
        
        if new_slot_id:
            new_slot = TimeSlot.query.filter_by(
                id=new_slot_id, 
                service_id=reservation.service_id,
                is_available=True
            ).first()
            
            if not new_slot:
                return jsonify({"msg": "Seçilen slot müsait değil"}), 400
            
            if reservation.slot:
                reservation.slot.is_available = True
            
            new_slot.is_available = False
            reservation.time_slot_id = new_slot_id

    if 'note' in data:
        raw = data.get('note')
        if isinstance(raw, str):
            reservation.note = raw.strip() or None
        else:
            reservation.note = None
    
    db.session.commit()
    
    return jsonify({
        "msg": "Rezervasyon güncellendi",
        "reservation": reservation.to_dict()
    }), 200


@customer_bp.route('/reservations/<int:res_id>/review', methods=['POST'])
@jwt_required()
def create_review(res_id):
    user_id = get_jwt_identity()
    reservation = Reservation.query.filter_by(id=res_id, user_id=user_id).first()
    if not reservation:
        return jsonify({"msg": "Rezervasyon bulunamadı"}), 404
    if reservation.status != 'approved':
        return jsonify({"msg": "Yalnızca onaylanmış rezervasyonlara yorum yapılabilir"}), 400
    if reservation.review:
        return jsonify({"msg": "Bu rezervasyona zaten bir yorum yapılmış"}), 400

    data = request.json
    rating = data.get('rating')
    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({"msg": "Puan 1-5 arasında olmalıdır"}), 400

    review = Review(
        reservation_id=res_id,
        user_id=user_id,
        service_id=reservation.service_id,
        rating=int(rating),
        comment=data.get('comment')
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201


@customer_bp.route('/services/<int:service_id>/reviews', methods=['GET'])
def get_service_reviews(service_id):
    reviews = Review.query.filter_by(service_id=service_id).order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews])


@customer_bp.route('/search', methods=['GET'])
def general_search():
    """
    SRS §5.2.b uyumlu arama — AND, OR, NOT mantıksal operatörlerini destekler.
    - `q`:       OR-temelli aranacak terim (name OR description OR il OR ilce)
    - `exclude`: NOT operatörü — bu terimi içeren kayıtları hariç tutar (case-insensitive)
                 Virgülle birden fazla exclude terimi verilebilir: "spa,pahalı"
    - `il`, `ilce`, `min_price`, `max_price`: AND operatörü (hepsi birlikte aranır)
    """
    from app.models.business import Business
    from app.models.service import Service
    from app.models.review import Review
    from sqlalchemy import func, not_

    q = request.args.get('q', '').strip()
    il = request.args.get('il', '').strip()
    ilce = request.args.get('ilce', '').strip()
    exclude_raw = request.args.get('exclude', '').strip()
    min_price = request.args.get('min_price', None, type=float)
    max_price = request.args.get('max_price', None, type=float)

    if not q or len(q) < 2:
        return jsonify({"businesses": [], "services": []})

    search_term = f'%{q}%'

    # NOT (exclude) terimlerini parse et — virgülle ayrılmış, case-insensitive
    exclude_terms = [t.strip() for t in exclude_raw.split(',') if t.strip()] if exclude_raw else []

    # --- İşletme araması ---
    biz_query = Business.query.filter(
        db.or_(
            Business.name.ilike(search_term),
            Business.description.ilike(search_term),
            Business.il.ilike(search_term),
            Business.ilce.ilike(search_term)
        )
    )
    if il:
        biz_query = biz_query.filter(Business.il == il)
    if ilce:
        biz_query = biz_query.filter(Business.ilce == ilce)

    # NOT: her exclude terimi için name/description/il/ilce'de geçmemesi şartı
    for term in exclude_terms:
        excl_pattern = f'%{term}%'
        biz_query = biz_query.filter(
            db.and_(
                not_(Business.name.ilike(excl_pattern)),
                not_(Business.description.ilike(excl_pattern)),
                not_(Business.il.ilike(excl_pattern)),
                not_(Business.ilce.ilike(excl_pattern))
            )
        )

    businesses = biz_query.limit(10).all()

    biz_results = []
    for b in businesses:
        biz_dict = b.to_dict()
        avg_rating = db.session.query(func.avg(Review.rating)).join(
            Service, Review.service_id == Service.id
        ).filter(Service.business_id == b.id).scalar()
        biz_dict['avg_rating'] = round(float(avg_rating), 1) if avg_rating else None
        biz_results.append(biz_dict)

    # --- Hizmet araması ---
    svc_query = Service.query.filter(
        db.or_(
            Service.name.ilike(search_term),
            Service.description.ilike(search_term),
            Service.room_type.ilike(search_term)
        )
    )
    if il or ilce:
        svc_query = svc_query.join(Business).filter(
            (Business.il == il if il else True),
            (Business.ilce == ilce if ilce else True)
        )
    if min_price is not None:
        svc_query = svc_query.filter(Service.price >= min_price)
    if max_price is not None:
        svc_query = svc_query.filter(Service.price <= max_price)

    # NOT: exclude terimlerini hizmet arama sonuçlarından da çıkar
    for term in exclude_terms:
        excl_pattern = f'%{term}%'
        svc_query = svc_query.filter(
            db.and_(
                not_(Service.name.ilike(excl_pattern)),
                not_(Service.description.ilike(excl_pattern)),
                not_(Service.room_type.ilike(excl_pattern))
            )
        )

    services = svc_query.limit(10).all()

    return jsonify({
        "businesses": biz_results,
        "services": [s.to_dict() for s in services]
    })
