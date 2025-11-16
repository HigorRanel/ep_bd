from app.utils.database import Database

class Barbeiro:
    @staticmethod
    def criar(cpf, data_inicio):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Barbeiro (cpf, data_inicio)
                VALUES (%s, %s)
                RETURNING cpf
            """, (cpf, data_inicio))
            return cursor.fetchone()

    @staticmethod
    def criar_chefe(cpf_barbeiro):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Barbeiro_Chefe (cpf_barbeiro)
                VALUES (%s)
                RETURNING id_barbeiro_chefe
            """, (cpf_barbeiro,))
            return cursor.fetchone()

    @staticmethod
    def listar_todos():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT p.*, b.data_inicio,
                       CASE WHEN bc.id_barbeiro_chefe IS NOT NULL THEN true ELSE false END as is_chefe
                FROM Barbeiro b
                JOIN Pessoa p ON b.cpf = p.cpf
                LEFT JOIN Barbeiro_Chefe bc ON b.cpf = bc.cpf_barbeiro
                ORDER BY p.nome_completo
            """)
            return cursor.fetchall()

    @staticmethod
    def buscar_por_cpf(cpf):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT p.*, b.data_inicio,
                       CASE WHEN bc.id_barbeiro_chefe IS NOT NULL THEN true ELSE false END as is_chefe
                FROM Barbeiro b
                JOIN Pessoa p ON b.cpf = p.cpf
                LEFT JOIN Barbeiro_Chefe bc ON b.cpf = bc.cpf_barbeiro
                WHERE b.cpf = %s
            """, (cpf,))
            return cursor.fetchone()

    @staticmethod
    def verificar_chefe(cpf):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT id_barbeiro_chefe FROM Barbeiro_Chefe WHERE cpf_barbeiro = %s
            """, (cpf,))
            return cursor.fetchone() is not None

    @staticmethod
    def listar_servicos(cpf_barbeiro):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT s.*
                FROM Servico s
                JOIN Oferece o ON s.id_servico = o.id_servico
                WHERE o.cpf_barbeiro = %s
                ORDER BY s.nome
            """, (cpf_barbeiro,))
            return cursor.fetchall()
