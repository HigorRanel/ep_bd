from flask import request, jsonify
from app.models.agendamento import Agendamento
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

            return jsonify(resultado), 201
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