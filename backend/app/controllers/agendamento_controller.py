from flask import request, jsonify
from backend.app.models.agendamento import Agendamento
from datetime import datetime


class AgendamentoController:
    @staticmethod
    def criar(cpf_usuario, tipo_usuario):
        try:
            dados = request.get_json()

            campos_obrigatorios = ['data_hora_agendamento', 'cpf_cliente', 'cpf_barbeiro', 'id_servico']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Validar se a data/hora não é no passado
            try:
                data_hora_agendamento = datetime.strptime(dados['data_hora_agendamento'], '%Y-%m-%d %H:%M:%S')
                agora = datetime.now()

                if data_hora_agendamento <= agora:
                    return jsonify({'error': 'Não é possível agendar para uma data/hora no passado'}), 400
            except ValueError:
                return jsonify({'error': 'Formato de data/hora inválido. Use: YYYY-MM-DD HH:MM:SS'}), 400

            # NOVO: Verificar se pode usar plano
            usar_plano = dados.get('usar_plano', False)
            id_plano_usado = None
            desconto_aplicado = 0

            if usar_plano and tipo_usuario == 'cliente':
                from backend.app.models.plano_mensal import PlanoMensal
                verificacao = PlanoMensal.pode_agendar_com_plano(dados['cpf_cliente'], dados['id_servico'])

                if not verificacao['pode_usar_plano']:
                    return jsonify({
                        'error': f"Não foi possível usar o plano: {verificacao['motivo']}",
                        'detalhes': verificacao
                    }), 400

                id_plano_usado = verificacao['id_plano']

                # Calcular desconto
                valores_plano = PlanoMensal.calcular_valores_plano(id_plano_usado)
                desconto_aplicado = valores_plano.get('desconto_medio', 0)

            # CPF de origem é quem está fazendo o agendamento
            cpf_origem = cpf_usuario

            resultado = Agendamento.criar(
                dados['data_hora_agendamento'],
                dados['cpf_cliente'],
                dados['cpf_barbeiro'],
                dados['id_servico'],
                cpf_origem,
                dados.get('status', 'pendente')
            )

            # Se usou plano, adicionar informação
            resposta = {**resultado}
            if id_plano_usado:
                resposta['plano_usado'] = id_plano_usado
                resposta['desconto_aplicado'] = desconto_aplicado
                resposta['message'] = f'Agendamento criado com desconto de {desconto_aplicado}% do plano'

            return jsonify(resposta), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def criar_encaixe(cpf_usuario):
        """Cria um agendamento como encaixe (barbeiro agenda para cliente)"""
        try:
            dados = request.get_json()

            campos_obrigatorios = ['data_hora_agendamento', 'cpf_cliente', 'id_servico']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Validar se a data/hora não é no passado
            try:
                data_hora_agendamento = datetime.strptime(dados['data_hora_agendamento'], '%Y-%m-%d %H:%M:%S')
                agora = datetime.now()

                if data_hora_agendamento <= agora:
                    return jsonify({'error': 'Não é possível agendar para uma data/hora no passado'}), 400
            except ValueError:
                return jsonify({'error': 'Formato de data/hora inválido. Use: YYYY-MM-DD HH:MM:SS'}), 400

            # Barbeiro está fazendo o encaixe para si mesmo
            cpf_barbeiro = cpf_usuario
            cpf_origem = cpf_usuario

            resultado = Agendamento.criar(
                dados['data_hora_agendamento'],
                dados['cpf_cliente'],
                cpf_barbeiro,
                dados['id_servico'],
                cpf_origem,
                'confirmado'  # Encaixe já inicia confirmado
            )

            return jsonify({
                **resultado,
                'message': 'Encaixe realizado com sucesso'
            }), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def obter_horarios_disponiveis():
        try:
            cpf_barbeiro = request.args.get('cpf_barbeiro')
            data = request.args.get('data')  # Formato: YYYY-MM-DD
            duracao_servico_min = int(request.args.get('duracao_servico_min', 30))

            if not cpf_barbeiro or not data:
                return jsonify({'error': 'Parâmetros cpf_barbeiro e data são obrigatórios'}), 400

            # Validar formato da data
            try:
                datetime.strptime(data, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Formato de data inválido. Use: YYYY-MM-DD'}), 400

            # Validar se a data não é no passado
            data_obj = datetime.strptime(data, '%Y-%m-%d').date()
            hoje = datetime.now().date()

            if data_obj < hoje:
                return jsonify({'error': 'Não é possível consultar horários de datas passadas'}), 400

            # Se for hoje, filtrar horários que já passaram
            horarios = Agendamento.obter_horarios_disponiveis(cpf_barbeiro, data, duracao_servico_min)

            # Se for hoje, remover horários que já passaram
            if data_obj == hoje:
                hora_atual = datetime.now().time()
                horarios = [h for h in horarios if datetime.strptime(h, '%H:%M').time() > hora_atual]

            return jsonify({
                'data': data,
                'cpf_barbeiro': cpf_barbeiro,
                'duracao_servico_min': duracao_servico_min,
                'horarios_disponiveis': horarios,
                'total_horarios': len(horarios)
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def verificar_disponibilidade():
        try:
            cpf_barbeiro = request.args.get('cpf_barbeiro')
            data_hora = request.args.get('data_hora')  # Formato: YYYY-MM-DD HH:MM:SS
            duracao_min = int(request.args.get('duracao_min', 30))

            if not cpf_barbeiro or not data_hora:
                return jsonify({'error': 'Parâmetros cpf_barbeiro e data_hora são obrigatórios'}), 400

            # Validar formato de data/hora
            try:
                datetime.strptime(data_hora, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return jsonify({'error': 'Formato de data/hora inválido. Use: YYYY-MM-DD HH:MM:SS'}), 400

            # Verificar conflito
            resultado = Agendamento.verificar_conflito_horario(cpf_barbeiro, data_hora, duracao_min)

            return jsonify({
                'disponivel': not resultado['tem_conflito'],
                'conflito': resultado['agendamento_conflitante']
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_barbeiro(cpf_barbeiro):
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')

            agendamentos = Agendamento.listar_por_barbeiro(cpf_barbeiro, data_inicio, data_fim)
            return jsonify(agendamentos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(id_agendamento):
        try:
            agendamento = Agendamento.buscar_por_id(id_agendamento)
            if not agendamento:
                return jsonify({'error': 'Agendamento não encontrado'}), 404
            return jsonify(agendamento), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar_status(id_agendamento):
        try:
            dados = request.get_json()

            if 'status' not in dados:
                return jsonify({'error': 'Campo status é obrigatório'}), 400

            resultado = Agendamento.atualizar_status(id_agendamento, dados['status'])
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def cancelar(id_agendamento):
        try:
            resultado = Agendamento.atualizar_status(id_agendamento, 'cancelado')
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def avaliar(id_agendamento):
        try:
            dados = request.get_json()

            if 'nota' not in dados:
                return jsonify({'error': 'Campo nota é obrigatório'}), 400

            resultado = Agendamento.criar_avaliacao(
                id_agendamento,
                dados['nota'],
                dados.get('comentario')
            )

            return jsonify(resultado), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_avaliacoes_paginado(cpf_barbeiro):
        """Lista avaliações com paginação e filtros"""
        try:
            pagina = int(request.args.get('pagina', 1))
            por_pagina = int(request.args.get('por_pagina', 10))
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')
            nota_min = request.args.get('nota_min')

            avaliacoes = Agendamento.listar_avaliacoes_paginado(
                cpf_barbeiro,
                pagina,
                por_pagina,
                data_inicio,
                data_fim,
                nota_min
            )

            return jsonify(avaliacoes), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500