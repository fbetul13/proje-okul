from flask import Blueprint, request, jsonify
import os
import uuid
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app.services.service_manager import ServiceManager
from app.services.log_service import LogService
from app.services.user_service import UserService
from app import db
from app.models.business import Business
from app.models.reservation import Reservation
from app.models.user import User
from app.models.service import Service

superadmin_bp = Blueprint('superadmin', __name__)


def _require_superadmin(claims):
    return claims.get('role') == 'superadmin'


@superadmin_bp.route('/businesses', methods=['GET', 'POST'])
@jwt_required()
def manage_businesses():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    if request.method == 'GET':
        page = request.args.get('page', 1, type=int)
        search = request.args.get('search', None)
        businesses = ServiceManager.get_all_businesses(page=page, search_query=search)
        return jsonify({
            "businesses": [b.to_dict() for b in businesses.items],
            "total": businesses.total,
            "pages": businesses.pages
        })

    if request.method == 'POST':
        data = request.json
        business = Business(
            name=data.get('name'),
            description=data.get('description'),
            type=data.get('type', 'hotel'),
            image_url=data.get('image_url'),
            il=data.get('il'),
            ilce=data.get('ilce'),
            address=data.get('address')
        )
        db.session.add(business)
        db.session.commit()

        owner_email = data.get('owner_email')
        owner_name = data.get('owner_name')
        owner_password = data.get('owner_password')
        owner_phone = data.get('owner_phone')
        if owner_email and owner_name and owner_password:
            owner, err = UserService.create_business_owner(
                owner_name, owner_email, owner_password, business.id, phone=owner_phone
            )
            if owner:
                business.owner_id = owner.id
                db.session.commit()

        return jsonify(business.to_dict()), 201


@superadmin_bp.route('/businesses/<int:business_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_delete_business(business_id):
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    business = Business.query.get(business_id)
    if not business:
        return jsonify({"msg": "İşletme bulunamadı"}), 404

    if request.method == 'PUT':
        data = request.json
        business.name = data.get('name', business.name)
        business.description = data.get('description', business.description)
        business.type = data.get('type', business.type)
        business.image_url = data.get('image_url', business.image_url)
        business.il = data.get('il', business.il)
        business.ilce = data.get('ilce', business.ilce)
        business.address = data.get('address', business.address)
        db.session.commit()
        return jsonify(business.to_dict())

    if request.method == 'DELETE':
        db.session.delete(business)
        db.session.commit()
        return jsonify({"msg": "İşletme silindi"})


@superadmin_bp.route('/business-owners', methods=['POST'])
@jwt_required()
def create_business_owner():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    data = request.json
    business_id = data.get('business_id')
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')

    if not all([business_id, name, email, password]):
        return jsonify({"msg": "Tüm alanlar zorunludur"}), 400

    business = Business.query.get(business_id)
    if not business:
        return jsonify({"msg": "İşletme bulunamadı"}), 404

    owner, err = UserService.create_business_owner(name, email, password, business_id, phone=phone)
    if err:
        return jsonify({"msg": err}), 400

    business.owner_id = owner.id
    db.session.commit()

    return jsonify(owner.to_dict()), 201


@superadmin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', None)
    users = UserService.get_all_users(page=page, search_query=search)
    return jsonify({
        "users": [u.to_dict() for u in users.items],
        "total": users.total,
        "pages": users.pages
    })


@superadmin_bp.route('/users/<int:user_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_user(user_id):
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Kullanıcı bulunamadı"}), 404

    if request.method == 'PUT':
        data = request.json
        user.name = data.get('name', user.name)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        user.business_id = data.get('business_id', user.business_id)
        if data.get('password'):
            user.set_password(data['password'])
        db.session.commit()
        return jsonify(user.to_dict())

    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({"msg": "Kullanıcı silindi"})


@superadmin_bp.route('/logs', methods=['GET'])
@jwt_required()
def view_logs():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', None)
    logs = LogService.advanced_search(search, page=page)

    return jsonify({
        "logs": [l.to_dict() for l in logs.items],
        "total": logs.total,
        "pages": logs.pages
    })


@superadmin_bp.route('/stats/overview', methods=['GET'])
@jwt_required()
def stats_overview():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    total = Reservation.query.count()
    pending = Reservation.query.filter_by(status='pending').count()
    approved = Reservation.query.filter_by(status='approved').count()
    rejected = Reservation.query.filter_by(status='rejected').count()
    total_users = User.query.count()
    total_services = Service.query.count()
    total_businesses = Business.query.count()

    return jsonify({
        "total_reservations": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_users": total_users,
        "total_services": total_services,
        "total_businesses": total_businesses
    })


@superadmin_bp.route('/stats/monthly', methods=['GET'])
@jwt_required()
def stats_monthly():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    results = []
    today = datetime.utcnow().date()
    for i in range(5, -1, -1):
        first_day = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        if first_day.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1)

        count = Reservation.query.filter(
            func.date(Reservation.check_in_date) >= first_day,
            func.date(Reservation.check_in_date) < last_day
        ).count()
        results.append({
            "month": first_day.strftime("%Y-%m"),
            "count": count
        })

    return jsonify(results)


@superadmin_bp.route('/stats/by-category', methods=['GET'])
@jwt_required()
def stats_by_category():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    rows = db.session.query(
        Reservation.reservation_type,
        func.count(Reservation.id)
    ).group_by(Reservation.reservation_type).all()

    return jsonify([{"category": r[0], "count": r[1]} for r in rows])


@superadmin_bp.route('/stats/top-services', methods=['GET'])
@jwt_required()
def stats_top_services():
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    rows = db.session.query(
        Service.id,
        Service.name,
        func.count(Reservation.id).label('reservation_count')
    ).join(Reservation, Reservation.service_id == Service.id)\
     .group_by(Service.id, Service.name)\
     .order_by(func.count(Reservation.id).desc())\
     .limit(5).all()

    return jsonify([
        {"service_id": r[0], "service_name": r[1], "reservation_count": r[2]}
        for r in rows
    ])


@superadmin_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    claims = get_jwt()
    if not _require_superadmin(claims):
        return jsonify({"msg": "SuperAdmin access required"}), 403

    from app.models.review import Review
    review = Review.query.get(review_id)
    if not review:
        return jsonify({"msg": "Yorum bulunamadı"}), 404

    db.session.delete(review)
    db.session.commit()
    return jsonify({"msg": "Yorum silindi"})
