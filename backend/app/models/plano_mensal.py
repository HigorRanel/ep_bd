from backend.app.utils.database import Database


class PlanoMensal:
    @staticmethod
    def criar(id_barbeiro_chefe, servicos, desconto=0.00):
        """
        Cria um novo plano mensal com desconto POR SERVIÇO

        Args:
            id_barbeiro_chefe: ID do barbeiro chefe
            servicos: lista de dicts com {id_servico, quantidade}
            desconto: percentual de desconto para TODOS os serviços (0-100), padrão 0
        """
        with Database.get_cursor() as cursor:
            # Validar desconto
            desconto = float(desconto)
            if desconto < 0 or desconto > 100:
                raise ValueError('Desconto deve ser entre 0 e 100')

            # Criar plano (SEM desconto_percentual na tabela Plano_Mensal)
            cursor.execute("""
                INSERT INTO Plano_Mensal (id_barbeiro_chefe)
                VALUES (%s)
                RETURNING id_plano_mensal
            """, (id_barbeiro_chefe,))

            id_plano = cursor.fetchone()['id_plano_mensal']

            # Adicionar serviços ao plano COM DESCONTO INDIVIDUAL
            for servico in servicos:
                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade, desconto)
                    VALUES (%s, %s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade'], desconto))

            # Calcular valores para retorno
            valores = PlanoMensal.calcular_valores_plano(id_plano)

            return {
                'id_plano_mensal': id_plano,
                'desconto_aplicado': desconto,
                **valores
            }

    @staticmethod
    def listar_todos():
        """Lista todos os planos com informações completas"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    pm.id_plano_mensal,
                    pm.id_barbeiro_chefe,
                    p.nome_completo as criador_nome,
                    json_agg(
                        json_build_object(
                            'id_servico', s.id_servico,
                            'nome', s.nome,
                            'preco', s.preco,
                            'quantidade', ps.quantidade,
                            'desconto', ps.desconto
                        ) ORDER BY s.nome
                    ) FILTER (WHERE s.id_servico IS NOT NULL) as servicos
                FROM Plano_Mensal pm
                JOIN Barbeiro_Chefe bc ON pm.id_barbeiro_chefe = bc.id_barbeiro_chefe
                JOIN Pessoa p ON bc.cpf_barbeiro = p.cpf
                LEFT JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                LEFT JOIN Servico s ON ps.id_serv = s.id_servico
                GROUP BY pm.id_plano_mensal, pm.id_barbeiro_chefe, p.nome_completo
                ORDER BY pm.id_plano_mensal DESC
            """)

            planos = cursor.fetchall()

            # Adicionar cálculos de valores para cada plano
            for plano in planos:
                if plano['servicos']:
                    valores = PlanoMensal.calcular_valores_plano(plano['id_plano_mensal'])
                    plano.update(valores)

            return planos

    @staticmethod
    def buscar_por_id(id_plano):
        """Busca um plano específico com todos os detalhes"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    pm.id_plano_mensal,
                    pm.id_barbeiro_chefe,
                    p.nome_completo as criador_nome,
                    json_agg(
                        json_build_object(
                            'id_servico', s.id_servico,
                            'nome', s.nome,
                            'preco', s.preco,
                            'quantidade', ps.quantidade,
                            'desconto', ps.desconto
                        ) ORDER BY s.nome
                    ) FILTER (WHERE s.id_servico IS NOT NULL) as servicos
                FROM Plano_Mensal pm
                JOIN Barbeiro_Chefe bc ON pm.id_barbeiro_chefe = bc.id_barbeiro_chefe
                JOIN Pessoa p ON bc.cpf_barbeiro = p.cpf
                LEFT JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                LEFT JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE pm.id_plano_mensal = %s
                GROUP BY pm.id_plano_mensal, pm.id_barbeiro_chefe, p.nome_completo
            """, (id_plano,))

            plano = cursor.fetchone()
            if plano and plano['servicos']:
                valores = PlanoMensal.calcular_valores_plano(id_plano)
                plano.update(valores)

            return plano

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
        """Lista assinaturas do cliente com informações completas do plano"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.id_cliente,
                    a.id_plano,
                    a.data_inicio,
                    a.data_fim,
                    pm.id_plano_mensal,
                    json_agg(
                        json_build_object(
                            'id_servico', s.id_servico,
                            'nome', s.nome,
                            'preco', s.preco,
                            'quantidade', ps.quantidade,
                            'desconto', ps.desconto
                        ) ORDER BY s.nome
                    ) FILTER (WHERE s.id_servico IS NOT NULL) as servicos
                FROM Assina a
                JOIN Plano_Mensal pm ON a.id_plano = pm.id_plano_mensal
                LEFT JOIN Possui ps ON pm.id_plano_mensal = ps.id_plano
                LEFT JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE a.id_cliente = %s
                GROUP BY a.id_cliente, a.id_plano, a.data_inicio, a.data_fim, pm.id_plano_mensal
                ORDER BY a.data_fim DESC
            """, (cpf_cliente,))

            assinaturas = cursor.fetchall()

            # Adicionar cálculos para cada assinatura
            for assinatura in assinaturas:
                if assinatura['servicos']:
                    valores = PlanoMensal.calcular_valores_plano(assinatura['id_plano'])
                    assinatura.update(valores)

            return assinaturas

    @staticmethod
    def calcular_valores_plano(id_plano):
        """
        Calcula os valores do plano baseado nos descontos INDIVIDUAIS de cada serviço

        Returns:
            dict com valor_sem_desconto, valor_desconto_total, valor_com_desconto, desconto_medio
        """
        with Database.get_cursor() as cursor:
            # Buscar todos os serviços do plano com seus descontos individuais
            cursor.execute("""
                SELECT 
                    s.preco,
                    ps.quantidade,
                    ps.desconto
                FROM Possui ps
                JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE ps.id_plano = %s
            """, (id_plano,))

            servicos = cursor.fetchall()

            if not servicos:
                return {
                    'valor_sem_desconto': 0,
                    'valor_desconto_total': 0,
                    'valor_com_desconto': 0,
                    'desconto_medio': 0
                }

            valor_sem_desconto = 0
            valor_com_desconto = 0

            # Calcular para cada serviço
            for servico in servicos:
                preco = float(servico['preco'])
                quantidade = int(servico['quantidade'])
                desconto_percentual = float(servico['desconto'] or 0)

                # Valor deste serviço sem desconto
                valor_servico_sem_desconto = preco * quantidade

                # Valor deste serviço com desconto
                desconto_servico = valor_servico_sem_desconto * (desconto_percentual / 100)
                valor_servico_com_desconto = valor_servico_sem_desconto - desconto_servico

                valor_sem_desconto += valor_servico_sem_desconto
                valor_com_desconto += valor_servico_com_desconto

            # Desconto total em reais
            valor_desconto_total = valor_sem_desconto - valor_com_desconto

            # Desconto médio percentual
            desconto_medio = (valor_desconto_total / valor_sem_desconto * 100) if valor_sem_desconto > 0 else 0

            return {
                'valor_sem_desconto': round(valor_sem_desconto, 2),
                'valor_desconto_total': round(valor_desconto_total, 2),
                'valor_com_desconto': round(valor_com_desconto, 2),
                'desconto_medio': round(desconto_medio, 2)
            }

    @staticmethod
    def atualizar(id_plano, servicos, desconto=None):
        """
        Atualiza um plano mensal

        Args:
            id_plano: ID do plano
            servicos: lista de dicts com {id_servico, quantidade, desconto (opcional)}
            desconto: desconto padrão para serviços que não especificarem (opcional)
        """
        with Database.get_cursor() as cursor:
            # Remover serviços antigos
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))

            # Adicionar novos serviços
            for servico in servicos:
                # Se o serviço tem desconto próprio, usa ele, senão usa o padrão
                desconto_servico = servico.get('desconto', desconto if desconto is not None else 0)
                desconto_servico = float(desconto_servico)

                if desconto_servico < 0 or desconto_servico > 100:
                    raise ValueError('Desconto deve ser entre 0 e 100')

                cursor.execute("""
                    INSERT INTO Possui (id_serv, id_plano, quantidade, desconto)
                    VALUES (%s, %s, %s, %s)
                """, (servico['id_servico'], id_plano, servico['quantidade'], desconto_servico))

            # Calcular valores atualizados
            valores = PlanoMensal.calcular_valores_plano(id_plano)

            return {
                'id_plano_mensal': id_plano,
                'message': 'Plano atualizado com sucesso',
                **valores
            }

    @staticmethod
    def deletar(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("DELETE FROM Possui WHERE id_plano = %s", (id_plano,))
            cursor.execute("DELETE FROM Plano_Mensal WHERE id_plano_mensal = %s", (id_plano,))
            return True

    # ... (continua com os outros métodos)
    @staticmethod
    def pode_agendar_com_plano(cpf_cliente, id_servico):
        """Verifica se o cliente pode agendar um serviço usando um plano ativo"""
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.id_plano,
                    ps.quantidade as quantidade_plano,
                    ps.desconto as desconto_servico
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

            uso = PlanoMensal.verificar_uso_servicos_plano(cpf_cliente, plano['id_plano'])
            if not uso:
                return {'pode_usar_plano': False, 'motivo': 'Erro ao verificar uso do plano'}

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
                'desconto_percentual': float(plano['desconto_servico'] or 0),
                'uso': servico_uso
            }

    @staticmethod
    def verificar_uso_servicos_plano(cpf_cliente, id_plano):
        """Verifica quantos serviços do plano o cliente já usou"""
        with Database.get_cursor() as cursor:
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

            cursor.execute("""
                SELECT ps.id_serv, ps.quantidade, ps.desconto, s.nome, s.preco
                FROM Possui ps
                JOIN Servico s ON ps.id_serv = s.id_servico
                WHERE ps.id_plano = %s
            """, (id_plano,))

            servicos_plano = cursor.fetchall()

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
                    'esgotado': usado >= servico['quantidade'],
                    'desconto_percentual': float(servico['desconto'] or 0)
                })

            return {
                'id_plano': id_plano,
                'data_inicio': assinatura['data_inicio'],
                'data_fim': assinatura['data_fim'],
                'servicos': uso_servicos
            }

    @staticmethod
    def listar_planos_proximos_vencimento(cpf_cliente, dias=7):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.id_plano,
                    a.data_inicio,
                    a.data_fim,
                    pm.id_plano_mensal,
                    (a.data_fim::DATE - CURRENT_DATE) as dias_restantes
                FROM Assina a
                JOIN Plano_Mensal pm ON a.id_plano = pm.id_plano_mensal
                WHERE a.id_cliente = %s
                AND a.data_fim::DATE >= CURRENT_DATE
                AND (a.data_fim::DATE - CURRENT_DATE) <= %s
                ORDER BY a.data_fim ASC
            """, (cpf_cliente, dias))
            return cursor.fetchall()

    @staticmethod
    def atualizar_desconto_plano(id_plano, novo_desconto):
        """Atualiza o desconto de TODOS os serviços do plano"""
        with Database.get_cursor() as cursor:
            desconto = float(novo_desconto)
            if desconto < 0 or desconto > 100:
                raise ValueError('Desconto deve ser entre 0 e 100')

            cursor.execute("""
                UPDATE Possui
                SET desconto = %s
                WHERE id_plano = %s
            """, (desconto, id_plano))

            valores = PlanoMensal.calcular_valores_plano(id_plano)

            return {
                'message': 'Desconto atualizado com sucesso',
                'desconto_percentual': desconto,
                **valores
            }

    @staticmethod
    def buscar_servicos_plano(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT s.*, ps.quantidade, ps.desconto
                FROM Servico s
                JOIN Possui ps ON s.id_servico = ps.id_serv
                WHERE ps.id_plano = %s
                ORDER BY s.nome
            """, (id_plano,))
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
        valores = PlanoMensal.calcular_valores_plano(id_plano)
        return valores['valor_com_desconto']

    @staticmethod
    def contar_assinaturas_ativas(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM Assina
                WHERE id_plano = %s AND data_fim >= CURRENT_DATE
            """, (id_plano,))
            return cursor.fetchone()['total']

    @staticmethod
    def contar_assinaturas(id_plano):
        with Database.get_cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM Assina
                WHERE id_plano = %s
            """, (id_plano,))
            return cursor.fetchone()['total']