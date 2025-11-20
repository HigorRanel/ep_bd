from backend.app.utils.database import Database


class Cliente:
    @staticmethod
    def criar(cpf):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Cliente (cpf)
                VALUES (%s)
                RETURNING cpf
            """, (cpf,))
            return cursor.fetchone()

    @staticmethod
    def listar_todos():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT p.*, c.cpf as cliente_cpf
                FROM Cliente c
                JOIN Pessoa p ON c.cpf = p.cpf
                ORDER BY p.nome_completo
            """)
            return cursor.fetchall()

    @staticmethod
    def buscar_por_cpf(cpf):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT *
                FROM Cliente c
                JOIN Pessoa p ON c.cpf = p.cpf
                WHERE c.cpf = %s
            """, (cpf,))
            return cursor.fetchone()

    @staticmethod
    def buscar_agendamentos(cpf_cliente):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT a.*, s.nome as servico_nome, s.preco, s.duracao_estimada_min,
                       pb.nome_completo as barbeiro_nome
                FROM Agendamento a
                JOIN Cliente c ON a.client_id = c.cpf
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                JOIN Barbeiro b ON a.barbeiro_id = b.cpf
                JOIN Pessoa pb ON b.cpf = pb.cpf
                WHERE c.cpf = %s
                ORDER BY a.data_hora_agendamento DESC
            """, (cpf_cliente,))
            return cursor.fetchall()