from app import db


class Il(db.Model):
    __tablename__ = 'iller'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    ilceler = db.relationship('Ilce', backref='il', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }


class Ilce(db.Model):
    __tablename__ = 'ilceler'

    id = db.Column(db.Integer, primary_key=True)
    il_id = db.Column(db.Integer, db.ForeignKey('iller.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "il_id": self.il_id,
            "name": self.name
        }
