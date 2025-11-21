from flask import Flask
from flask_cors import CORS
from backend.app.config import Config
from backend.app.extensions import mail # <--- Importa do novo arquivo

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    
    # Inicializa o mail com a aplicação
    mail.init_app(app) 

    # As rotas devem ser importadas DENTRO da função para evitar ciclos
    from backend.app.views.routes import register_routes
    register_routes(app)
    
    return app