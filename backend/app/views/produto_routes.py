from flask import Blueprint, request
from backend.app.controllers.produto_controller import ProdutoController
from backend.app.utils.decorators import token_required, barbeiro_required, barbeiro_chefe_required

produtos_bp = Blueprint('produtos', __name__, url_prefix='/api/produtos')


@produtos_bp.route('', methods=['POST'])
@token_required
@barbeiro_chefe_required
def criar_produto():
    return ProdutoController.criar()


@produtos_bp.route('', methods=['GET'])
@token_required
def listar_produtos():
    return ProdutoController.listar()


@produtos_bp.route('/<int:id_produto>', methods=['GET'])
@token_required
def buscar_produto(id_produto):
    return ProdutoController.buscar(id_produto)


@produtos_bp.route('/<int:id_produto>', methods=['PUT'])
@token_required
@barbeiro_chefe_required
def atualizar_produto(id_produto):
    return ProdutoController.atualizar(id_produto)


@produtos_bp.route('/<int:id_produto>', methods=['DELETE'])
@token_required
@barbeiro_chefe_required
def deletar_produto(id_produto):
    return ProdutoController.deletar(id_produto)


@produtos_bp.route('/<int:id_produto>/estoque', methods=['PUT'])
@token_required
@barbeiro_chefe_required
def atualizar_estoque_produto(id_produto):
    return ProdutoController.atualizar_estoque(id_produto)


@produtos_bp.route('/estoque-baixo', methods=['GET'])
@token_required
@barbeiro_required
def listar_produtos_estoque_baixo():
    return ProdutoController.listar_estoque_baixo()


@produtos_bp.route('/reservar', methods=['POST'])
@token_required
def criar_reserva_produto():
    """Cliente cria uma reserva de produto"""
    return ProdutoController.criar_reserva(request.user_cpf)


@produtos_bp.route('/minhas-reservas', methods=['GET'])
@token_required
def listar_minhas_reservas():
    """Cliente lista suas reservas"""
    return ProdutoController.minhas_reservas(request.user_cpf)


@produtos_bp.route('/paginado', methods=['GET'])
@token_required
@barbeiro_required
def listar_produtos_paginado():
    return ProdutoController.listar_paginado()


@produtos_bp.route('/buscar', methods=['GET'])
@token_required
@barbeiro_required
def buscar_produtos_por_nome():
    return ProdutoController.buscar_por_nome()


@produtos_bp.route('/categorias', methods=['GET'])
@token_required
def listar_categorias_produtos():
    return ProdutoController.listar_categorias()


@produtos_bp.route('/estatisticas', methods=['GET'])
@token_required
@barbeiro_required
def obter_estatisticas_produtos():
    return ProdutoController.obter_estatisticas()


@produtos_bp.route('/dashboard', methods=['GET'])
@token_required
@barbeiro_required
def listar_produtos_dashboard():
    return ProdutoController.listar_dashboard()