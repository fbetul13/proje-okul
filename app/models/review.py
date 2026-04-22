from app import db
from datetime import datetime


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservations.id'), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    staff_reply = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reservation = db.relationship('Reservation', backref=db.backref('review', uselist=False))
    user = db.relationship('User', backref='reviews')
    service = db.relationship('Service', backref='reviews')

    def to_dict(self):
        return {
            "id": self.id,
            "reservation_id": self.reservation_id,
            "user_id": self.user_id,
            "service_id": self.service_id,
            "rating": self.rating,
            "comment": self.comment,
            "staff_reply": self.staff_reply,
            "created_at": self.created_at.isoformat(),
            "user_name": self.user.name if self.user else None,
            "service_name": self.service.name if self.service else None
        }
