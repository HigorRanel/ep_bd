from flask import request, jsonify
from backend.app.models.cliente import Cliente
from backend.app.utils.database import Database


class ClienteStatsController:
    @staticmethod
    def listar_com_estatisticas():
        """Lista todos os clientes com estatísticas de agendamentos - CORRIGIDO"""
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            search = request.args.get('search', '').strip()

            with Database.get_cursor() as cursor:
                
                where_clause = ""
                params = []

                if search:
                    where_clause = "WHERE p.nome_completo ILIKE %s OR p.cpf LIKE %s"
                    params = [f"%{search}%", f"%{search}%"]

                
                count_query = f"""
                    SELECT COUNT(DISTINCT c.cpf)
                    FROM Cliente c
                    JOIN Pessoa p ON c.cpf = p.cpf
                    {where_clause}
                """
                cursor.execute(count_query, params)
                total = cursor.fetchone()['count']

                
                offset = (page - 1) * per_page

                
                
                main_query = f"""
                    SELECT 
                        c.cpf,
                        p.nome_completo,
                        p.email,
                        p.telefone,
                        p.data_nascimento,
                        COUNT(a.id_agendamento) FILTER (WHERE a.status = 'concluido') as total_atendimentos,
                        COUNT(a.id_agendamento) FILTER (WHERE a.status = 'falta') as total_faltas,
                        MAX(a.data_hora_agendamento) FILTER (WHERE a.status = 'concluido') as ultima_visita,
                        COALESCE(AVG(av.nota), 0) as media_avaliacoes
                    FROM Cliente c
                    INNER JOIN Pessoa p ON c.cpf = p.cpf
                    LEFT JOIN Agendamento a ON c.cpf = a.client_id
                    LEFT JOIN Avaliacao av ON a.id_agendamento = av.id_agen
                    {where_clause}
                    GROUP BY c.cpf, p.nome_completo, p.email, p.telefone, p.data_nascimento
                    ORDER BY p.nome_completo
                    LIMIT %s OFFSET %s
                """

                cursor.execute(main_query, params + [per_page, offset])
                clientes = cursor.fetchall()

                return jsonify({
                    'clientes': clientes,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total,
                        'pages': (total + per_page - 1) // per_page
                    }
                }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def detalhes_cliente(cpf):
        """Retorna detalhes completos de um cliente - OTIMIZADO E CORRIGIDO"""
        try:
            with Database.get_cursor() as cursor:
                
                
                cursor.execute("""
                    SELECT 
                        c.cpf,
                        p.nome_completo,
                        p.email,
                        p.telefone,
                        p.endereco,
                        p.data_nascimento,
                        COUNT(a.id_agendamento) FILTER (WHERE a.status = 'concluido') as total_atendimentos,
                        COUNT(a.id_agendamento) FILTER (WHERE a.status = 'falta') as total_faltas,
                        MAX(a.data_hora_agendamento) FILTER (WHERE a.status = 'concluido') as ultima_visita,
                        COALESCE(AVG(av.nota), 0) as media_avaliacoes,
                        COUNT(DISTINCT av.id_agen) as total_avaliacoes
                    FROM Cliente c
                    INNER JOIN Pessoa p ON c.cpf = p.cpf
                    LEFT JOIN Agendamento a ON c.cpf = a.client_id
                    LEFT JOIN Avaliacao av ON a.id_agendamento = av.id_agen
                    WHERE c.cpf = %s
                    GROUP BY c.cpf, p.nome_completo, p.email, p.telefone, p.endereco, p.data_nascimento
                """, (cpf,))

                cliente = cursor.fetchone()

                if not cliente:
                    return jsonify({'error': 'Cliente não encontrado'}), 404

                
                cursor.execute("""
                    SELECT 
                        a.id_agendamento,
                        a.data_hora_agendamento,
                        a.status,
                        s.nome as servico_nome,
                        s.preco,
                        pb.nome_completo as barbeiro_nome,
                        av.nota,
                        av.comentario
                    FROM Agendamento a
                    INNER JOIN Contem ct ON a.id_agendamento = ct.id_agen
                    INNER JOIN Servico s ON ct.id_serv = s.id_servico
                    INNER JOIN Barbeiro b ON a.barbeiro_id = b.cpf
                    INNER JOIN Pessoa pb ON b.cpf = pb.cpf
                    LEFT JOIN Avaliacao av ON a.id_agendamento = av.id_agen
                    WHERE a.client_id = %s
                    ORDER BY a.data_hora_agendamento DESC
                    LIMIT 20
                """, (cpf,))

                historico = cursor.fetchall()

                return jsonify({
                    'cliente': cliente,
                    'historico': historico
                }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500