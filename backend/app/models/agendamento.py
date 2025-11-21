from backend.app.utils.database import Database
from datetime import datetime, timedelta
import pytz


class Agendamento:
    @staticmethod
    def verificar_conflito_horario(cpf_barbeiro, data_hora, duracao_min, id_agendamento_excluir=None):
        """
        Verifica se há conflito de horário para o barbeiro

        Args:
            cpf_barbeiro: CPF do barbeiro
            data_hora: Data e hora do novo agendamento (string)
            duracao_min: Duração estimada do serviço em minutos
            id_agendamento_excluir: ID do agendamento a excluir da verificação (para edições)

        Returns:
            dict: {'tem_conflito': bool, 'agendamento_conflitante': dict ou None}
        """
        with Database.get_cursor() as cursor:
            # Calcular horário de início e fim do novo agendamento
            # Remove timezone info para comparação consistente
            inicio = datetime.strptime(data_hora, '%Y-%m-%d %H:%M:%S')
            fim = inicio + timedelta(minutes=duracao_min)

            # Query para buscar agendamentos que podem conflitar
            query = """
                SELECT a.*, s.duracao_estimada_min, pc.nome_completo as cliente_nome
                FROM Agendamento a
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                JOIN Cliente c ON a.client_id = c.cpf
                JOIN Pessoa pc ON c.cpf = pc.cpf
                WHERE a.barbeiro_id = %s
                AND a.status IN ('pendente', 'confirmado')
                AND DATE(a.data_hora_agendamento) = %s
            """

            params = [cpf_barbeiro, inicio.date()]

            # Se for edição, excluir o próprio agendamento da verificação
            if id_agendamento_excluir:
                query += " AND a.id_agendamento != %s"
                params.append(id_agendamento_excluir)

            cursor.execute(query, params)
            agendamentos_existentes = cursor.fetchall()

            # Verificar conflitos
            for agendamento in agendamentos_existentes:
                ag_inicio = agendamento['data_hora_agendamento']

                # Remover timezone info se existir
                if ag_inicio.tzinfo is not None:
                    ag_inicio = ag_inicio.replace(tzinfo=None)

                ag_duracao = agendamento['duracao_estimada_min']
                ag_fim = ag_inicio + timedelta(minutes=ag_duracao)

                # Verificar se há sobreposição de horários
                # Conflito ocorre se:
                # 1. Novo agendamento começa durante um agendamento existente
                # 2. Novo agendamento termina durante um agendamento existente
                # 3. Novo agendamento envolve completamente um agendamento existente

                if (inicio < ag_fim and fim > ag_inicio):
                    return {
                        'tem_conflito': True,
                        'agendamento_conflitante': {
                            'id_agendamento': agendamento['id_agendamento'],
                            'cliente_nome': agendamento['cliente_nome'],
                            'horario_inicio': ag_inicio.strftime('%H:%M'),
                            'horario_fim': ag_fim.strftime('%H:%M'),
                            'duracao_min': ag_duracao
                        }
                    }

            return {'tem_conflito': False, 'agendamento_conflitante': None}

    @staticmethod
    def obter_horarios_disponiveis(cpf_barbeiro, data, duracao_servico_min=30):
        """
        Retorna horários disponíveis para um barbeiro em uma data específica

        Args:
            cpf_barbeiro: CPF do barbeiro
            data: Data no formato 'YYYY-MM-DD'
            duracao_servico_min: Duração do serviço em minutos

        Returns:
            list: Lista de horários disponíveis no formato 'HH:MM'
        """
        with Database.get_cursor() as cursor:
            # Buscar agendamentos do barbeiro nessa data
            cursor.execute("""
                SELECT a.data_hora_agendamento, s.duracao_estimada_min
                FROM Agendamento a
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                WHERE a.barbeiro_id = %s
                AND DATE(a.data_hora_agendamento) = %s
                AND a.status IN ('pendente', 'confirmado')
                ORDER BY a.data_hora_agendamento
            """, (cpf_barbeiro, data))

            agendamentos = cursor.fetchall()

            # Definir horário de funcionamento (8h às 18h)
            horario_inicio = 8
            horario_fim = 18
            intervalo_minutos = 30  # Intervalos de 30 minutos

            # Gerar todos os horários possíveis
            horarios_possiveis = []
            hora_atual = horario_inicio
            minuto_atual = 0

            while hora_atual < horario_fim:
                horarios_possiveis.append(f"{hora_atual:02d}:{minuto_atual:02d}")
                minuto_atual += intervalo_minutos
                if minuto_atual >= 60:
                    minuto_atual = 0
                    hora_atual += 1

            # Remover horários ocupados
            horarios_disponiveis = []
            data_base = datetime.strptime(data, '%Y-%m-%d')

            for horario in horarios_possiveis:
                hora, minuto = map(int, horario.split(':'))
                horario_teste = data_base.replace(hour=hora, minute=minuto)
                horario_teste_fim = horario_teste + timedelta(minutes=duracao_servico_min)

                # Verificar se esse horário conflita com algum agendamento
                conflito = False
                for ag in agendamentos:
                    ag_inicio = ag['data_hora_agendamento']

                    # Remover timezone info se existir
                    if ag_inicio.tzinfo is not None:
                        ag_inicio = ag_inicio.replace(tzinfo=None)

                    ag_fim = ag_inicio + timedelta(minutes=ag['duracao_estimada_min'])

                    if horario_teste < ag_fim and horario_teste_fim > ag_inicio:
                        conflito = True
                        break

                if not conflito:
                    horarios_disponiveis.append(horario)

            return horarios_disponiveis

    @staticmethod
    def criar(data_hora, cpf_cliente, cpf_barbeiro, id_servico, cpf_origem, status='pendente'):
        with Database.get_cursor() as cursor:
            # Buscar duração do serviço
            cursor.execute("""
                SELECT duracao_estimada_min FROM Servico WHERE id_servico = %s
            """, (id_servico,))
            servico = cursor.fetchone()

            if not servico:
                raise Exception('Serviço não encontrado')

            duracao = servico['duracao_estimada_min']

            # Verificar conflito de horário
            conflito = Agendamento.verificar_conflito_horario(cpf_barbeiro, data_hora, duracao)

            if conflito['tem_conflito']:
                ag_conf = conflito['agendamento_conflitante']
                raise Exception(
                    f"Horário indisponível. Já existe um agendamento para {ag_conf['cliente_nome']} "
                    f"das {ag_conf['horario_inicio']} às {ag_conf['horario_fim']}."
                )

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

    @staticmethod
    def listar_avaliacoes_paginado(cpf_barbeiro, pagina=1, por_pagina=10, data_inicio=None, data_fim=None,
                                   nota_min=None):
        """Lista avaliações com paginação e filtros"""
        with Database.get_cursor() as cursor:
            # Query base
            query_base = """
                FROM Avaliacao av
                JOIN Agendamento a ON av.id_agen = a.id_agendamento
                JOIN Cliente c ON a.client_id = c.cpf
                JOIN Pessoa pc ON c.cpf = pc.cpf
                JOIN Contem ct ON a.id_agendamento = ct.id_agen
                JOIN Servico s ON ct.id_serv = s.id_servico
                WHERE a.barbeiro_id = %s
            """

            params = [cpf_barbeiro]

            # Filtros
            if data_inicio:
                query_base += " AND DATE(a.data_hora_agendamento) >= %s"
                params.append(data_inicio)

            if data_fim:
                query_base += " AND DATE(a.data_hora_agendamento) <= %s"
                params.append(data_fim)

            if nota_min:
                query_base += " AND av.nota >= %s"
                params.append(nota_min)

            # Contar total
            cursor.execute(f"SELECT COUNT(*) as total {query_base}", params)
            total_avaliacoes = cursor.fetchone()['total']

            # Buscar avaliacoes paginadas
            offset = (pagina - 1) * por_pagina
            query_avaliacoes = f"""
                SELECT av.*, a.data_hora_agendamento, 
                       pc.nome_completo as cliente_nome,
                       s.nome as servico_nome
                {query_base}
                ORDER BY a.data_hora_agendamento DESC
                LIMIT %s OFFSET %s
            """

            params.extend([por_pagina, offset])
            cursor.execute(query_avaliacoes, params)
            avaliacoes = cursor.fetchall()

            total_paginas = (total_avaliacoes + por_pagina - 1) // por_pagina

            return {
                'avaliacoes': avaliacoes,
                'total_avaliacoes': total_avaliacoes,
                'total_paginas': total_paginas,
                'pagina_atual': pagina,
                'por_pagina': por_pagina,
                'tem_proxima': pagina < total_paginas,
                'tem_anterior': pagina > 1
            }