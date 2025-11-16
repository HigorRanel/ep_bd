from flask import request, jsonify
from app.models.barbeiro import Barbeiro


class BarbeiroController:
    @staticmethod
    def listar():
        try:
            barbeiros = Barbeiro.listar_todos()
            return jsonify(barbeiros), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(cpf):
        try:
            barbeiro = Barbeiro.buscar_por_cpf(cpf)
            if not barbeiro:
                return jsonify({'error': 'Barbeiro não encontrado'}), 404
            return jsonify(barbeiro), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def meus_servicos(cpf_usuario):
        try:
            servicos = Barbeiro.listar_servicos(cpf_usuario)
            return jsonify(servicos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500