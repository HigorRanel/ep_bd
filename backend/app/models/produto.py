from backend.app.utils.database import Database


class Produto:
    @staticmethod
    def criar(nome_produto, descricao, preco_compra, preco_venda, categoria,
              quantidade_estoque=0, minimo_estoque=0, status='disponivel'):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Produto (nome_produto, descricao, preco_compra, preco_venda, 
                                   categoria, quantidade_estoque, minimo_estoque, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id_produto
            """, (nome_produto, descricao, preco_compra, preco_venda, categoria,
                  quantidade_estoque, minimo_estoque, status))
            return cursor.fetchone()

    @staticmethod
    def listar_todos():
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Produto ORDER BY nome_produto")
            return cursor.fetchall()

    @staticmethod
    def listar_paginado(pagina=1, por_pagina=10, nome_filtro=None, categoria_filtro=None, status_filtro=None):

        with Database.get_cursor() as cursor:
            # Construir query base
            query_base = "FROM Produto WHERE 1=1"
            params = []

            # Adicionar filtros
            if nome_filtro:
                query_base += " AND LOWER(nome_produto) LIKE LOWER(%s)"
                params.append(f"%{nome_filtro}%")

            if categoria_filtro:
                query_base += " AND categoria = %s"
                params.append(categoria_filtro)

            if status_filtro:
                query_base += " AND status = %s"
                params.append(status_filtro)

            # Contar total de registros
            cursor.execute(f"SELECT COUNT(*) as total {query_base}", params)
            total_produtos = cursor.fetchone()['total']

            # Calcular paginação
            total_paginas = (total_produtos + por_pagina - 1) // por_pagina
            offset = (pagina - 1) * por_pagina

            # Buscar produtos da página
            query_produtos = f"""
                SELECT * {query_base}
                ORDER BY nome_produto
                LIMIT %s OFFSET %s
            """
            params.extend([por_pagina, offset])

            cursor.execute(query_produtos, params)
            produtos = cursor.fetchall()

            return {
                'produtos': produtos,
                'total_produtos': total_produtos,
                'total_paginas': total_paginas,
                'pagina_atual': pagina,
                'por_pagina': por_pagina,
                'tem_proxima': pagina < total_paginas,
                'tem_anterior': pagina > 1
            }

    @staticmethod
    def buscar_por_id(id_produto):
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Produto WHERE id_produto = %s", (id_produto,))
            return cursor.fetchone()

    @staticmethod
    def buscar_por_nome(nome, limite=10):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM Produto 
                WHERE LOWER(nome_produto) LIKE LOWER(%s)
                ORDER BY nome_produto
                LIMIT %s
            """, (f"%{nome}%", limite))
            return cursor.fetchall()

    @staticmethod
    def atualizar_estoque(id_produto, quantidade):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                UPDATE Produto
                SET quantidade_estoque = quantidade_estoque + %s
                WHERE id_produto = %s
                RETURNING *
            """, (quantidade, id_produto))
            return cursor.fetchone()

    @staticmethod
    def listar_estoque_baixo():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM Produto
                WHERE quantidade_estoque <= minimo_estoque
                ORDER BY quantidade_estoque
            """)
            return cursor.fetchall()

    @staticmethod
    def criar_reserva(cpf_cliente, id_produto, status='reservado'):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Reserva (id_cliente, id_prod, data_reserva, status)
                VALUES (%s, %s, CURRENT_DATE, %s)
            """, (cpf_cliente, id_produto, status))
            return True

    @staticmethod
    def listar_reservas_cliente(cpf_cliente):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT r.*, p.nome_produto, p.preco_venda, p.categoria
                FROM Reserva r
                JOIN Produto p ON r.id_prod = p.id_produto
                WHERE r.id_cliente = %s
                ORDER BY r.data_reserva DESC
            """, (cpf_cliente,))
            return cursor.fetchall()

    @staticmethod
    def atualizar_status_reserva(cpf_cliente, id_produto, novo_status):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                 UPDATE Reserva 
                 SET status = %s 
                 WHERE id_cliente = %s AND id_prod = %s
                 RETURNING *
             """, (novo_status, cpf_cliente, id_produto))

            reserva = cursor.fetchone()

            # Se foi comprado, reduzir estoque
            if novo_status == 'comprado' and reserva:
                cursor.execute("""
                     UPDATE Produto 
                     SET quantidade_estoque = quantidade_estoque - 1 
                     WHERE id_produto = %s
                 """, (id_produto,))

            return reserva

    @staticmethod
    def cancelar_reserva(cpf_cliente, id_produto):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                   DELETE FROM Reserva 
                   WHERE id_cliente = %s AND id_prod = %s
               """, (cpf_cliente, id_produto))
            return True

    @staticmethod
    def listar_reservas_por_produto(id_produto):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                   SELECT r.*, p.nome_completo as cliente_nome, p.telefone, p.email
                   FROM Reserva r
                   JOIN Cliente c ON r.id_cliente = c.cpf
                   JOIN Pessoa p ON c.cpf = p.cpf
                   WHERE r.id_prod = %s
                   ORDER BY r.data_reserva DESC
               """, (id_produto,))
            return cursor.fetchall()

    @staticmethod
    def obter_categorias():

        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT categoria 
                FROM Produto 
                WHERE categoria IS NOT NULL
                ORDER BY categoria
            """)
            return [row['categoria'] for row in cursor.fetchall()]

    @staticmethod
    def obter_estatisticas():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_produtos,
                    SUM(quantidade_estoque) as total_estoque,
                    COUNT(CASE WHEN quantidade_estoque <= minimo_estoque THEN 1 END) as produtos_estoque_baixo,
                    COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as produtos_disponiveis
                FROM Produto
            """)
            return cursor.fetchone()

    @staticmethod
    def listar_com_reservas():
        with Database.get_cursor() as cursor:
            # Esta query traz os dados do produto E conta as reservas pendentes em uma única ida ao banco
            cursor.execute("""
                SELECT p.*, 
                       COALESCE(COUNT(r.id) FILTER (WHERE r.status = 'pendente'), 0) as qtd_reservas
                FROM Produto p
                LEFT JOIN Reserva r ON p.id = r.id_produto
                GROUP BY p.id
                ORDER BY p.nome
            """)
            return cursor.fetchall()

    @staticmethod
    def atualizar(id_produto, dados):
        with Database.get_cursor() as cursor:
            campos = []
            valores = []

            for campo, valor in dados.items():
                campos.append(f"{campo} = %s")
                valores.append(valor)

            if not campos:
                return None

            valores.append(id_produto)
            query = f"UPDATE Produto SET {', '.join(campos)} WHERE id_produto = %s RETURNING *"

            cursor.execute(query, valores)
            return cursor.fetchone()

    @staticmethod
    def deletar(id_produto):
        with Database.get_cursor() as cursor:
            cursor.execute("DELETE FROM Produto WHERE id_produto = %s", (id_produto,))
            return True