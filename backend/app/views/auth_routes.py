from flask import Blueprint, request
from backend.app.controllers.auth_controller import AuthController
from backend.app.utils.decorators import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/registrar/cliente', methods=['POST'])
def registrar_cliente():
    return AuthController.registrar_cliente()


@auth_bp.route('/registrar/barbeiro', methods=['POST'])
def registrar_barbeiro():
    return AuthController.registrar_barbeiro()


@auth_bp.route('/login', methods=['POST'])
def login():
    return AuthController.login()


@auth_bp.route('/cadastrar-e-logar/cliente', methods=['POST'])
def cadastrar_e_logar_cliente():
    return AuthController.registrar_e_logar_cliente()


@auth_bp.route('/cadastrar-e-logar/barbeiro', methods=['POST'])
def cadastrar_e_logar_barbeiro():
    return AuthController.registrar_e_logar_barbeiro()


@auth_bp.route('/alterar-senha', methods=['POST'])
@token_required
def alterar_senha():
    return AuthController.alterar_senha()


@auth_bp.route('/recuperar-senha-email', methods=['POST'])
def recuperar_senha_email():
    return AuthController.solicitar_recuperacao_email()


@auth_bp.route('/redefinir-senha-token', methods=['POST'])
def redefinir_senha_token():
    return AuthController.redefinir_senha_token()