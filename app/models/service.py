from app import db
from decimal import Decimal


class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration = db.Column(db.Integer, nullable=False, default=60)
    category = db.Column(db.String(20), default='appointment')  # appointment (randevu), hotel (oda/konaklama)
    image_url = db.Column(db.String(500), nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=True)  # Fiyat (TL)

    # Advanced Hotel Management Fields
    room_number = db.Column(db.String(20), nullable=True)
    room_type = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "business_id": self.business_id,
            "name": self.name,
            "description": self.description,
            "duration": self.duration,
            "category": self.category,
            "room_number": self.room_number,
            "room_type": self.room_type,
            "image_url": self.image_url,
            "price": float(self.price) if self.price else None
        }
