from flask import request, jsonify
from backend.app.models.reserva import Reserva


class ReservaController:
    @staticmethod
    def listar_todas():
        """Lista todas as reservas"""
        try:
            reservas = Reserva.listar_todas()
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_status(status):
        """Lista reservas por status"""
        try:
            reservas = Reserva.listar_por_status(status)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_periodo():
        """Lista reservas por período"""
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')

            reservas = Reserva.listar_por_periodo(data_inicio, data_fim)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def estatisticas():
        """Retorna estatísticas das reservas"""
        try:
            stats = Reserva.obter_estatisticas()
            return jsonify(stats), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar_por_id(id_reserva):
        """Busca uma reserva específica"""
        try:
            reserva = Reserva.buscar_por_id(id_reserva)
            if not reserva:
                return jsonify({'error': 'Reserva não encontrada'}), 404
            return jsonify(reserva), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar_status(id_reserva):
        """Atualiza o status de uma reserva usando id_reserva"""
        try:
            dados = request.get_json()
            
            # Debug
            print(f"[ReservaController] Atualizando reserva ID: {id_reserva}")
            print(f"[ReservaController] Dados recebidos: {dados}")

            if not dados:
                return jsonify({'error': 'Nenhum dado fornecido no corpo da requisição'}), 400

            if 'status' not in dados:
                return jsonify({'error': 'Campo status é obrigatório'}), 400

            status_validos = ['reservado', 'comprado', 'retirado', 'cancelado', 'pendente']
            if dados['status'] not in status_validos:
                return jsonify({
                    'error': f'Status inválido. Valores aceitos: {", ".join(status_validos)}'
                }), 400

            resultado = Reserva.atualizar_status(id_reserva, dados['status'])
            
            if not resultado:
                return jsonify({'error': 'Reserva não encontrada'}), 404
            
            print(f"[ReservaController] Reserva atualizada com sucesso: {resultado}")

            return jsonify({
                'message': 'Status atualizado com sucesso',
                'reserva': resultado
            }), 200
            
        except Exception as e:
            print(f"[ReservaController] ERRO: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def cancelar(id_reserva):
        """Cancela (deleta) uma reserva usando id_reserva"""
        try:
            Reserva.cancelar(id_reserva)
            return jsonify({'message': 'Reserva cancelada com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_produto(id_produto):
        """Lista reservas de um produto"""
        try:
            reservas = Reserva.listar_por_produto(id_produto)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_por_cliente(cpf_cliente):
        """Lista reservas de um cliente"""
        try:
            reservas = Reserva.listar_por_cliente(cpf_cliente)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500