from flask import Blueprint, request
from backend.app.controllers.servico_controller import ServicoController
from backend.app.utils.decorators import token_required, barbeiro_required, barbeiro_chefe_required

servicos_bp = Blueprint('servicos', __name__, url_prefix='/api/servicos')


@servicos_bp.route('', methods=['POST'])
@token_required
@barbeiro_required
def criar_servico():
    return ServicoController.criar()


@servicos_bp.route('', methods=['GET'])
@token_required
def listar_servicos():
    return ServicoController.listar()


@servicos_bp.route('/<int:id_servico>', methods=['GET'])
@token_required
def buscar_servico(id_servico):
    return ServicoController.buscar(id_servico)


@servicos_bp.route('/<int:id_servico>', methods=['PUT'])
@token_required
@barbeiro_required
def atualizar_servico(id_servico):
    return ServicoController.atualizar(id_servico)


@servicos_bp.route('/<int:id_servico>', methods=['DELETE'])
@token_required
@barbeiro_chefe_required
def deletar_servico(id_servico):
    return ServicoController.deletar(id_servico)