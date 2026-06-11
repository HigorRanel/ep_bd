from flask import Blueprint, request
from backend.app.controllers.relatorio_controller import RelatorioController
from backend.app.utils.decorators import token_required, barbeiro_required, barbeiro_chefe_required

relatorios_bp = Blueprint('relatorios', __name__, url_prefix='/api/relatorios')


@relatorios_bp.route('/financeiro', methods=['GET'])
@token_required
@barbeiro_required
def relatorio_financeiro():
    """
    Gera relatório financeiro detalhado
    Query params: data_inicio, data_fim, cpf_barbeiro (opcional)
    """
    return RelatorioController.gerar_relatorio_financeiro()


@relatorios_bp.route('/produtos', methods=['GET'])
@token_required
@barbeiro_required
def relatorio_produtos():
    """
    Relatório de produtos mais e menos vendidos
    Query params: data_inicio, data_fim, limite (padrão 10)
    """
    return RelatorioController.relatorio_produtos()


@relatorios_bp.route('/clientes', methods=['GET'])
@token_required
@barbeiro_required
def relatorio_clientes():
    return RelatorioController.relatorio_clientes()


@relatorios_bp.route('/completo', methods=['GET'])
@token_required
@barbeiro_chefe_required
def relatorio_completo():
    return RelatorioController.relatorio_completo()