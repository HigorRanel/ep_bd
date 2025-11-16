from flask import request, jsonify
from app.models.cliente import Cliente
from app.models.pessoa import Pessoa


class ClienteController:
    @staticmethod
    def listar():
        try:
            clientes = Cliente.listar_todos()
            return jsonify(clientes), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(cpf):
        try:
            cliente = Cliente.buscar_por_cpf(cpf)
            if not cliente:
                return jsonify({'error': 'Cliente não encontrado'}), 404
            return jsonify(cliente), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def meus_dados(cpf_usuario):
        try:
            cliente = Cliente.buscar_por_cpf(cpf_usuario)
            if not cliente:
                return jsonify({'error': 'Cliente não encontrado'}), 404
            return jsonify(cliente), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def meus_agendamentos(cpf_usuario):
        try:
            agendamentos = Cliente.buscar_agendamentos(cpf_usuario)
            return jsonify(agendamentos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar(cpf_usuario):
        try:
            dados = request.get_json()

            # Não permitir alterar CPF
            if 'cpf' in dados:
                del dados['cpf']

            resultado = Pessoa.atualizar(cpf_usuario, dados)

            if not resultado:
                return jsonify({'error': 'Nenhum dado para atualizar'}), 400

            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500