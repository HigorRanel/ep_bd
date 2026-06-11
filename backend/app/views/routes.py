"""
Registro central de rotas.

As rotas foram divididas em blueprints por domínio (um arquivo por domínio em
backend/app/views/). Este módulo apenas registra todos eles na aplicação.

A função register_routes(app) foi mantida com a mesma assinatura de antes, então
o create_app() (em backend/app/__init__.py) continua funcionando sem alteração.

IMPORTANTE: os prefixos dos blueprints reproduzem exatamente os caminhos
originais (/api/auth, /api/clientes, ...). Nenhuma URL, método ou parâmetro
mudou — apenas a organização interna do código.
"""

from backend.app.views.auth_routes import auth_bp
from backend.app.views.cliente_routes import clientes_bp
from backend.app.views.barbeiro_routes import barbeiros_bp
from backend.app.views.agendamento_routes import agendamentos_bp
from backend.app.views.servico_routes import servicos_bp
from backend.app.views.produto_routes import produtos_bp
from backend.app.views.plano_routes import planos_bp
from backend.app.views.reserva_routes import reservas_bp
from backend.app.views.avaliacao_routes import avaliacoes_bp
from backend.app.views.notificacao_routes import notificacoes_bp
from backend.app.views.relatorio_routes import relatorios_bp


def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(barbeiros_bp)
    app.register_blueprint(agendamentos_bp)
    app.register_blueprint(servicos_bp)
    app.register_blueprint(produtos_bp)
    app.register_blueprint(planos_bp)
    app.register_blueprint(reservas_bp)
    app.register_blueprint(avaliacoes_bp)
    app.register_blueprint(notificacoes_bp)
    app.register_blueprint(relatorios_bp)