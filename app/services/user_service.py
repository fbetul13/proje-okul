from app.models.user import User
from app import db
from app.utils.logging_helper import log_action
from app.utils.phone_utils import normalize_tr_mobile_phone


class UserService:
    @staticmethod
    def _apply_phone(user, phone_raw, required=False):
        err, normalized = normalize_tr_mobile_phone(phone_raw)
        if err:
            return err
        if required and not normalized:
            return "Cep telefonu gereklidir"
        if normalized:
            user.phone = normalized
        return None

    @staticmethod
    def register_user(name, email, password, role='customer', phone=None):
        if User.query.filter_by(email=email).first():
            return None, "Bu e-posta adresi zaten kayıtlı"

        user = User(name=name, email=email, role=role)
        user.set_password(password)
        perr = UserService._apply_phone(user, phone, required=True)
        if perr:
            return None, perr
        db.session.add(user)
        db.session.commit()

        log_action(user.id, f"REGISTER: User {user.email} registered as {role}", user.id)
        return user, None

    @staticmethod
    def create_staff(name, email, password, business_id, phone=None):
        if User.query.filter_by(email=email).first():
            return None, "Bu e-posta adresi zaten kayıtlı"

        user = User(name=name, email=email, role='staff', business_id=business_id)
        user.set_password(password)
        perr = UserService._apply_phone(user, phone, required=True)
        if perr:
            return None, perr
        db.session.add(user)
        db.session.commit()

        log_action(user.id, f"STAFF_CREATED: {user.email} for business_id={business_id}", user.id)
        return user, None

    @staticmethod
    def create_business_owner(name, email, password, business_id, phone=None):
        if User.query.filter_by(email=email).first():
            return None, "Bu e-posta adresi zaten kayıtlı"

        user = User(name=name, email=email, role='business_owner', business_id=business_id)
        user.set_password(password)
        perr = UserService._apply_phone(user, phone, required=True)
        if perr:
            return None, perr
        db.session.add(user)
        db.session.commit()

        log_action(user.id, f"BUSINESS_OWNER_CREATED: {user.email} for business_id={business_id}", user.id)
        return user, None

    @staticmethod
    def get_user_by_email(email):
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_all_users(page=1, per_page=20, search_query=None):
        q = User.query
        if search_query:
            sq = f"%{search_query}%"
            q = q.filter(db.or_(
                User.name.ilike(sq),
                User.email.ilike(sq)
            ))
        return q.order_by(User.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
