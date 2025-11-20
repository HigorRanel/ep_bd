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
    def buscar_por_id(id_produto):
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Produto WHERE id_produto = %s", (id_produto,))
            return cursor.fetchone()

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