from flask import Blueprint, request
from backend.app.controllers.notificacao_controller import NotificacaoController
from backend.app.utils.decorators import token_required, barbeiro_required

notificacoes_bp = Blueprint('notificacoes', __name__, url_prefix='/api/notificacoes')


@notificacoes_bp.route('/templates', methods=['GET'])
@token_required
@barbeiro_required
def listar_templates_email():
    """Lista templates de email disponíveis"""
    return NotificacaoController.listar_templates()


@notificacoes_bp.route('/template/preview', methods=['GET'])
@token_required
@barbeiro_required
def visualizar_template_email():
    """Gera preview de um template de email"""
    return NotificacaoController.visualizar_template(request.user_cpf)


@notificacoes_bp.route('/clientes-inativos', methods=['GET'])
@token_required
@barbeiro_required
def listar_clientes_inativos():
    """Lista clientes que não cortam há muito tempo"""
    return NotificacaoController.listar_clientes_inativos(request.user_cpf)


@notificacoes_bp.route('/clientes-faltas', methods=['GET'])
@token_required
@barbeiro_required
def listar_clientes_com_faltas():
    """Lista clientes com muitas faltas"""
    return NotificacaoController.listar_clientes_muitas_faltas(request.user_cpf)


@notificacoes_bp.route('/enviar', methods=['POST'])
@token_required
@barbeiro_required
def enviar_notificacoes():
    """Envia notificação por email para clientes selecionados"""
    return NotificacaoController.enviar_notificacao(request.user_cpf)