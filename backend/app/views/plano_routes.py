from flask import Blueprint, request, jsonify
from backend.app.controllers.plano_controller import PlanoController
from backend.app.utils.decorators import token_required, barbeiro_chefe_required

planos_bp = Blueprint('planos', __name__, url_prefix='/api/planos')


@planos_bp.route('', methods=['POST'])
@token_required
@barbeiro_chefe_required
def criar_plano():
    return PlanoController.criar(request.user_cpf)


@planos_bp.route('', methods=['GET'])
@token_required
def listar_planos():
    return PlanoController.listar()


@planos_bp.route('/<int:id_plano>', methods=['GET'])
@token_required
def buscar_plano(id_plano):
    return PlanoController.buscar(id_plano)


@planos_bp.route('/<int:id_plano>', methods=['PUT'])
@token_required
@barbeiro_chefe_required
def atualizar_plano(id_plano):
    return PlanoController.atualizar(id_plano, request.user_cpf)


@planos_bp.route('/<int:id_plano>', methods=['DELETE'])
@token_required
@barbeiro_chefe_required
def deletar_plano(id_plano):
    return PlanoController.deletar(id_plano, request.user_cpf)


@planos_bp.route('/<int:id_plano>/desconto', methods=['PUT'])
@token_required
@barbeiro_chefe_required
def atualizar_desconto_plano(id_plano):
    return PlanoController.atualizar_desconto_plano(id_plano, request.user_cpf)


@planos_bp.route('/<int:id_plano>/uso', methods=['GET'])
@token_required
def verificar_uso_plano(id_plano):
    return PlanoController.verificar_uso_plano(id_plano, request.user_cpf)


@planos_bp.route('/vencendo', methods=['GET'])
@token_required
def planos_vencendo():
    return PlanoController.planos_vencendo(request.user_cpf)


@planos_bp.route('/<int:id_plano>/valores', methods=['GET'])
@token_required
def calcular_valores_plano(id_plano):
    return PlanoController.calcular_valores_plano(id_plano)


@planos_bp.route('/<int:id_plano>/cancelar-assinatura', methods=['DELETE'])
@token_required
def cancelar_assinatura_plano(id_plano):
    """Endpoint para cliente cancelar sua assinatura de um plano"""
    return PlanoController.cancelar_assinatura(id_plano, request.user_cpf)


@planos_bp.route('/pode-agendar/<int:id_servico>', methods=['GET'])
@token_required
def pode_agendar_com_plano(id_servico):
    try:
        from backend.app.models.plano_mensal import PlanoMensal
        resultado = PlanoMensal.pode_agendar_com_plano(request.user_cpf, id_servico)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@planos_bp.route('/assinar', methods=['POST'])
@token_required
def assinar_plano():
    return PlanoController.assinar(request.user_cpf)


@planos_bp.route('/minhas-assinaturas', methods=['GET'])
@token_required
def listar_minhas_assinaturas():
    return PlanoController.minhas_assinaturas(request.user_cpf)


@planos_bp.route('/<int:id_plano>/servicos', methods=['POST'])
@token_required
@barbeiro_chefe_required
def adicionar_servico_plano(id_plano):
    try:
        dados = request.get_json()

        campos_obrigatorios = ['id_servico', 'quantidade']
        for campo in campos_obrigatorios:
            if campo not in dados:
                return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

        from backend.app.models.plano_mensal import PlanoMensal
        PlanoMensal.adicionar_servico_plano(
            id_plano,
            dados['id_servico'],
            dados['quantidade']
        )

        return jsonify({'message': 'Serviço adicionado ao plano com sucesso'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@planos_bp.route('/<int:id_plano>/servicos/<int:id_servico>', methods=['DELETE'])
@token_required
@barbeiro_chefe_required
def remover_servico_plano(id_plano, id_servico):
    try:
        from backend.app.models.plano_mensal import PlanoMensal
        PlanoMensal.remover_servico_plano(id_plano, id_servico)
        return jsonify({'message': 'Serviço removido do plano com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@planos_bp.route('/<int:id_plano>/servicos/<int:id_servico>', methods=['PUT'])
@token_required
@barbeiro_chefe_required
def atualizar_quantidade_servico_plano(id_plano, id_servico):
    try:
        dados = request.get_json()

        if 'quantidade' not in dados:
            return jsonify({'error': 'Campo quantidade é obrigatório'}), 400

        from backend.app.models.plano_mensal import PlanoMensal
        PlanoMensal.atualizar_quantidade_servico(
            id_plano,
            id_servico,
            dados['quantidade']
        )

        return jsonify({'message': 'Quantidade atualizada com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@planos_bp.route('/<int:id_plano>/valor-total', methods=['GET'])
@token_required
def calcular_valor_total_plano(id_plano):
    try:
        from backend.app.models.plano_mensal import PlanoMensal
        valor_total = PlanoMensal.calcular_valor_total_plano(id_plano)
        return jsonify({'valor_total': float(valor_total)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500