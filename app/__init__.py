import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
from app.utils.db_schema import ensure_user_profile_columns

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()
mail = Mail()

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    
    # Load Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

    # Mail Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    CORS(app)

    # JWT Extra Config
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"msg": f"Invalid token: {error}"}, 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"msg": "No token provided"}, 401

    # API is consumed by frontend JS; ensure JSON on failures (including unhandled exceptions)
    @app.errorhandler(Exception)
    def handle_any_exception(err):
        try:
            from flask import request, jsonify
            from werkzeug.exceptions import HTTPException
            if request.path.startswith('/api/'):
                if isinstance(err, HTTPException):
                    return jsonify({"msg": err.description}), err.code
                return jsonify({"msg": "Internal server error"}), 500
        except Exception:
            pass
        # Non-API: fallback to simple 500 without leaking details
        return "Internal Server Error", 500

    with app.app_context():
        # Import models
        from .models.user import User
        from .models.business import Business
        from .models.service import Service
        from .models.timeslot import TimeSlot
        from .models.reservation import Reservation
        from .models.log import Log
        from .models.review import Review
        from .models.location import Il, Ilce

        # Register Blueprints
        from .routes.auth_routes import auth_bp
        from .routes.customer_routes import customer_bp
        from .routes.superadmin_routes import superadmin_bp
        from .routes.business_routes import business_bp
        from .routes.staff_routes import staff_bp

        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(customer_bp, url_prefix='/api/customer')
        app.register_blueprint(superadmin_bp, url_prefix='/api/superadmin')
        app.register_blueprint(business_bp, url_prefix='/api/business')
        app.register_blueprint(staff_bp, url_prefix='/api/staff')

        @app.route('/')
        def index():
            return app.send_static_file('index.html')

        @app.route('/favicon.ico')
        def favicon():
            return app.send_static_file('favicon.ico')

        # Create tables if not exist
        import time
        for attempt in range(10):
            try:
                db.create_all()
                ensure_user_profile_columns(db.engine)
                print("Tables ready.")
                break
            except Exception as e:
                print(f"DB not ready (attempt {attempt + 1}/10): {e}")
                time.sleep(3)

    return app
