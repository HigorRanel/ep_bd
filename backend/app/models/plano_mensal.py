from backend.app.utils.database import Database


class PlanoMensal:
    @staticmethod
    def criar(id_barbeiro_chefe, servicos, desconto=0.00):
        """
        Cria um novo plano mensal com desconto

        Args:
            id_barbeiro_chefe: ID do barbeiro chefe
            servicos: lista de dicts com {id_servico, quantidade}
            desconto: percentual de desconto (0-100), padrão 0
        """
        with Database.get_cursor() as cursor:
            # Validar desconto
            desconto = float(desconto)
            if desconto < 0 or desconto > 100:
                raise ValueError('Desconto deve ser entre 0 e 100')

            # Criar plano
            cursor.execute("""
                INSERT INTO Plano_Mensal (id_barbeiro_chefe)
                VALUES (%s)
                RETURNING id_plano_mensal
            """, (id_barbeiro_chefe,))

            id_plano = cursor.fetchone()['id_plano_mensal']

            # Adicionar serviços ao plano COM DESCONTO
            for servico in servicos:
                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade, desconto)
                    VALUES (%s, %s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade'], desconto))

            # Calcular valores para retorno
            valores = PlanoMensal.calcular_desconto_plano(id_plano)

            return {
                'id_plano_mensal': id_plano,
                'desconto_aplicado': desconto,
                **valores
            }

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
    def atualizar(id_plano, servicos, desconto=None):
        """
        Atualiza um plano mensal

        Args:
            id_plano: ID do plano
            servicos: lista de dicts com {id_servico, quantidade}
            desconto: percentual de desconto (opcional, mantém o existente se None)
        """
        with Database.get_cursor() as cursor:
            # Se desconto foi fornecido, validar
            if desconto is not None:
                desconto = float(desconto)
                if desconto < 0 or desconto > 100:
                    raise ValueError('Desconto deve ser entre 0 e 100')
            else:
                # Buscar desconto atual
                cursor.execute("""
                    SELECT desconto FROM Possui 
                    WHERE id_plano = %s 
                    LIMIT 1
                """, (id_plano,))
                resultado = cursor.fetchone()
                desconto = float(resultado['desconto']) if resultado else 0.00

            # Remover serviços antigos
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))

            # Adicionar novos serviços COM DESCONTO
            for servico in servicos:
                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade, desconto)
                    VALUES (%s, %s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade'], desconto))

            # Calcular valores atualizados
            valores = PlanoMensal.calcular_desconto_plano(id_plano)

            return {
                'id_plano_mensal': id_plano,
                'message': 'Plano atualizado com sucesso',
                'desconto_aplicado': desconto,
                **valores
            }

    # NOVO: Deletar plano
    @staticmethod
    def deletar(id_plano):
        with Database.get_cursor() as cursor:
            # Deletar serviços do plano
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))
            # Deletar plano
            cursor.execute("DELETE FROM Plano_Mensal WHERE id_plano_mensal = %s", (id_plano,))
            return True

    @staticmethod
    def calcular_desconto_plano(id_plano):
        """Calcula o desconto do plano em relação aos preços individuais"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    SUM(s.preco * ps.quantidade) as valor_sem_desconto,
                    ps.desconto
                FROM Servico s
                JOIN Possui ps ON s.id_servico = ps.id_serv
                WHERE ps.id_plano = %s
                GROUP BY ps.desconto
            """, (id_plano,))

            resultado = cursor.fetchone()
            if not resultado:
                return {'valor_sem_desconto': 0, 'desconto_percentual': 0, 'valor_com_desconto': 0}

            valor_sem_desconto = float(resultado['valor_sem_desconto'] or 0)
            desconto_percentual = float(resultado['desconto'] or 0)
            valor_desconto = valor_sem_desconto * (desconto_percentual / 100)
            valor_com_desconto = valor_sem_desconto - valor_desconto

            return {
                'valor_sem_desconto': valor_sem_desconto,
                'desconto_percentual': desconto_percentual,
                'valor_desconto': valor_desconto,
                'valor_com_desconto': valor_com_desconto
            }

    @staticmethod
    def verificar_uso_servicos_plano(cpf_cliente, id_plano):
        """Verifica quantos serviços do plano o cliente já usou no período ativo"""
        with Database.get_cursor() as cursor:
            # Buscar assinatura ativa
            cursor.execute("""
                SELECT data_inicio, data_fim
                FROM Assina
                WHERE id_cliente = %s AND id_plano = %s
                AND data_fim >= CURRENT_DATE
                ORDER BY data_fim DESC
                LIMIT 1
            """, (cpf_cliente, id_plano))

            assinatura = cursor.fetchone()
            if not assinatura:
                return None

            # Buscar serviços do plano com quantidades
            cursor.execute("""
                SELECT ps.id_serv, ps.quantidade, s.nome
                FROM Possui ps
                JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE ps.id_plano = %s
            """, (id_plano,))

            servicos_plano = cursor.fetchall()

            # Para cada serviço, contar quantos agendamentos foram feitos no período
            uso_servicos = []
            for servico in servicos_plano:
                cursor.execute("""
                    SELECT COUNT(*) as usado
                    FROM Agendamento a
                    JOIN Contem c ON a.id_agendamento = c.id_agen
                    WHERE a.client_id = %s
                    AND c.id_serv = %s
                    AND a.data_hora_agendamento >= %s
                    AND a.data_hora_agendamento <= %s
                    AND a.status IN ('concluido', 'confirmado', 'pendente')
                """, (cpf_cliente, servico['id_serv'],
                      assinatura['data_inicio'], assinatura['data_fim']))

                usado = cursor.fetchone()['usado']

                uso_servicos.append({
                    'id_servico': servico['id_serv'],
                    'nome_servico': servico['nome'],
                    'quantidade_plano': servico['quantidade'],
                    'quantidade_usada': usado,
                    'quantidade_disponivel': servico['quantidade'] - usado,
                    'esgotado': usado >= servico['quantidade']
                })

            return {
                'id_plano': id_plano,
                'data_inicio': assinatura['data_inicio'],
                'data_fim': assinatura['data_fim'],
                'servicos': uso_servicos
            }

    @staticmethod
    def listar_planos_proximos_vencimento(cpf_cliente, dias=7):
        """Lista planos que vencerão nos próximos N dias"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.id_plano,
                    a.data_inicio,
                    a.data_fim,
                    pm.id_plano_mensal,
                    DATE_PART('day', a.data_fim - CURRENT_DATE) as dias_restantes
                FROM Assina a
                JOIN Plano_Mensal pm ON a.id_plano = pm.id_plano_mensal
                WHERE a.id_cliente = %s
                AND a.data_fim >= CURRENT_DATE
                AND a.data_fim <= CURRENT_DATE + INTERVAL '%s days'
                ORDER BY a.data_fim ASC
            """, (cpf_cliente, dias))

            return cursor.fetchall()

    @staticmethod
    def pode_agendar_com_plano(cpf_cliente, id_servico):
        """Verifica se o cliente pode agendar um serviço usando um plano ativo"""
        with Database.get_cursor() as cursor:
            # Buscar planos ativos que contenham este serviço
            cursor.execute("""
                SELECT 
                    a.id_plano,
                    ps.quantidade as quantidade_plano
                FROM Assina a
                JOIN Plano_Mensal pm ON a.id_plano = pm.id_plano_mensal
                JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                WHERE a.id_cliente = %s
                AND ps.id_serv = %s
                AND a.data_fim >= CURRENT_DATE
                ORDER BY a.data_fim DESC
                LIMIT 1
            """, (cpf_cliente, id_servico))

            plano = cursor.fetchone()
            if not plano:
                return {'pode_usar_plano': False, 'motivo': 'Nenhum plano ativo com este serviço'}

            # Verificar uso
            uso = PlanoMensal.verificar_uso_servicos_plano(cpf_cliente, plano['id_plano'])
            if not uso:
                return {'pode_usar_plano': False, 'motivo': 'Erro ao verificar uso do plano'}

            # Encontrar o serviço específico
            servico_uso = next((s for s in uso['servicos'] if s['id_servico'] == id_servico), None)

            if not servico_uso:
                return {'pode_usar_plano': False, 'motivo': 'Serviço não encontrado no plano'}

            if servico_uso['esgotado']:
                return {
                    'pode_usar_plano': False,
                    'motivo': f"Limite do plano atingido ({servico_uso['quantidade_plano']} serviços)",
                    'uso': servico_uso
                }

            return {
                'pode_usar_plano': True,
                'id_plano': plano['id_plano'],
                'uso': servico_uso
            }