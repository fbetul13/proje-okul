from app import db

class Reservation(db.Model):
    __tablename__ = 'reservations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    
    # Hotel Fields (Nullable)
    check_in_date = db.Column(db.Date, nullable=True)
    check_out_date = db.Column(db.Date, nullable=True)
    adult_count = db.Column(db.Integer, default=1)
    male_count = db.Column(db.Integer, default=0)
    female_count = db.Column(db.Integer, default=0)
    child_count = db.Column(db.Integer, default=0)
    total_guests = db.Column(db.Integer, default=1)
    
    # Appointment Fields (Nullable)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('time_slots.id'), nullable=True)
    
    reservation_type = db.Column(db.String(20), default='hotel') # 'hotel' or 'appointment'
    status = db.Column(db.String(20), default='pending') # 'pending', 'approved', 'rejected'
    note = db.Column(db.Text, nullable=True)
    payment_status = db.Column(db.String(20), default='unpaid')  # 'unpaid', 'paid', 'failed'
    stripe_session_id = db.Column(db.String(255), nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    total_price = db.Column(db.Numeric(10, 2), nullable=True)
    breakfast_included = db.Column(db.Boolean, default=False, nullable=True)
    user = db.relationship('User', backref='reservations')
    service = db.relationship('Service', backref='reservations')
    slot = db.relationship('TimeSlot', backref='reservations')

    def to_dict(self):
        svc = self.service
        usr = self.user
        biz = getattr(svc, "business", None) if svc else None
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "service_id": self.service_id,
            "check_in": self.check_in_date.isoformat() if self.check_in_date else None,
            "check_out": self.check_out_date.isoformat() if self.check_out_date else None,
            "time_slot_id": self.time_slot_id,
            "type": self.reservation_type,
            "adults": self.adult_count,
            "children": self.child_count,
            "total_guests": self.total_guests,
            "total_price": float(self.total_price) if self.total_price else None,
            "total_price": float(self.total_price) if self.total_price else None,
            "status": self.status,
            "note": self.note,
            "payment_status": getattr(self, "payment_status", "unpaid"),
            "paid_at": self.paid_at.isoformat() if getattr(self, "paid_at", None) else None,
            "user_name": usr.name if usr else None,
            "user_email": usr.email if usr else None,
            "user_phone": usr.phone if usr else None,
            "service_name": svc.name if svc else None,
            "service_image_url": svc.image_url if svc else None,
            "business_image_url": biz.image_url if biz else None,
            "business_id": biz.id if biz else None,
            "business_name": biz.name if biz else None,
            "business_address": biz.address if biz else None,
            "business_il": biz.il if biz else None,
            "business_ilce": biz.ilce if biz else None,
        }
        if self.slot:
            data["slot_date"] = self.slot.date.isoformat()
            data["slot_time"] = self.slot.start_time.strftime("%H:%M")
        return data
