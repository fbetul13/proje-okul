from app import create_app, db
from app.models.service import Service

app = create_app()
with app.app_context():
    count = Service.query.count()
    last_item = Service.query.order_by(Service.id.desc()).first()
    print(f"COUNT: {count}")
    if last_item:
        print(f"LAST ITEM: {last_item.to_dict()}")
