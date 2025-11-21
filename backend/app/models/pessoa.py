from backend.app.utils.database import Database
import bcrypt

class Pessoa:
    @staticmethod
    def criar(cpf, nome_completo, data_nascimento, telefone, endereco, email, senha):
        senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Pessoa (cpf, nome_completo, data_nascimento, telefone, endereco, email, senha)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING cpf
            """, (cpf, nome_completo, data_nascimento, telefone, endereco, email, senha_hash))
            return cursor.fetchone()

    @staticmethod
    def buscar_por_cpf(cpf):
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Pessoa WHERE cpf = %s", (cpf,))
            return cursor.fetchone()

    @staticmethod
    def buscar_por_email(email):
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Pessoa WHERE email = %s", (email,))
            return cursor.fetchone()

    @staticmethod
    def verificar_senha(senha, senha_hash):
        return bcrypt.checkpw(senha.encode('utf-8'), senha_hash.encode('utf-8'))

    @staticmethod
    def atualizar(cpf, dados):
        campos = []
        valores = []

        for campo, valor in dados.items():
            if campo != 'cpf' and valor is not None:
                campos.append(f"{campo} = %s")
                valores.append(valor)

        if not campos:
            return None

        valores.append(cpf)
        query = f"UPDATE Pessoa SET {', '.join(campos)} WHERE cpf = %s RETURNING *"

        with Database.get_cursor() as cursor:
            cursor.execute(query, valores)
            return cursor.fetchone()
        
    @staticmethod
    def atualizar_senha(cpf, nova_senha):
        senha_hash = bcrypt.hashpw(nova_senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        with Database.get_cursor() as cursor:
            cursor.execute(
                "UPDATE Pessoa SET senha = %s WHERE cpf = %s", 
                (senha_hash, cpf)
            )
            return True    
        
    @staticmethod
    def validar_para_recuperacao(cpf, email, data_nascimento):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT cpf FROM Pessoa 
                WHERE cpf = %s AND email = %s AND data_nascimento = %s
            """, (cpf, email, data_nascimento))
            return cursor.fetchone() is not None