from flask import request, jsonify
from backend.app.utils.database import Database
from datetime import datetime, timedelta


class RelatorioController:
    @staticmethod
    def gerar_relatorio_financeiro():
        """
        Gera relatório financeiro detalhado com balanço, gastos e lucros
        Filtros: data_inicio, data_fim, cpf_barbeiro (opcional)
        """
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')
            cpf_barbeiro = request.args.get('cpf_barbeiro')

            if not data_inicio or not data_fim:
                return jsonify({'error': 'data_inicio e data_fim são obrigatórios'}), 400

            with Database.get_cursor() as cursor:

                query_receitas = """
                                 SELECT COALESCE(SUM(s.preco), 0)        as total_receitas, \
                                        COUNT(DISTINCT a.id_agendamento) as total_atendimentos, \
                                        COUNT(DISTINCT a.client_id)      as clientes_atendidos, \
                                        COALESCE(AVG(s.preco), 0)        as ticket_medio
                                 FROM Agendamento a
                                          JOIN Contem c ON a.id_agendamento = c.id_agen
                                          JOIN Servico s ON c.id_serv = s.id_servico
                                 WHERE a.status = 'concluido'
                                   AND DATE (a.data_hora_agendamento) BETWEEN %s \
                                   AND %s \
                                 """
                params_receitas = [data_inicio, data_fim]

                if cpf_barbeiro:
                    query_receitas += " AND a.barbeiro_id = %s"
                    params_receitas.append(cpf_barbeiro)

                cursor.execute(query_receitas, params_receitas)
                receitas = cursor.fetchone()

                query_gastos = """
                               SELECT COALESCE(SUM(p.preco_compra), 0) as total_gastos_produtos, \
                                      COUNT(*)                         as total_produtos_comprados
                               FROM Reserva r
                                        JOIN Produto p ON r.id_prod = p.id_produto
                               WHERE r.status IN ('comprado', 'retirado')
                                 AND DATE (r.data_reserva) BETWEEN %s \
                                 AND %s \
                               """
                cursor.execute(query_gastos, [data_inicio, data_fim])
                gastos = cursor.fetchone()

                query_vendas_produtos = """
                                        SELECT COALESCE(SUM(p.preco_venda), 0)                  as receita_produtos, \
                                               COALESCE(SUM(p.preco_venda - p.preco_compra), 0) as lucro_produtos, \
                                               COUNT(*)                                         as total_vendas
                                        FROM Reserva r
                                                 JOIN Produto p ON r.id_prod = p.id_produto
                                        WHERE r.status IN ('comprado', 'retirado')
                                          AND DATE (r.data_reserva) BETWEEN %s \
                                          AND %s \
                                        """
                cursor.execute(query_vendas_produtos, [data_inicio, data_fim])
                vendas_produtos = cursor.fetchone()

                query_planos = """
                               SELECT COUNT(*) as total_assinaturas, \
                                      COUNT(*)    FILTER (WHERE DATE(data_inicio) BETWEEN %s AND %s) as novas_assinaturas, COUNT(*) FILTER (WHERE DATE(data_fim) BETWEEN %s AND %s AND data_fim < CURRENT_DATE) as cancelamentos
                               FROM Assina
                               WHERE data_fim >= CURRENT_DATE \
                                  OR data_fim IS NULL \
                               """
                cursor.execute(query_planos, [data_inicio, data_fim, data_inicio, data_fim])
                planos = cursor.fetchone()

                query_receita_planos = """
                                       SELECT COALESCE(SUM( \
                                                               (SELECT COALESCE( \
                                                                               SUM(s.preco * ps.quantidade * (1 - ps.desconto / 100.0)), \
                                                                               0) \
                                                                FROM Possui ps \
                                                                         JOIN Servico s ON ps.id_serv = s.id_servico \
                                                                WHERE ps.id_plano = a.id_plano) \
                                                       ), 0) as receita_planos
                                       FROM Assina a
                                       WHERE DATE (a.data_inicio) BETWEEN %s \
                                         AND %s \
                                       """
                cursor.execute(query_receita_planos, [data_inicio, data_fim])
                receita_planos_result = cursor.fetchone()

                query_servicos = """
                                 SELECT s.nome                    as servico_nome, \
                                        COUNT(*)                  as quantidade, \
                                        COALESCE(SUM(s.preco), 0) as receita_total, \
                                        COALESCE(AVG(s.preco), 0) as preco_medio
                                 FROM Agendamento a
                                          JOIN Contem c ON a.id_agendamento = c.id_agen
                                          JOIN Servico s ON c.id_serv = s.id_servico
                                 WHERE a.status = 'concluido'
                                   AND DATE (a.data_hora_agendamento) BETWEEN %s \
                                   AND %s \
                                 """
                params_servicos = [data_inicio, data_fim]

                if cpf_barbeiro:
                    query_servicos += " AND a.barbeiro_id = %s"
                    params_servicos.append(cpf_barbeiro)

                query_servicos += """
                    GROUP BY s.id_servico, s.nome
                    ORDER BY receita_total DESC
                """
                cursor.execute(query_servicos, params_servicos)
                detalhamento_servicos = cursor.fetchall()

                total_receitas_servicos = float(receitas['total_receitas'] or 0)
                total_receita_produtos = float(vendas_produtos['receita_produtos'] or 0)
                total_receita_planos = float(receita_planos_result['receita_planos'] or 0)
                total_gastos = float(gastos['total_gastos_produtos'] or 0)

                receita_total = total_receitas_servicos + total_receita_produtos + total_receita_planos
                lucro_liquido = receita_total - total_gastos

                relatorio = {
                    'periodo': {
                        'data_inicio': data_inicio,
                        'data_fim': data_fim
                    },
                    'resumo_financeiro': {
                        'receita_total': round(receita_total, 2),
                        'receita_servicos': round(total_receitas_servicos, 2),
                        'receita_produtos': round(total_receita_produtos, 2),
                        'receita_planos': round(total_receita_planos, 2),
                        'gastos_total': round(total_gastos, 2),
                        'lucro_liquido': round(lucro_liquido, 2),
                        'margem_lucro': round((lucro_liquido / receita_total * 100) if receita_total > 0 else 0, 2)
                    },
                    'metricas_atendimento': {
                        'total_atendimentos': receitas['total_atendimentos'] or 0,
                        'clientes_atendidos': receitas['clientes_atendidos'] or 0,
                        'ticket_medio': round(float(receitas['ticket_medio'] or 0), 2)
                    },
                    'produtos': {
                        'vendas': vendas_produtos['total_vendas'] or 0,
                        'receita': round(float(vendas_produtos['receita_produtos'] or 0), 2),
                        'lucro': round(float(vendas_produtos['lucro_produtos'] or 0), 2),
                        'gastos': round(total_gastos, 2)
                    },
                    'planos': {
                        'total_assinaturas': planos['total_assinaturas'] or 0,
                        'novas_assinaturas': planos['novas_assinaturas'] or 0,
                        'cancelamentos': planos['cancelamentos'] or 0,
                        'receita_estimada': round(total_receita_planos, 2)
                    },
                    'detalhamento_servicos': detalhamento_servicos
                }

                return jsonify(relatorio), 200

        except Exception as e:
            print(f"Erro ao gerar relatório financeiro: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def relatorio_produtos():
        """
        Relatório de produtos mais e menos vendidos
        Filtros: data_inicio, data_fim, limite (padrão 10)
        """
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')
            limite = int(request.args.get('limite', 10))

            if not data_inicio or not data_fim:
                return jsonify({'error': 'data_inicio e data_fim são obrigatórios'}), 400

            with Database.get_cursor() as cursor:

                query_mais_vendidos = """
                                      SELECT p.id_produto, \
                                             p.nome_produto, \
                                             p.categoria, \
                                             p.preco_compra, \
                                             p.preco_venda, \
                                             COUNT(*)                                               as quantidade_vendida, \
                                             SUM(p.preco_venda)                                     as receita_total, \
                                             SUM(p.preco_venda - p.preco_compra)                    as lucro_total, \
                                             ROUND(AVG(p.preco_venda - p.preco_compra)::numeric, 2) as lucro_medio_unitario
                                      FROM Reserva r
                                               JOIN Produto p ON r.id_prod = p.id_produto
                                      WHERE r.status IN ('comprado', 'retirado')
                                        AND DATE (r.data_reserva) BETWEEN %s \
                                        AND %s
                                      GROUP BY p.id_produto, p.nome_produto, p.categoria, p.preco_compra, p.preco_venda
                                      ORDER BY quantidade_vendida DESC
                                          LIMIT %s \
                                      """
                cursor.execute(query_mais_vendidos, [data_inicio, data_fim, limite])
                mais_vendidos = cursor.fetchall()

                query_menos_vendidos = """
                                       SELECT p.id_produto, \
                                              p.nome_produto, \
                                              p.categoria, \
                                              p.preco_compra, \
                                              p.preco_venda, \
                                              COUNT(*)                            as quantidade_vendida, \
                                              SUM(p.preco_venda)                  as receita_total, \
                                              SUM(p.preco_venda - p.preco_compra) as lucro_total
                                       FROM Reserva r
                                                JOIN Produto p ON r.id_prod = p.id_produto
                                       WHERE r.status IN ('comprado', 'retirado')
                                         AND DATE (r.data_reserva) BETWEEN %s \
                                         AND %s
                                       GROUP BY p.id_produto, p.nome_produto, p.categoria, p.preco_compra, p.preco_venda
                                       ORDER BY quantidade_vendida ASC
                                           LIMIT %s \
                                       """
                cursor.execute(query_menos_vendidos, [data_inicio, data_fim, 3])
                menos_vendidos = cursor.fetchall()

                query_sem_vendas = """
                                   SELECT p.id_produto, \
                                          p.nome_produto, \
                                          p.categoria, \
                                          p.quantidade_estoque, \
                                          p.preco_venda
                                   FROM Produto p
                                   WHERE p.id_produto NOT IN (SELECT DISTINCT r.id_prod \
                                                              FROM Reserva r \
                                                              WHERE r.status IN ('comprado', 'retirado') \
                                                                AND \
                                       DATE (r.data_reserva) BETWEEN %s \
                                     AND %s
                                       )
                                     AND p.status = 'disponivel'
                                   ORDER BY p.nome_produto
                                       LIMIT %s \
                                   """
                cursor.execute(query_sem_vendas, [data_inicio, data_fim, limite])
                sem_vendas = cursor.fetchall()

                query_por_categoria = """
                                      SELECT p.categoria, \
                                             COUNT(*)                            as quantidade_vendida, \
                                             SUM(p.preco_venda)                  as receita_total, \
                                             SUM(p.preco_venda - p.preco_compra) as lucro_total
                                      FROM Reserva r
                                               JOIN Produto p ON r.id_prod = p.id_produto
                                      WHERE r.status IN ('comprado', 'retirado')
                                        AND DATE (r.data_reserva) BETWEEN %s \
                                        AND %s
                                      GROUP BY p.categoria
                                      ORDER BY receita_total DESC \
                                      """
                cursor.execute(query_por_categoria, [data_inicio, data_fim])
                por_categoria = cursor.fetchall()

                return jsonify({
                    'periodo': {
                        'data_inicio': data_inicio,
                        'data_fim': data_fim
                    },
                    'mais_vendidos': mais_vendidos,
                    'menos_vendidos': menos_vendidos,
                    'sem_vendas': sem_vendas,
                    'por_categoria': por_categoria
                }), 200

        except Exception as e:
            print(f"Erro ao gerar relatório de produtos: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def relatorio_clientes():
        """
        Relatório de comportamento de clientes
        Filtros: data_inicio, data_fim, limite (padrão 20)
        """
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')
            limite = int(request.args.get('limite', 20))

            if not data_inicio or not data_fim:
                return jsonify({'error': 'data_inicio e data_fim são obrigatórios'}), 400

            with Database.get_cursor() as cursor:

                query_mais_frequentes = """
                                        SELECT c.cpf, \
                                               p.nome_completo, \
                                               p.email, \
                                               COUNT(DISTINCT a.id_agendamento) as total_visitas, \
                                               COALESCE(SUM(s.preco), 0)        as valor_gasto, \
                                               COALESCE(AVG(s.preco), 0)        as ticket_medio, \
                                               MAX(a.data_hora_agendamento)     as ultima_visita
                                        FROM Cliente c
                                                 JOIN Pessoa p ON c.cpf = p.cpf
                                                 JOIN Agendamento a ON c.cpf = a.client_id
                                                 JOIN Contem ct ON a.id_agendamento = ct.id_agen
                                                 JOIN Servico s ON ct.id_serv = s.id_servico
                                        WHERE a.status = 'concluido'
                                          AND DATE (a.data_hora_agendamento) BETWEEN %s \
                                          AND %s
                                        GROUP BY c.cpf, p.nome_completo, p.email
                                        ORDER BY total_visitas DESC
                                            LIMIT %s \
                                        """
                cursor.execute(query_mais_frequentes, [data_inicio, data_fim, limite])
                mais_frequentes = cursor.fetchall()

                # Serviços preferidos de TODOS os clientes numa única query
                # (elimina o N+1 que rodava uma consulta por cliente no loop).
                cpfs = [cliente['cpf'] for cliente in mais_frequentes]
                if cpfs:
                    cursor.execute("""
                                   SELECT a.client_id,
                                          STRING_AGG(DISTINCT s.nome, ', ') AS servicos_preferidos
                                   FROM Agendamento a
                                            JOIN Contem ct ON a.id_agendamento = ct.id_agen
                                            JOIN Servico s ON ct.id_serv = s.id_servico
                                   WHERE a.client_id = ANY (%s)
                                     AND a.status = 'concluido'
                                     AND DATE (a.data_hora_agendamento) BETWEEN %s
                                     AND %s
                                   GROUP BY a.client_id
                                   """, [cpfs, data_inicio, data_fim])

                    preferidos = {row['client_id']: row['servicos_preferidos']
                                  for row in cursor.fetchall()}

                    for cliente in mais_frequentes:
                        cliente['servicos_preferidos'] = preferidos.get(cliente['cpf'], '')

                query_inativos = """
                                 SELECT c.cpf, \
                                        p.nome_completo, \
                                        p.email, \
                                        MAX(a.data_hora_agendamento) as ultima_visita, \
                                        CURRENT_DATE - DATE (MAX (a.data_hora_agendamento)) as dias_sem_visita
                                 FROM Cliente c
                                     JOIN Pessoa p \
                                 ON c.cpf = p.cpf
                                     LEFT JOIN Agendamento a ON c.cpf = a.client_id AND a.status = 'concluido'
                                 WHERE c.cpf NOT IN (
                                     SELECT DISTINCT client_id
                                     FROM Agendamento
                                     WHERE status = 'concluido'
                                   AND DATE (data_hora_agendamento) BETWEEN %s \
                                   AND %s
                                     )
                                 GROUP BY c.cpf, p.nome_completo, p.email
                                 HAVING MAX (a.data_hora_agendamento) IS NOT NULL
                                 ORDER BY dias_sem_visita DESC
                                     LIMIT %s \
                                 """
                cursor.execute(query_inativos, [data_inicio, data_fim, limite])
                inativos = cursor.fetchall()

                query_servicos_populares = """
                                           SELECT s.nome                      as servico_nome, \
                                                  COUNT(DISTINCT a.client_id) as clientes_unicos, \
                                                  COUNT(*)                    as total_agendamentos, \
                                                  AVG(s.preco)                as preco_medio
                                           FROM Agendamento a
                                                    JOIN Contem c ON a.id_agendamento = c.id_agen
                                                    JOIN Servico s ON c.id_serv = s.id_servico
                                           WHERE a.status = 'concluido'
                                             AND DATE (a.data_hora_agendamento) BETWEEN %s \
                                             AND %s
                                           GROUP BY s.id_servico, s.nome
                                           ORDER BY total_agendamentos DESC \
                                           """
                cursor.execute(query_servicos_populares, [data_inicio, data_fim])
                servicos_populares = cursor.fetchall()

                query_faltas = """
                               SELECT c.cpf, \
                                      p.nome_completo, \
                                      p.email, \
                                      COUNT(*)                     as total_faltas, \
                                      MAX(a.data_hora_agendamento) as ultima_falta
                               FROM Cliente c
                                        JOIN Pessoa p ON c.cpf = p.cpf
                                        JOIN Agendamento a ON c.cpf = a.client_id
                               WHERE a.status = 'falta'
                                 AND DATE (a.data_hora_agendamento) BETWEEN %s \
                                 AND %s
                               GROUP BY c.cpf, p.nome_completo, p.email
                               ORDER BY total_faltas DESC
                                   LIMIT %s \
                               """
                cursor.execute(query_faltas, [data_inicio, data_fim, limite])
                com_faltas = cursor.fetchall()

                return jsonify({
                    'periodo': {
                        'data_inicio': data_inicio,
                        'data_fim': data_fim
                    },
                    'mais_frequentes': mais_frequentes,
                    'inativos': inativos,
                    'servicos_populares': servicos_populares,
                    'com_faltas': com_faltas
                }), 200

        except Exception as e:
            print(f"Erro ao gerar relatório de clientes: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def relatorio_completo():
        """
        Relatório completo combinando todas as informações
        """
        try:
            data_inicio = request.args.get('data_inicio')
            data_fim = request.args.get('data_fim')
            cpf_barbeiro = request.args.get('cpf_barbeiro')

            if not data_inicio or not data_fim:
                return jsonify({'error': 'data_inicio e data_fim são obrigatórios'}), 400

            return jsonify({
                'message': 'Use os endpoints específicos para cada tipo de relatório',
                'endpoints': {
                    'financeiro': '/relatorios/financeiro',
                    'produtos': '/relatorios/produtos',
                    'clientes': '/relatorios/clientes'
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500