from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app.services.user_service import UserService
from app.services.mail_service import send_password_reset
from app.models.user import User
from app import db
from datetime import datetime, timedelta
import secrets
from app.utils.phone_utils import normalize_tr_mobile_phone

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    role = data.get('role', 'customer')

    if role not in ('customer',):
        role = 'customer'

    if not name or not email or not password:
        return jsonify({"msg": "Ad, e-posta ve şifre zorunludur"}), 400

    user, error = UserService.register_user(name, email, password, role, phone=phone)
    if error:
        return jsonify({"msg": error}), 400

    return jsonify({"msg": "User registered successfully", "user": user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = UserService.get_user_by_email(email)
    if not user or not user.check_password(password):
        return jsonify({"msg": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "business_id": user.business_id
        }
    )
    return jsonify(access_token=access_token, user=user.to_dict()), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify(user.to_dict()) if user else (jsonify({"msg": "User not found"}), 404)


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"msg": "E-posta adresi gerekli"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"}), 200
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    
    send_password_reset(user.email, token)
    
    return jsonify({"msg": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"msg": "Token ve yeni şifre gerekli"}), 400
    
    if len(new_password) < 6:
        return jsonify({"msg": "Şifre en az 6 karakter olmalı"}), 400
    
    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify({"msg": "Geçersiz veya süresi dolmuş token"}), 400
    
    if user.reset_token_expiry < datetime.utcnow():
        return jsonify({"msg": "Token süresi dolmuş, lütfen yeniden talep edin"}), 400
    
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    
    return jsonify({"msg": "Şifreniz başarıyla güncellendi"}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"msg": "Kullanıcı bulunamadı"}), 404
    
    data = request.json
    
    if 'name' in data and data['name']:
        user.name = data['name']
    if 'phone' in data:
        err, normalized = normalize_tr_mobile_phone(data.get('phone'))
        if err:
            return jsonify({"msg": err}), 400
        user.phone = normalized
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    db.session.commit()
    return jsonify({"msg": "Profil güncellendi", "user": user.to_dict()}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"msg": "Kullanıcı bulunamadı"}), 404
    
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"msg": "Mevcut ve yeni şifre gerekli"}), 400
    
    if not user.check_password(current_password):
        return jsonify({"msg": "Mevcut şifre yanlış"}), 400
    
    if len(new_password) < 6:
        return jsonify({"msg": "Yeni şifre en az 6 karakter olmalı"}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"msg": "Şifreniz başarıyla değiştirildi"}), 200
