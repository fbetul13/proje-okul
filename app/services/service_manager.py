from app.models.service import Service
from app.models.business import Business
from app import db
from app.utils.logging_helper import log_action

class ServiceManager:
    @staticmethod
    def get_service_by_id(service_id):
        return Service.query.get(service_id)

    @staticmethod
    def create_service(name, description, duration, image_url, admin_id):
        service = Service(name=name, description=description, duration=duration, image_url=image_url)
        db.session.add(service)
        db.session.commit()
        log_action(admin_id, f"CREATE_SERVICE: Service {name} created", service.id)
        return service

    @staticmethod
    def update_service(service_id, name, description, duration, image_url, admin_id):
        service = Service.query.get(service_id)
        if not service:
            return None
        service.name = name
        service.description = description
        service.duration = duration
        service.image_url = image_url
        db.session.commit()
        log_action(admin_id, f"UPDATE_SERVICE: Service {service_id} updated", service_id)
        return service

    @staticmethod
    def delete_service(service_id, admin_id):
        service = Service.query.get(service_id)
        if not service:
            return False
        db.session.delete(service)
        db.session.commit()
        log_action(admin_id, f"DELETE_SERVICE: Service {service_id} deleted", service_id)
        return True

    @staticmethod
    def get_all_services(page=1, per_page=20, search_query=None, business_id=None, category=None):
        query = Service.query
        if business_id:
            query = query.filter_by(business_id=business_id)
        if category:
            query = query.filter_by(category=category)
        if search_query:
            query = query.filter(Service.name.ilike(f"%{search_query}%"))
        return query.order_by(Service.id.desc()).paginate(page=page, per_page=per_page)

    @staticmethod
    def get_all_businesses(page=1, per_page=20, search_query=None):
        query = Business.query
        if search_query:
            query = query.filter(Business.name.ilike(f"%{search_query}%"))
        return query.order_by(Business.id.desc()).paginate(page=page, per_page=per_page)
    
    @staticmethod
    def get_business_by_id(business_id):
        return Business.query.get(business_id)
