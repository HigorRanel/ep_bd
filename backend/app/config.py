import os
from dotenv import load_dotenv, find_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if not os.path.exists(dotenv_path):
    dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_NAME = os.getenv('DB_NAME', 'barbearia')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_PORT = os.getenv('DB_PORT', '5432')
    JWT_EXPIRATION_HOURS = 24

    # Configurações de Email
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    # Coloque suas credenciais reais aqui ou use variáveis de ambiente
    MAIL_USERNAME = 'epbd222@gmail.com'
    MAIL_PASSWORD = 'uwiu apmk xrmj cbxj'
    MAIL_DEFAULT_SENDER = 'epbd222@gmail.com'