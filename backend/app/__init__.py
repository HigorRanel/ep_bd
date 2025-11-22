from flask import Flask
from flask_cors import CORS
from backend.app.config import Config
from backend.app.extensions import mail

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    
    
    mail.init_app(app) 

    
    from backend.app.views.routes import register_routes
    register_routes(app)
    
    return app