from app import db


class Business(db.Model):
    __tablename__ = 'businesses'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), default='konaklama')  # konaklama, yeme-icme, guzellik, saglik, spor, etkinlik, hizmet, egitim
    image_url = db.Column(db.String(500), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    il = db.Column(db.String(50), nullable=True)
    ilce = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    
    # Google Maps coordinates
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Working hours: {"mon": {"open": "09:00", "close": "18:00"}, "tue": {...}, "sun": null}
    working_hours = db.Column(db.JSON, nullable=True)
    
    # Cancellation policy
    cancellation_hours = db.Column(db.Integer, default=24)
    cancellation_fee_percent = db.Column(db.Integer, default=0)

    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_business_owner'), nullable=True)
    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_businesses')

    services = db.relationship('Service', backref='business', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "image_url": self.image_url,
            "address": self.address,
            "il": self.il,
            "ilce": self.ilce,
            "phone": self.phone,
            "email": self.email,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "working_hours": self.working_hours,
            "cancellation_hours": self.cancellation_hours,
            "cancellation_fee_percent": self.cancellation_fee_percent,
            "owner_id": self.owner_id
        }
