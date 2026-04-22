from app import create_app, db
from app.models.service import Service
import json

app = create_app()
with app.app_context():
    services = Service.query.order_by(Service.id.desc()).limit(10).all()
    data = [s.to_dict() for s in services]
    print(json.dumps(data, indent=2))
