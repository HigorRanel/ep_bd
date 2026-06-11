from flask import Blueprint, request
from backend.app.controllers.reserva_controller import ReservaController
from backend.app.controllers.produto_controller import ProdutoController
from backend.app.utils.decorators import token_required, barbeiro_required

reservas_bp = Blueprint('reservas', __name__, url_prefix='/api/reservas')


@reservas_bp.route('/todas', methods=['GET'])
@token_required
@barbeiro_required
def listar_todas_reservas():
    """Barbeiro lista todas as reservas"""
    return ReservaController.listar_todas()


@reservas_bp.route('/status/<status>', methods=['GET'])
@token_required
@barbeiro_required
def listar_reservas_por_status(status):
    """Lista reservas por status"""
    return ReservaController.listar_por_status(status)


@reservas_bp.route('/periodo', methods=['GET'])
@token_required
@barbeiro_required
def listar_reservas_por_periodo():
    """Lista reservas por período"""
    return ReservaController.listar_por_periodo()


@reservas_bp.route('/estatisticas', methods=['GET'])
@token_required
@barbeiro_required
def estatisticas_reservas():
    """Estatísticas de reservas"""
    return ReservaController.estatisticas()


@reservas_bp.route('/<int:id_reserva>/atualizar-status', methods=['PUT'])
@token_required
@barbeiro_required
def atualizar_status_reserva_barbeiro(id_reserva):
    """Barbeiro atualiza status de reserva"""
    return ReservaController.atualizar_status(id_reserva)


@reservas_bp.route('/<int:id_reserva>/cancelar', methods=['DELETE'])
@token_required
@barbeiro_required
def cancelar_reserva_barbeiro(id_reserva):
    """Barbeiro cancela reserva"""
    return ReservaController.cancelar(id_reserva)


@reservas_bp.route('/<int:id_reserva>/status', methods=['PUT'])
@token_required
def atualizar_status_minha_reserva(id_reserva):
    """Cliente atualiza status de sua reserva"""
    return ProdutoController.atualizar_status_reserva_cliente(id_reserva, request.user_cpf)


@reservas_bp.route('/<int:id_reserva>', methods=['DELETE'])
@token_required
def cancelar_minha_reserva(id_reserva):
    """Cliente cancela sua reserva"""
    return ProdutoController.cancelar_reserva_cliente(id_reserva, request.user_cpf)


@reservas_bp.route('/<int:id_reserva>', methods=['GET'])
@token_required
@barbeiro_required
def buscar_reserva_por_id(id_reserva):
    """Barbeiro busca reserva por ID"""
    return ReservaController.buscar_por_id(id_reserva)


@reservas_bp.route('/produto/<int:id_produto>', methods=['GET'])
@token_required
@barbeiro_required
def listar_reservas_produto(id_produto):
    """Lista reservas de um produto"""
    return ReservaController.listar_por_produto(id_produto)