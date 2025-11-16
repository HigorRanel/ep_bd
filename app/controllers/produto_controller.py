from flask import request, jsonify
from app.models.produto import Produto


class ProdutoController:
    @staticmethod
    def criar():
        try:
            dados = request.get_json()

            campos_obrigatorios = ['nome_produto', 'preco_compra', 'preco_venda', 'categoria']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            resultado = Produto.criar(
                dados['nome_produto'],
                dados.get('descricao'),
                dados['preco_compra'],
                dados['preco_venda'],
                dados['categoria'],
                dados.get('quantidade_estoque', 0),
                dados.get('minimo_estoque', 0),
                dados.get('status', 'disponivel')
            )

            return jsonify(resultado), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar():
        try:
            produtos = Produto.listar_todos()
            return jsonify(produtos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(id_produto):
        try:
            produto = Produto.buscar_por_id(id_produto)
            if not produto:
                return jsonify({'error': 'Produto não encontrado'}), 404
            return jsonify(produto), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar_estoque(id_produto):
        try:
            dados = request.get_json()

            if 'quantidade' not in dados:
                return jsonify({'error': 'Campo quantidade é obrigatório'}), 400

            resultado = Produto.atualizar_estoque(id_produto, dados['quantidade'])
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_estoque_baixo():
        try:
            produtos = Produto.listar_estoque_baixo()
            return jsonify(produtos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def criar_reserva(cpf_usuario):
        try:
            dados = request.get_json()

            if 'id_produto' not in dados:
                return jsonify({'error': 'Campo id_produto é obrigatório'}), 400

            Produto.criar_reserva(cpf_usuario, dados['id_produto'])
            return jsonify({'message': 'Reserva criada com sucesso'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def minhas_reservas(cpf_usuario):
        try:
            reservas = Produto.listar_reservas_cliente(cpf_usuario)
            return jsonify(reservas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

