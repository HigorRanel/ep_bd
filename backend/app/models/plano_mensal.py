from backend.app.utils.database import Database


class PlanoMensal:
    @staticmethod
    def criar(id_barbeiro_chefe, servicos):
        """
        servicos: lista de dicts com {id_servico, quantidade}
        """
        with Database.get_cursor() as cursor:
            # Criar plano
            cursor.execute("""
                INSERT INTO Plano_Mensal (id_barbeiro_chefe)
                VALUES (%s)
                RETURNING id_plano_mensal
            """, (id_barbeiro_chefe,))

            id_plano = cursor.fetchone()['id_plano_mensal']

            # Adicionar serviços ao plano
            for servico in servicos:
                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade)
                    VALUES (%s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade']))

            return {'id_plano_mensal': id_plano}

    @staticmethod
    def listar_todos():
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT pm.*, p.nome_completo as criador_nome,
                       json_agg(json_build_object(
                           'id_servico', s.id_servico,
                           'nome', s.nome,
                           'quantidade', ps.quantidade
                       )) as servicos
                FROM Plano_Mensal pm
                JOIN Barbeiro_Chefe bc ON pm.id_barbeiro_chefe = bc.id_barbeiro_chefe
                JOIN Pessoa p ON bc.cpf_barbeiro = p.cpf
                LEFT JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                LEFT JOIN Servico s ON ps.id_serv = s.id_servico
                GROUP BY pm.id_plano_mensal, p.nome_completo
                ORDER BY pm.id_plano_mensal DESC
            """)
            return cursor.fetchall()

    @staticmethod
    def assinar_plano(cpf_cliente, id_plano, data_inicio, data_fim):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Assina (id_cliente, id_plano, data_inicio, data_fim)
                VALUES (%s, %s, %s, %s)
            """, (cpf_cliente, id_plano, data_inicio, data_fim))
            return True

    @staticmethod
    def listar_assinaturas_cliente(cpf_cliente):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT a.*, pm.id_plano_mensal,
                       json_agg(json_build_object(
                           'id_servico', s.id_servico,
                           'nome', s.nome,
                           'quantidade', ps.quantidade
                       )) as servicos
                FROM Assina a
                JOIN Plano_Mensal pm ON a.id_plano = pm.id_plano_mensal
                LEFT JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                LEFT JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE a.id_cliente = %s
                GROUP BY a.id_cliente, a.id_plano, a.data_inicio, a.data_fim, pm.id_plano_mensal
                ORDER BY a.data_fim DESC
            """, (cpf_cliente,))
            return cursor.fetchall()

    @staticmethod
    def cancelar_assinatura(cpf_cliente, id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                DELETE FROM Assina 
                WHERE id_cliente = %s AND id_plano = %s
            """, (cpf_cliente, id_plano))
            return True

    @staticmethod
    def verificar_assinatura_ativa(cpf_cliente, id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM Assina 
                WHERE id_cliente = %s AND id_plano = %s
                AND data_fim >= CURRENT_DATE
            """, (cpf_cliente, id_plano))
            return cursor.fetchone()

    @staticmethod
    def calcular_valor_total_plano(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                   SELECT SUM(s.preco * ps.quantidade) as valor_total
                   FROM Servico s
                   JOIN Possui ps ON s.id_servico = ps.id_serv
                   WHERE ps.id_plano = %s
               """, (id_plano,))
            resultado = cursor.fetchone()
            return resultado['valor_total'] if resultado else 0

    @staticmethod
    def atualizar_quantidade_servico(id_plano, id_servico, nova_quantidade):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                    UPDATE Possui 
                    SET quantidade = %s 
                    WHERE id_plano = %s AND id_serv = %s
                """, (nova_quantidade, id_plano, id_servico))
            return True

    @staticmethod
    def adicionar_servico_plano(id_plano, id_servico, quantidade):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                INSERT INTO Possui (id_serv, id_plano, quantidade)
                VALUES (%s, %s, %s)
                ON CONFLICT (id_serv, id_plano) 
                DO UPDATE SET quantidade = EXCLUDED.quantidade
            """, (id_servico, id_plano, quantidade))
            return True

    @staticmethod
    def buscar_servicos_plano(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                    SELECT s.*, ps.quantidade
                    FROM Servico s
                    JOIN Possui ps ON s.id_servico = ps.id_serv
                    WHERE ps.id_plano = %s
                    ORDER BY s.nome
                """, (id_plano,))
            return cursor.fetchall()

    @staticmethod
    def remover_servico_plano(id_plano, id_servico):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                DELETE FROM Possui 
                WHERE id_plano = %s AND id_serv = %s
            """, (id_plano, id_servico))
            return True

    # NOVO: Contar assinaturas ativas
    @staticmethod
    def contar_assinaturas_ativas(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM Assina
                WHERE id_plano = %s AND data_fim >= CURRENT_DATE
            """, (id_plano,))
            return cursor.fetchone()['total']

    # NOVO: Contar todas assinaturas
    @staticmethod
    def contar_assinaturas(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM Assina
                WHERE id_plano = %s
            """, (id_plano,))
            return cursor.fetchone()['total']

    # NOVO: Atualizar plano
    @staticmethod
    def atualizar(id_plano, servicos):
        with Database.get_cursor() as cursor:
            # Remover serviços antigos
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))

            # Adicionar novos serviços
            for servico in servicos:
                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade)
                    VALUES (%s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade']))

            return {'id_plano_mensal': id_plano, 'message': 'Plano atualizado com sucesso'}

    # NOVO: Deletar plano
    @staticmethod
    def deletar(id_plano):
        with Database.get_cursor() as cursor:
            # Deletar serviços do plano
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))
            # Deletar plano
            cursor.execute("DELETE FROM Plano_Mensal WHERE id_plano_mensal = %s", (id_plano,))
            return True