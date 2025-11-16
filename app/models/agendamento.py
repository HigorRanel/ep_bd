from app.utils.database import Database


class Agendamento:
    @staticmethod
    def criar(data_hora, cpf_cliente, cpf_barbeiro, id_servico, cpf_origem, status='pendente'):
        with Database.get_cursor() as cursor:
            # Criar agendamento
            cursor.execute("""
                INSERT INTO Agendamento (data_hora_agendamento, status, cpf_origem, client_id, barbeiro_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id_agendamento
            """, (data_hora, status, cpf_origem, cpf_cliente, cpf_barbeiro))

            id_agendamento = cursor.fetchone()['id_agendamento']

            # Associar serviço
            cursor.execute("""
                INSERT INTO Contem (id_serv, id_agen)
                VALUES (%s, %s)
            """, (id_servico, id_agendamento))

            return {'id_agendamento': id_agendamento}

    @staticmethod
    def listar_por_barbeiro(cpf_barbeiro, data_inicio=None, data_fim=None):
        query = """
            SELECT a.*, s.nome as servico_nome, s.preco, s.duracao_estimada_min,
                   pc.nome_completo as cliente_nome, pc.telefone as cliente_telefone
            FROM Agendamento a
            JOIN Contem ct ON a.id_agendamento = ct.id_agen
            JOIN Servico s ON ct.id_serv = s.id_servico
            JOIN Cliente c ON a.client_id = c.cpf
            JOIN Pessoa pc ON c.cpf = pc.cpf
            WHERE a.barbeiro_id = %s
        """

        params = [cpf_barbeiro]

        if data_inicio:
            query += " AND a.data_hora_agendamento >= %s"
            params.append(data_inicio)

        if data_fim:
            query += " AND a.data_hora_agendamento <= %s"
            params.append(data_fim)

        query += " ORDER BY a.data_hora_agendamento"

        with Database.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    @staticmethod
    def buscar_por_id(id_agendamento):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT a.*, s.nome as servico_nome, s.preco, s.duracao_estimada_min,
                       pc.nome_completo as cliente_nome, pb.nome_completo as barbeiro_nome
                FROM Agendamento a
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                JOIN Cliente c ON a.client_id = c.cpf
                JOIN Pessoa pc ON c.cpf = pc.cpf
                JOIN Barbeiro b ON a.barbeiro_id = b.cpf
                JOIN Pessoa pb ON b.cpf = pb.cpf
                WHERE a.id_agendamento = %s
            """, (id_agendamento,))
            return cursor.fetchone()

    @staticmethod
    def atualizar_status(id_agendamento, novo_status):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                UPDATE Agendamento
                SET status = %s
                WHERE id_agendamento = %s
                RETURNING *
            """, (novo_status, id_agendamento))
            return cursor.fetchone()

    @staticmethod
    def deletar(id_agendamento):
        with Database.get_cursor() as cursor:
            cursor.execute("DELETE FROM Agendamento WHERE id_agendamento = %s", (id_agendamento,))
            return True

    @staticmethod
    def criar_avaliacao(id_agendamento, nota, comentario=None):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Avaliacao (id_agen, nota, comentario)
                VALUES (%s, %s, %s)
                RETURNING *
            """, (id_agendamento, nota, comentario))
            return cursor.fetchone()

    @staticmethod
    def atualizar_servico_agendamento(id_agendamento, novo_id_servico):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                UPDATE Contem 
                SET id_serv = %s 
                WHERE id_agen = %s
            """, (novo_id_servico, id_agendamento))
            return True

    @staticmethod
    def calcular_media_avaliacoes_barbeiro(cpf_barbeiro):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT AVG(av.nota) as media_nota, COUNT(*) as total_avaliacoes
                FROM Avaliacao av
                JOIN Agendamento a ON av.id_agen = a.id_agendamento
                WHERE a.barbeiro_id = %s
            """, (cpf_barbeiro,))
            return cursor.fetchone()

    @staticmethod
    def buscar_servico_agendamento(id_agendamento):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                 SELECT s.* 
                 FROM Servico s
                 JOIN Contem c ON s.id_servico = c.id_serv
                 WHERE c.id_agen = %s
             """, (id_agendamento,))
            return cursor.fetchone()

    @staticmethod
    def buscar_avaliacao(id_agendamento):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                 SELECT * FROM Avaliacao WHERE id_agen = %s
             """, (id_agendamento,))
            return cursor.fetchone()

    @staticmethod
    def listar_avaliacoes_barbeiro(cpf_barbeiro):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT av.*, a.data_hora_agendamento, 
                       pc.nome_completo as cliente_nome,
                       s.nome as servico_nome
                FROM Avaliacao av
                JOIN Agendamento a ON av.id_agen = a.id_agendamento
                JOIN Cliente c ON a.client_id = c.cpf
                JOIN Pessoa pc ON c.cpf = pc.cpf
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                WHERE a.barbeiro_id = %s
                ORDER BY a.data_hora_agendamento DESC
            """, (cpf_barbeiro,))
            return cursor.fetchall()