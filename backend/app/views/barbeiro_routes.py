from flask import Blueprint, request
from backend.app.controllers.barbeiro_controller import BarbeiroController
from backend.app.utils.decorators import token_required, barbeiro_required

barbeiros_bp = Blueprint('barbeiros', __name__, url_prefix='/api/barbeiros')


@barbeiros_bp.route('', methods=['GET'])
@token_required
def listar_barbeiros():
    return BarbeiroController.listar()


@barbeiros_bp.route('/<cpf>', methods=['GET'])
@token_required
def buscar_barbeiro(cpf):
    return BarbeiroController.buscar(cpf)


@barbeiros_bp.route('/me/servicos', methods=['GET'])
@token_required
@barbeiro_required
def meus_servicos():
    return BarbeiroController.meus_servicos(request.user_cpf)