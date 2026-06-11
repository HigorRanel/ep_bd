from flask import Blueprint, request
from backend.app.controllers.cliente_controller import ClienteController
from backend.app.controllers.cliente_stats_controller import ClienteStatsController
from backend.app.controllers.agendamento_controller import AgendamentoController
from backend.app.utils.decorators import token_required, barbeiro_required

clientes_bp = Blueprint('clientes', __name__, url_prefix='/api/clientes')


@clientes_bp.route('', methods=['GET'])
@token_required
@barbeiro_required
def listar_clientes():
    return ClienteController.listar()


@clientes_bp.route('/estatisticas', methods=['GET'])
@token_required
@barbeiro_required
def listar_clientes_stats():
    return ClienteStatsController.listar_com_estatisticas()


@clientes_bp.route('/<cpf>/detalhes', methods=['GET'])
@token_required
@barbeiro_required
def detalhes_cliente(cpf):
    return ClienteStatsController.detalhes_cliente(cpf)


@clientes_bp.route('/<cpf>', methods=['GET'])
@token_required
def buscar_cliente(cpf):
    return ClienteController.buscar(cpf)


@clientes_bp.route('/me', methods=['GET'])
@token_required
def meus_dados_cliente():
    return ClienteController.meus_dados(request.user_cpf)


@clientes_bp.route('/me', methods=['PUT'])
@token_required
def atualizar_cliente():
    return ClienteController.atualizar(request.user_cpf)


@clientes_bp.route('/me/agendamentos', methods=['GET'])
@token_required
def meus_agendamentos():
    return ClienteController.meus_agendamentos(request.user_cpf)


@clientes_bp.route('/me/agendamentos-otimizado', methods=['GET'])
@token_required
def meus_agendamentos_otimizado():
    return AgendamentoController.listar_agendamentos_cliente_otimizado(request.user_cpf)