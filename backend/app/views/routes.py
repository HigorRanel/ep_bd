from flask import jsonify
from backend.app.controllers.auth_controller import AuthController
from backend.app.controllers.cliente_controller import ClienteController
from backend.app.controllers.barbeiro_controller import BarbeiroController
from backend.app.controllers.agendamento_controller import AgendamentoController
from backend.app.controllers.servico_controller import ServicoController
from backend.app.controllers.produto_controller import ProdutoController
from backend.app.controllers.plano_controller import PlanoController
from backend.app.utils.decorators import token_required, barbeiro_required, barbeiro_chefe_required
from flask import request


def register_routes(app):

    @app.route('/api/auth/registrar/cliente', methods=['POST'])
    def registrar_cliente():
        return AuthController.registrar_cliente()

    @app.route('/api/auth/registrar/barbeiro', methods=['POST'])
    def registrar_barbeiro():
        return AuthController.registrar_barbeiro()

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        return AuthController.login()

    @app.route('/api/auth/cadastrar-e-logar/cliente', methods=['POST'])
    def cadastrar_e_logar_cliente():
        return AuthController.registrar_e_logar_cliente()

    @app.route('/api/auth/cadastrar-e-logar/barbeiro', methods=['POST'])
    def cadastrar_e_logar_barbeiro():
        return AuthController.registrar_e_logar_barbeiro()

    @app.route('/api/clientes', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_clientes():
        return ClienteController.listar()

    @app.route('/api/clientes/<cpf>', methods=['GET'])
    @token_required
    def buscar_cliente(cpf):
        return ClienteController.buscar(cpf)

    @app.route('/api/clientes/me', methods=['GET'])
    @token_required
    def meus_dados_cliente():
        return ClienteController.meus_dados(request.user_cpf)

    @app.route('/api/clientes/me', methods=['PUT'])
    @token_required
    def atualizar_cliente():
        return ClienteController.atualizar(request.user_cpf)

    @app.route('/api/clientes/me/agendamentos', methods=['GET'])
    @token_required
    def meus_agendamentos():
        return ClienteController.meus_agendamentos(request.user_cpf)


    @app.route('/api/barbeiros', methods=['GET'])
    @token_required
    def listar_barbeiros():
        return BarbeiroController.listar()

    @app.route('/api/barbeiros/<cpf>', methods=['GET'])
    @token_required
    def buscar_barbeiro(cpf):
        return BarbeiroController.buscar(cpf)

    @app.route('/api/barbeiros/me/servicos', methods=['GET'])
    @token_required
    @barbeiro_required
    def meus_servicos():
        return BarbeiroController.meus_servicos(request.user_cpf)

    @app.route('/api/agendamentos', methods=['POST'])
    @token_required
    def criar_agendamento():
        return AgendamentoController.criar(request.user_cpf, request.user_type)

    @app.route('/api/agendamentos/barbeiro/<cpf_barbeiro>', methods=['GET'])
    @token_required
    def listar_agendamentos_barbeiro(cpf_barbeiro):
        return AgendamentoController.listar_por_barbeiro(cpf_barbeiro)

    @app.route('/api/agendamentos/<int:id_agendamento>', methods=['GET'])
    @token_required
    def buscar_agendamento(id_agendamento):
        return AgendamentoController.buscar(id_agendamento)

    @app.route('/api/agendamentos/<int:id_agendamento>/status', methods=['PUT'])
    @token_required
    def atualizar_status_agendamento(id_agendamento):
        return AgendamentoController.atualizar_status(id_agendamento)

    @app.route('/api/agendamentos/<int:id_agendamento>/cancelar', methods=['PUT'])
    @token_required
    def cancelar_agendamento(id_agendamento):
        return AgendamentoController.cancelar(id_agendamento)

    @app.route('/api/agendamentos/<int:id_agendamento>/avaliar', methods=['POST'])
    @token_required
    def avaliar_agendamento(id_agendamento):
        return AgendamentoController.avaliar(id_agendamento)

    @app.route('/api/servicos', methods=['POST'])
    @token_required
    @barbeiro_required
    def criar_servico():
        return ServicoController.criar()

    @app.route('/api/servicos', methods=['GET'])
    @token_required
    def listar_servicos():
        return ServicoController.listar()

    @app.route('/api/servicos/<int:id_servico>', methods=['GET'])
    @token_required
    def buscar_servico(id_servico):
        return ServicoController.buscar(id_servico)

    @app.route('/api/servicos/<int:id_servico>', methods=['PUT'])
    @token_required
    @barbeiro_required
    def atualizar_servico(id_servico):
        return ServicoController.atualizar(id_servico)

    @app.route('/api/servicos/<int:id_servico>', methods=['DELETE'])
    @token_required
    @barbeiro_chefe_required
    def deletar_servico(id_servico):
        return ServicoController.deletar(id_servico)

    @app.route('/api/produtos', methods=['POST'])
    @token_required
    @barbeiro_chefe_required
    def criar_produto():
        return ProdutoController.criar()

    @app.route('/api/produtos', methods=['GET'])
    @token_required
    def listar_produtos():
        return ProdutoController.listar()

    @app.route('/api/produtos/<int:id_produto>', methods=['GET'])
    @token_required
    def buscar_produto(id_produto):
        return ProdutoController.buscar(id_produto)

    @app.route('/api/produtos/<int:id_produto>/estoque', methods=['PUT'])
    @token_required
    @barbeiro_chefe_required
    def atualizar_estoque_produto(id_produto):
        return ProdutoController.atualizar_estoque(id_produto)

    @app.route('/api/produtos/estoque-baixo', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_produtos_estoque_baixo():
        return ProdutoController.listar_estoque_baixo()

    @app.route('/api/produtos/reservar', methods=['POST'])
    @token_required
    def criar_reserva_produto():
        return ProdutoController.criar_reserva(request.user_cpf)

    @app.route('/api/produtos/minhas-reservas', methods=['GET'])
    @token_required
    def listar_minhas_reservas():
        return ProdutoController.minhas_reservas(request.user_cpf)

    @app.route('/api/planos', methods=['POST'])
    @token_required
    @barbeiro_chefe_required
    def criar_plano():
        return PlanoController.criar(request.user_cpf)

    @app.route('/api/planos', methods=['GET'])
    @token_required
    def listar_planos():
        return PlanoController.listar()

    @app.route('/api/planos/assinar', methods=['POST'])
    @token_required
    def assinar_plano():
        return PlanoController.assinar(request.user_cpf)

    @app.route('/api/planos/minhas-assinaturas', methods=['GET'])
    @token_required
    def listar_minhas_assinaturas():
        return PlanoController.minhas_assinaturas(request.user_cpf)


    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'ok', 'message': 'API Barbearia funcionando'}, 200

    @app.route('/api/assinaturas/cancelar/<int:id_plano>', methods=['DELETE'])
    @token_required
    def cancelar_assinatura(id_plano):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            PlanoMensal.cancelar_assinatura(request.user_cpf, id_plano)
            return jsonify({'message': 'Assinatura cancelada com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/assinaturas/verificar/<int:id_plano>', methods=['GET'])
    @token_required
    def verificar_assinatura_ativa(id_plano):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            assinatura = PlanoMensal.verificar_assinatura_ativa(request.user_cpf, id_plano)

            if assinatura:
                return jsonify({
                    'ativa': True,
                    'assinatura': assinatura
                }), 200
            else:
                return jsonify({'ativa': False}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500


    @app.route('/api/agendamentos/<int:id_agendamento>/servico', methods=['GET'])
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

    @app.route('/api/agendamentos/<int:id_agendamento>/servico', methods=['PUT'])
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


    @app.route('/api/avaliacoes/agendamento/<int:id_agendamento>', methods=['GET'])
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

    @app.route('/api/avaliacoes/barbeiro/<cpf_barbeiro>', methods=['GET'])
    @token_required
    def listar_avaliacoes_barbeiro(cpf_barbeiro):
        try:
            from backend.app.models.agendamento import Agendamento
            avaliacoes = Agendamento.listar_avaliacoes_barbeiro(cpf_barbeiro)
            return jsonify(avaliacoes), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/avaliacoes/barbeiro/<cpf_barbeiro>/media', methods=['GET'])
    @token_required
    def calcular_media_avaliacoes_barbeiro(cpf_barbeiro):
        try:
            from backend.app.models.agendamento import Agendamento
            resultado = Agendamento.calcular_media_avaliacoes_barbeiro(cpf_barbeiro)
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/avaliacoes/me', methods=['GET'])
    @token_required
    @barbeiro_required
    def minhas_avaliacoes():
        try:
            from backend.app.models.agendamento import Agendamento
            avaliacoes = Agendamento.listar_avaliacoes_barbeiro(request.user_cpf)
            return jsonify(avaliacoes), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/avaliacoes/me/media', methods=['GET'])
    @token_required
    @barbeiro_required
    def minha_media_avaliacoes():
        try:
            from backend.app.models.agendamento import Agendamento
            resultado = Agendamento.calcular_media_avaliacoes_barbeiro(request.user_cpf)
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/reservas/<int:id_produto>/status', methods=['PUT'])
    @token_required
    def atualizar_status_reserva(id_produto):
        try:
            dados = request.get_json()

            if 'status' not in dados:
                return jsonify({'error': 'Campo status é obrigatório'}), 400

            status_validos = ['pendente', 'comprado', 'cancelado']
            if dados['status'] not in status_validos:
                return jsonify({'error': f'Status deve ser um de: {", ".join(status_validos)}'}), 400

            from backend.app.models.produto import Produto
            reserva = Produto.atualizar_status_reserva(
                request.user_cpf,
                id_produto,
                dados['status']
            )

            if not reserva:
                return jsonify({'error': 'Reserva não encontrada'}), 404

            return jsonify(reserva), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/reservas/<int:id_produto>', methods=['DELETE'])
    @token_required
    def cancelar_reserva(id_produto):
        try:
            from backend.app.models.produto import Produto
            Produto.cancelar_reserva(request.user_cpf, id_produto)
            return jsonify({'message': 'Reserva cancelada com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/reservas/produto/<int:id_produto>', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_reservas_produto(id_produto):

        try:
            from backend.app.models.produto import Produto
            reservas = Produto.listar_reservas_por_produto(id_produto)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/planos/<int:id_plano>/servicos', methods=['GET'])
    @token_required
    def buscar_servicos_plano(id_plano):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            servicos = PlanoMensal.buscar_servicos_plano(id_plano)
            return jsonify(servicos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/planos/<int:id_plano>/servicos', methods=['POST'])
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

    @app.route('/api/planos/<int:id_plano>/servicos/<int:id_servico>', methods=['DELETE'])
    @token_required
    @barbeiro_chefe_required
    def remover_servico_plano(id_plano, id_servico):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            PlanoMensal.remover_servico_plano(id_plano, id_servico)
            return jsonify({'message': 'Serviço removido do plano com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/planos/<int:id_plano>/servicos/<int:id_servico>', methods=['PUT'])
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

    @app.route('/api/planos/<int:id_plano>/valor-total', methods=['GET'])
    @token_required
    def calcular_valor_total_plano(id_plano):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            valor_total = PlanoMensal.calcular_valor_total_plano(id_plano)
            return jsonify({'valor_total': float(valor_total)}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500