from flask import request, jsonify
from backend.app.models.produto import Produto


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
    def listar_paginado():

        try:
            # Obter parâmetros da query string
            pagina = int(request.args.get('pagina', 1))
            por_pagina = int(request.args.get('por_pagina', 10))
            nome_filtro = request.args.get('nome', None)
            categoria_filtro = request.args.get('categoria', None)
            status_filtro = request.args.get('status', None)

            # Validações
            if pagina < 1:
                pagina = 1
            if por_pagina < 1 or por_pagina > 100:
                por_pagina = 10

            # Buscar produtos
            resultado = Produto.listar_paginado(
                pagina=pagina,
                por_pagina=por_pagina,
                nome_filtro=nome_filtro,
                categoria_filtro=categoria_filtro,
                status_filtro=status_filtro
            )

            return jsonify(resultado), 200
        except ValueError:
            return jsonify({'error': 'Parâmetros de paginação inválidos'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar_por_nome():

        try:
            termo = request.args.get('q', '')
            limite = int(request.args.get('limite', 10))

            if not termo:
                return jsonify({'error': 'Parâmetro q (termo de busca) é obrigatório'}), 400

            if len(termo) < 2:
                return jsonify({'error': 'Termo de busca deve ter pelo menos 2 caracteres'}), 400

            produtos = Produto.buscar_por_nome(termo, limite)
            return jsonify(produtos), 200
        except ValueError:
            return jsonify({'error': 'Parâmetro limite inválido'}), 400
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

            # Buscar produto atual para validar estoque
            produto_atual = Produto.buscar_por_id(id_produto)
            if not produto_atual:
                return jsonify({'error': 'Produto não encontrado'}), 404

            quantidade_ajuste = int(dados['quantidade'])
            estoque_atual = produto_atual['quantidade_estoque']
            estoque_final = estoque_atual + quantidade_ajuste

            # Validar se o estoque ficaria negativo
            if estoque_final < 0:
                return jsonify({
                    'error': f'Operação inválida: o estoque não pode ficar negativo. Estoque atual: {estoque_atual}, ajuste solicitado: {quantidade_ajuste}'
                }), 400

            resultado = Produto.atualizar_estoque(id_produto, quantidade_ajuste)
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

    @staticmethod
    def listar_categorias():

        try:
            categorias = Produto.obter_categorias()
            return jsonify(categorias), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def obter_estatisticas():
        try:
            stats = Produto.obter_estatisticas()
            return jsonify(stats), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500