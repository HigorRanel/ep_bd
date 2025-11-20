from flask import request, jsonify
from backend.app.models.reserva import Reserva


class ReservaController:
    @staticmethod
    def listar_todas():
        try:
            reservas = Reserva.listar_todas()
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_status(status):

        try:
            reservas = Reserva.listar_por_status(status)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_periodo():

        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')

            reservas = Reserva.listar_por_periodo(data_inicio, data_fim)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def estatisticas():

        try:
            stats = Reserva.obter_estatisticas()
            return jsonify(stats), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar_status():

        try:
            dados = request.get_json()

            if 'id_cliente' not in dados or 'id_produto' not in dados or 'status' not in dados:
                return jsonify({'error': 'Campos obrigatórios: id_cliente, id_produto, status'}), 400

            resultado = Reserva.atualizar_status(
                dados['id_cliente'],
                dados['id_produto'],
                dados['status']
            )

            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def cancelar():

        try:
            dados = request.get_json()

            if 'id_cliente' not in dados or 'id_produto' not in dados:
                return jsonify({'error': 'Campos obrigatórios: id_cliente, id_produto'}), 400

            Reserva.cancelar(dados['id_cliente'], dados['id_produto'])

            return jsonify({'message': 'Reserva cancelada com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500