from backend.app.utils.database import Database


class Reserva:
    @staticmethod
    def listar_todas():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.id_cliente,
                    r.id_prod,
                    r.data_reserva,
                    r.status,
                    p.nome_completo as cliente_nome,
                    p.email as cliente_email,
                    p.telefone as cliente_telefone,
                    prod.nome_produto,
                    prod.categoria,
                    prod.preco_venda,
                    prod.quantidade_estoque
                FROM Reserva r
                JOIN Cliente c ON r.id_cliente = c.cpf
                JOIN Pessoa p ON c.cpf = p.cpf
                JOIN Produto prod ON r.id_prod = prod.id_produto
                ORDER BY r.data_reserva DESC
            """)
            return cursor.fetchall()

    @staticmethod
    def listar_por_status(status):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.id_cliente,
                    r.id_prod,
                    r.data_reserva,
                    r.status,
                    p.nome_completo as cliente_nome,
                    p.email as cliente_email,
                    p.telefone as cliente_telefone,
                    prod.nome_produto,
                    prod.categoria,
                    prod.preco_venda,
                    prod.quantidade_estoque
                FROM Reserva r
                JOIN Cliente c ON r.id_cliente = c.cpf
                JOIN Pessoa p ON c.cpf = p.cpf
                JOIN Produto prod ON r.id_prod = prod.id_produto
                WHERE r.status = %s
                ORDER BY r.data_reserva DESC
            """, (status,))
            return cursor.fetchall()

    @staticmethod
    def listar_por_periodo(data_inicio=None, data_fim=None):
        with Database.get_cursor() as cursor:
            query = """
                SELECT 
                    r.id_cliente,
                    r.id_prod,
                    r.data_reserva,
                    r.status,
                    p.nome_completo as cliente_nome,
                    p.email as cliente_email,
                    p.telefone as cliente_telefone,
                    prod.nome_produto,
                    prod.categoria,
                    prod.preco_venda,
                    prod.quantidade_estoque
                FROM Reserva r
                JOIN Cliente c ON r.id_cliente = c.cpf
                JOIN Pessoa p ON c.cpf = p.cpf
                JOIN Produto prod ON r.id_prod = prod.id_produto
                WHERE 1=1
            """
            params = []

            if data_inicio:
                query += " AND r.data_reserva >= %s"
                params.append(data_inicio)

            if data_fim:
                query += " AND r.data_reserva <= %s"
                params.append(data_fim)

            query += " ORDER BY r.data_reserva DESC"

            cursor.execute(query, params)
            return cursor.fetchall()

    @staticmethod
    def obter_estatisticas():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'reservado' THEN 1 ELSE 0 END) as reservados,
                    SUM(CASE WHEN status = 'comprado' THEN 1 ELSE 0 END) as comprados,
                    SUM(CASE WHEN status = 'retirado' THEN 1 ELSE 0 END) as retirados,
                    SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
                    SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes
                FROM Reserva
            """)
            return cursor.fetchone()

    @staticmethod
    def atualizar_status(id_cliente, id_produto, novo_status):
        with Database.get_cursor() as cursor:
            
            cursor.execute("""
                SELECT status FROM Reserva 
                WHERE id_cliente = %s AND id_prod = %s
            """, (id_cliente, id_produto))

            reserva = cursor.fetchone()
            if not reserva:
                raise Exception('Reserva não encontrada')

            status_anterior = reserva['status']

            cursor.execute("""
                UPDATE Reserva 
                SET status = %s 
                WHERE id_cliente = %s AND id_prod = %s
                RETURNING *
            """, (novo_status, id_cliente, id_produto))

            resultado = cursor.fetchone()

            if novo_status in ('comprado', 'retirado') and status_anterior not in ('comprado', 'retirado'):
                cursor.execute("""
                    UPDATE Produto 
                    SET quantidade_estoque = quantidade_estoque - 1 
                    WHERE id_produto = %s AND quantidade_estoque > 0
                """, (id_produto,))

            elif status_anterior in ('comprado', 'retirado') and novo_status not in ('comprado', 'retirado'):
                cursor.execute("""
                    UPDATE Produto 
                    SET quantidade_estoque = quantidade_estoque + 1 
                    WHERE id_produto = %s
                """, (id_produto,))

            return resultado

    @staticmethod
    def cancelar(id_cliente, id_produto):

        with Database.get_cursor() as cursor:
            cursor.execute("""
                DELETE FROM Reserva 
                WHERE id_cliente = %s AND id_prod = %s
            """, (id_cliente, id_produto))
            return True

    @staticmethod
    def listar_por_produto(id_produto):

        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.id_cliente,
                    r.id_prod,
                    r.data_reserva,
                    r.status,
                    p.nome_completo as cliente_nome,
                    p.email as cliente_email,
                    p.telefone as cliente_telefone
                FROM Reserva r
                JOIN Cliente c ON r.id_cliente = c.cpf
                JOIN Pessoa p ON c.cpf = p.cpf
                WHERE r.id_prod = %s
                ORDER BY r.data_reserva DESC
            """, (id_produto,))
            return cursor.fetchall()

    @staticmethod
    def listar_por_cliente(cpf_cliente):

        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    r.id_cliente,
                    r.id_prod,
                    r.data_reserva,
                    r.status,
                    prod.nome_produto,
                    prod.categoria,
                    prod.preco_venda
                FROM Reserva r
                JOIN Produto prod ON r.id_prod = prod.id_produto
                WHERE r.id_cliente = %s
                ORDER BY r.data_reserva DESC
            """, (cpf_cliente,))
            return cursor.fetchall()