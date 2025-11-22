from flask import jsonify, request
from backend.app.controllers.auth_controller import AuthController
from backend.app.controllers.cliente_controller import ClienteController
from backend.app.controllers.barbeiro_controller import BarbeiroController
from backend.app.controllers.agendamento_controller import AgendamentoController
from backend.app.controllers.servico_controller import ServicoController
from backend.app.controllers.produto_controller import ProdutoController
from backend.app.controllers.plano_controller import PlanoController
from backend.app.utils.decorators import token_required, barbeiro_required, barbeiro_chefe_required
from backend.app.controllers.reserva_controller import ReservaController
from backend.app.controllers.cliente_stats_controller import ClienteStatsController


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

    # === CLIENTES ===
    @app.route('/api/clientes', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_clientes():
        return ClienteController.listar()

    # NOVO: Clientes com estatísticas
    @app.route('/api/clientes/estatisticas', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_clientes_stats():
        return ClienteStatsController.listar_com_estatisticas()

    # NOVO: Detalhes do cliente
    @app.route('/api/clientes/<cpf>/detalhes', methods=['GET'])
    @token_required
    @barbeiro_required
    def detalhes_cliente(cpf):
        return ClienteStatsController.detalhes_cliente(cpf)

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

    # === SERVIÇOS ===
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

    # === PRODUTOS ===
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

    # NOVO: Atualizar produto completo
    @app.route('/api/produtos/<int:id_produto>', methods=['PUT'])
    @token_required
    @barbeiro_chefe_required
    def atualizar_produto(id_produto):
        return ProdutoController.atualizar(id_produto)

    # NOVO: Deletar produto
    @app.route('/api/produtos/<int:id_produto>', methods=['DELETE'])
    @token_required
    @barbeiro_chefe_required
    def deletar_produto(id_produto):
        return ProdutoController.deletar(id_produto)

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

    # === PLANOS ===
    @app.route('/api/planos', methods=['POST'])
    @token_required
    @barbeiro_chefe_required
    def criar_plano():
        return PlanoController.criar(request.user_cpf)

    @app.route('/api/planos', methods=['GET'])
    @token_required
    def listar_planos():
        return PlanoController.listar()

    @app.route('/api/planos/<int:id_plano>', methods=['GET'])
    @token_required
    def buscar_plano(id_plano):
        return PlanoController.buscar(id_plano)

    @app.route('/api/planos/<int:id_plano>', methods=['PUT'])
    @token_required
    @barbeiro_chefe_required
    def atualizar_plano(id_plano):
        return PlanoController.atualizar(id_plano, request.user_cpf)

    @app.route('/api/planos/<int:id_plano>', methods=['DELETE'])
    @token_required
    @barbeiro_chefe_required
    def deletar_plano(id_plano):
        return PlanoController.deletar(id_plano, request.user_cpf)

    # NOVO: Gerenciar desconto do plano
    @app.route('/api/planos/<int:id_plano>/desconto', methods=['PUT'])
    @token_required
    @barbeiro_chefe_required
    def atualizar_desconto_plano(id_plano):
        return PlanoController.atualizar_desconto_plano(id_plano, request.user_cpf)

    # NOVO: Verificar uso de serviços do plano pelo cliente
    @app.route('/api/planos/<int:id_plano>/uso', methods=['GET'])
    @token_required
    def verificar_uso_plano(id_plano):
        return PlanoController.verificar_uso_plano(id_plano, request.user_cpf)

    # NOVO: Listar planos próximos do vencimento
    @app.route('/api/planos/vencendo', methods=['GET'])
    @token_required
    def planos_vencendo():
        return PlanoController.planos_vencendo(request.user_cpf)

    # NOVO: Calcular valores do plano (com desconto)
    @app.route('/api/planos/<int:id_plano>/valores', methods=['GET'])
    @token_required
    def calcular_valores_plano(id_plano):
        return PlanoController.calcular_valores_plano(id_plano)

    @app.route('/api/planos/<int:id_plano>/cancelar-assinatura', methods=['DELETE'])
    @token_required
    def cancelar_assinatura_plano(id_plano):
        """Endpoint para cliente cancelar sua assinatura de um plano"""
        return PlanoController.cancelar_assinatura(id_plano, request.user_cpf)

    # NOVO: Verificar se pode agendar com plano
    @app.route('/api/planos/pode-agendar/<int:id_servico>', methods=['GET'])
    @token_required
    def pode_agendar_com_plano(id_servico):
        try:
            from backend.app.models.plano_mensal import PlanoMensal
            resultado = PlanoMensal.pode_agendar_com_plano(request.user_cpf, id_servico)
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/planos/assinar', methods=['POST'])
    @token_required
    def assinar_plano():
        return PlanoController.assinar(request.user_cpf)

    @app.route('/api/planos/minhas-assinaturas', methods=['GET'])
    @token_required
    def listar_minhas_assinaturas():
        return PlanoController.minhas_assinaturas(request.user_cpf)

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

            # Paginação
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))

            # Filtro de data
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')

            avaliacoes = Agendamento.listar_avaliacoes_paginado(
                cpf_barbeiro, page, per_page, data_inicio, data_fim
            )
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

            # Paginação
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))

            # Filtro de data
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')

            avaliacoes = Agendamento.listar_avaliacoes_paginado(
                request.user_cpf, page, per_page, data_inicio, data_fim
            )
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

    @app.route('/api/reservas/todas', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_todas_reservas_otimizado():
        return ReservaController.listar_todas()

    @app.route('/api/reservas/status/<status>', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_reservas_por_status_v2(status):
        return ReservaController.listar_por_status(status)

    @app.route('/api/reservas/periodo', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_reservas_por_periodo_v2():
        return ReservaController.listar_por_periodo()

    @app.route('/api/reservas/estatisticas', methods=['GET'])
    @token_required
    @barbeiro_required
    def estatisticas_reservas_v2():
        return ReservaController.estatisticas()

    @app.route('/api/reservas/atualizar-status', methods=['PUT'])
    @token_required
    @barbeiro_required
    def atualizar_status_reserva_v2():
        return ReservaController.atualizar_status()

    @app.route('/api/reservas/cancelar', methods=['DELETE'])
    @token_required
    @barbeiro_required
    def cancelar_reserva_v2():
        return ReservaController.cancelar()

    @app.route('/api/produtos/paginado', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_produtos_paginado():
        return ProdutoController.listar_paginado()

    @app.route('/api/produtos/buscar', methods=['GET'])
    @token_required
    @barbeiro_required
    def buscar_produtos_por_nome():
        return ProdutoController.buscar_por_nome()

    @app.route('/api/produtos/categorias', methods=['GET'])
    @token_required
    def listar_categorias_produtos():
        return ProdutoController.listar_categorias()

    @app.route('/api/produtos/estatisticas', methods=['GET'])
    @token_required
    @barbeiro_required
    def obter_estatisticas_produtos():
        return ProdutoController.obter_estatisticas()

    @app.route('/api/agendamentos/horarios-disponiveis', methods=['GET'])
    @token_required
    def obter_horarios_disponiveis():
        return AgendamentoController.obter_horarios_disponiveis()

    @app.route('/api/agendamentos/verificar-disponibilidade', methods=['GET'])
    @token_required
    def verificar_disponibilidade_horario():
        return AgendamentoController.verificar_disponibilidade()

    @app.route('/api/auth/alterar-senha', methods=['POST'])
    @token_required
    def alterar_senha():
        return AuthController.alterar_senha()

    @app.route('/api/auth/recuperar-senha-email', methods=['POST'])
    def recuperar_senha_email():
        return AuthController.solicitar_recuperacao_email()

    @app.route('/api/auth/redefinir-senha-token', methods=['POST'])
    def redefinir_senha_token():
        return AuthController.redefinir_senha_token()

    @app.route('/api/produtos/dashboard', methods=['GET'])
    @token_required
    @barbeiro_required
    def listar_produtos_dashboard():
        return ProdutoController.listar_dashboard()