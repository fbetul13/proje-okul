from app import db, bcrypt
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')
    # 'superadmin' | 'business_owner' | 'staff' | 'customer'

    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=True)
    # staff ve business_owner için dolu, customer ve superadmin için None

    # Profile fields
    phone = db.Column(db.String(20), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    # Password reset fields
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    business = db.relationship('Business', foreign_keys=[business_id], backref='staff_members')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "business_id": self.business_id,
            "phone": self.phone,
            "avatar_url": self.avatar_url
        }
