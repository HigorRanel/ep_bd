from flask import Blueprint, request, jsonify
from backend.app.utils.decorators import token_required, barbeiro_required

avaliacoes_bp = Blueprint('avaliacoes', __name__, url_prefix='/api/avaliacoes')


@avaliacoes_bp.route('/agendamento/<int:id_agendamento>', methods=['GET'])
@token_required
def buscar_avaliacao_agendamento(id_agendamento):
    try:
        from backend.app.models.agendamento import Agendamento
        avaliacao = Agendamento.buscar_avaliacao(id_agendamento)

        if not avaliacao:
            return jsonify({'message': 'Agendamento ainda não foi avaliado'}), 404

        return jsonify(avaliacao), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@avaliacoes_bp.route('/barbeiro/<cpf_barbeiro>', methods=['GET'])
@token_required
def listar_avaliacoes_barbeiro(cpf_barbeiro):
    try:
        from backend.app.models.agendamento import Agendamento

        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')

        avaliacoes = Agendamento.listar_avaliacoes_paginado(
            cpf_barbeiro, page, per_page, data_inicio, data_fim
        )
        return jsonify(avaliacoes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@avaliacoes_bp.route('/barbeiro/<cpf_barbeiro>/media', methods=['GET'])
@token_required
def calcular_media_avaliacoes_barbeiro(cpf_barbeiro):
    try:
        from backend.app.models.agendamento import Agendamento
        resultado = Agendamento.calcular_media_avaliacoes_barbeiro(cpf_barbeiro)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@avaliacoes_bp.route('/me', methods=['GET'])
@token_required
@barbeiro_required
def minhas_avaliacoes():
    try:
        from backend.app.models.agendamento import Agendamento

        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')

        avaliacoes = Agendamento.listar_avaliacoes_paginado(
            request.user_cpf, page, per_page, data_inicio, data_fim
        )
        return jsonify(avaliacoes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@avaliacoes_bp.route('/me/media', methods=['GET'])
@token_required
@barbeiro_required
def minha_media_avaliacoes():
    try:
        from backend.app.models.agendamento import Agendamento
        resultado = Agendamento.calcular_media_avaliacoes_barbeiro(request.user_cpf)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500