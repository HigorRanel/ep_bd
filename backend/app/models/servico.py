from backend.app.utils.database import Database


class Servico:
    @staticmethod
    def criar(nome, preco, duracao_estimada_min, descricao=None):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Servico (nome, preco, duracao_estimada_min, descricao)
                VALUES (%s, %s, %s, %s)
                RETURNING id_servico
            """, (nome, preco, duracao_estimada_min, descricao))
            return cursor.fetchone()

    @staticmethod
    def associar_barbeiro(id_servico, cpf_barbeiro):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Oferece (id_servico, cpf_barbeiro)
                VALUES (%s, %s)
            """, (id_servico, cpf_barbeiro))
            return True

    @staticmethod
    def listar_todos():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    s.*, 
                    p.nome_completo as nome_barbeiro
                FROM Servico s
                LEFT JOIN Oferece o ON s.id_servico = o.id_servico
                LEFT JOIN Barbeiro b ON o.cpf_barbeiro = b.cpf
                LEFT JOIN Pessoa p ON b.cpf = p.cpf
                ORDER BY s.nome
                """)
            
            rows = cursor.fetchall()
            
            servicos_map = {}
            
            for row in rows:
                id_servico = row['id_servico']
                
                if id_servico not in servicos_map:

                    dados_servico = dict(row) 
                    
                    del dados_servico['nome_barbeiro'] 
                    
                    dados_servico['barbeiros'] = []
                    
                    servicos_map[id_servico] = dados_servico

                if row['nome_barbeiro']:
                    servicos_map[id_servico]['barbeiros'].append(row['nome_barbeiro'])
            
            return list(servicos_map.values())

    @staticmethod
    def buscar_por_id(id_servico):
        with Database.get_cursor() as cursor:
            cursor.execute("SELECT * FROM Servico WHERE id_servico = %s", (id_servico,))
            return cursor.fetchone()

    @staticmethod
    def atualizar(id_servico, dados):
        campos = []
        valores = []

        for campo, valor in dados.items():
            if campo != 'id_servico' and valor is not None:
                campos.append(f"{campo} = %s")
                valores.append(valor)

        if not campos:
            return None

        valores.append(id_servico)
        query = f"UPDATE Servico SET {', '.join(campos)} WHERE id_servico = %s RETURNING *"

        with Database.get_cursor() as cursor:
            cursor.execute(query, valores)
            return cursor.fetchone()

    @staticmethod
    def deletar(id_servico):
        with Database.get_cursor() as cursor:
            cursor.execute("DELETE FROM Servico WHERE id_servico = %s", (id_servico,))
            return True
