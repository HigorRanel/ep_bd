from flask import Blueprint, request, jsonify
from backend.app.controllers.agendamento_controller import AgendamentoController
from backend.app.utils.decorators import token_required, barbeiro_required

agendamentos_bp = Blueprint('agendamentos', __name__, url_prefix='/api/agendamentos')


@agendamentos_bp.route('', methods=['POST'])
@token_required
def criar_agendamento():
    return AgendamentoController.criar(request.user_cpf, request.user_type)


@agendamentos_bp.route('/barbeiro/<cpf_barbeiro>', methods=['GET'])
@token_required
def listar_agendamentos_barbeiro(cpf_barbeiro):
    return AgendamentoController.listar_por_barbeiro(cpf_barbeiro)


@agendamentos_bp.route('/<int:id_agendamento>', methods=['GET'])
@token_required
def buscar_agendamento(id_agendamento):
    return AgendamentoController.buscar(id_agendamento)


@agendamentos_bp.route('/<int:id_agendamento>/status', methods=['PUT'])
@token_required
def atualizar_status_agendamento(id_agendamento):
    return AgendamentoController.atualizar_status(id_agendamento)


@agendamentos_bp.route('/<int:id_agendamento>/cancelar', methods=['PUT'])
@token_required
def cancelar_agendamento(id_agendamento):
    return AgendamentoController.cancelar(id_agendamento)


@agendamentos_bp.route('/<int:id_agendamento>/avaliar', methods=['POST'])
@token_required
def avaliar_agendamento(id_agendamento):
    return AgendamentoController.avaliar(id_agendamento)


@agendamentos_bp.route('/<int:id_agendamento>/servico', methods=['GET'])
@token_required
def buscar_servico_agendamento(id_agendamento):
    try:
        from backend.app.models.agendamento import Agendamento
        servico = Agendamento.buscar_servico_agendamento(id_agendamento)

        if not servico:
            return jsonify({'error': 'Serviço não encontrado'}), 404

        return jsonify(servico), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@agendamentos_bp.route('/<int:id_agendamento>/servico', methods=['PUT'])
@token_required
@barbeiro_required
def atualizar_servico_agendamento(id_agendamento):
    try:
        dados = request.get_json()

        if 'id_servico' not in dados:
            return jsonify({'error': 'Campo id_servico é obrigatório'}), 400

        from backend.app.models.agendamento import Agendamento
        Agendamento.atualizar_servico_agendamento(id_agendamento, dados['id_servico'])

        return jsonify({'message': 'Serviço atualizado com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@agendamentos_bp.route('/horarios-disponiveis', methods=['GET'])
@token_required
def obter_horarios_disponiveis():
    return AgendamentoController.obter_horarios_disponiveis()


@agendamentos_bp.route('/verificar-disponibilidade', methods=['GET'])
@token_required
def verificar_disponibilidade_horario():
    return AgendamentoController.verificar_disponibilidade()