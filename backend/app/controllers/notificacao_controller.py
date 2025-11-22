from flask import request, jsonify
from backend.app.extensions import mail
from flask_mail import Message
from backend.app.utils.database import Database
from datetime import datetime, timedelta
import threading


class NotificacaoController:
    # Templates de email pré-definidos
    TEMPLATES = {
        'cliente_inativo': {
            'assunto': '✂️ Sentimos sua falta na {nome_barbearia}!',
            'tipo': 'inativo'
        },
        'muitas_faltas': {
            'assunto': '⚠️ Confirmação de Agendamentos - {nome_barbearia}',
            'tipo': 'faltas'
        },
        'promocao': {
            'assunto': '🎉 Promoção Especial para Você!',
            'tipo': 'promocao'
        },
        'lembrete': {
            'assunto': '📅 Que tal agendar seu próximo corte?',
            'tipo': 'lembrete'
        }
    }

    @staticmethod
    def _enviar_email_async(destinatarios, assunto, corpo_html):
        """Envia email de forma assíncrona"""
        try:
            with mail.app.app_context():
                for email in destinatarios:
                    msg = Message(
                        assunto,
                        recipients=[email],
                        html=corpo_html
                    )
                    mail.send(msg)
        except Exception as e:
            print(f"Erro ao enviar email: {str(e)}")

    @staticmethod
    def _gerar_html_email(tipo_template, dados_cliente, conteudo_personalizado=None):
        """Gera o HTML do email baseado no template"""

        nome_cliente = dados_cliente.get('nome_completo', 'Cliente')
        primeira_nome = nome_cliente.split()[0]

        # CSS comum para todos os templates
        css_base = """
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .content {
                padding: 30px;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .stats {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .highlight {
                background: #fff3cd;
                padding: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }
        </style>
        """

        # Templates específicos
        if tipo_template == 'inativo':
            dias_inativo = dados_cliente.get('dias_sem_visita', 0)
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {css_base}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✂️ Sentimos sua Falta!</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {primeira_nome}!</h2>

                        <p>Percebemos que faz <strong>{dias_inativo} dias</strong> desde sua última visita e sentimos muito sua falta por aqui! 😊</p>

                        <p>Nossa equipe está sempre pronta para te atender com o melhor serviço. Que tal agendar seu próximo corte?</p>

                        {conteudo_personalizado or ''}

                        <div class="highlight">
                            <strong>💡 Dica:</strong> Agende agora e garanta seu horário favorito!
                        </div>

                        <center>
                            <a href="#" class="button">Agendar Agora</a>
                        </center>

                        <p>Estamos ansiosos para te ver novamente!</p>

                        <p>Atenciosamente,<br>
                        <strong>Equipe Barbearia</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        elif tipo_template == 'faltas':
            total_faltas = dados_cliente.get('total_faltas', 0)
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {css_base}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Sobre seus Agendamentos</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {primeira_nome}!</h2>

                        <p>Gostaríamos de conversar com você sobre seus agendamentos.</p>

                        <div class="stats">
                            <p><strong>📊 Estatísticas:</strong></p>
                            <p>Total de faltas registradas: <strong>{total_faltas}</strong></p>
                        </div>

                        <p>Entendemos que imprevistos acontecem, mas faltas frequentes impactam nossa agenda e outros clientes que aguardam horários.</p>

                        <div class="highlight">
                            <strong>💡 Importante:</strong> Se precisar cancelar, por favor, faça com pelo menos 2 horas de antecedência.
                        </div>

                        {conteudo_personalizado or ''}

                        <p>Conte conosco para te atender da melhor forma possível!</p>

                        <p>Atenciosamente,<br>
                        <strong>Equipe Barbearia</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        elif tipo_template == 'promocao':
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {css_base}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Promoção Especial!</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {primeira_nome}!</h2>

                        <p>Temos uma oferta especial exclusiva para você!</p>

                        {conteudo_personalizado or '<p>Aproveite condições especiais em nossos serviços!</p>'}

                        <center>
                            <a href="#" class="button">Ver Promoção</a>
                        </center>

                        <p>Não perca essa oportunidade!</p>

                        <p>Atenciosamente,<br>
                        <strong>Equipe Barbearia</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                        <p>Promoção válida por tempo limitado.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        elif tipo_template == 'lembrete':
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {css_base}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📅 Hora de Agendar!</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {primeira_nome}!</h2>

                        <p>Só passando para lembrar que está na hora de cuidar do visual! ✂️</p>

                        <p>Nossa agenda está aberta e temos vários horários disponíveis para você.</p>

                        {conteudo_personalizado or ''}

                        <center>
                            <a href="#" class="button">Agendar Agora</a>
                        </center>

                        <p>Te esperamos!</p>

                        <p>Atenciosamente,<br>
                        <strong>Equipe Barbearia</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        else:
            # Template genérico
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {css_base}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✂️ Barbearia</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, {primeira_nome}!</h2>

                        {conteudo_personalizado or '<p>Temos uma mensagem para você!</p>'}

                        <p>Atenciosamente,<br>
                        <strong>Equipe Barbearia</strong></p>
                    </div>
                    <div class="footer">
                        <p>Este é um email automático. Por favor, não responda.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        return html

    @staticmethod
    def listar_clientes_inativos(cpf_barbeiro):
        """Lista clientes que não cortam há muito tempo"""
        try:
            dias_inatividade = int(request.args.get('dias', 60))

            with Database.get_cursor() as cursor:
                # Buscar clientes que cortaram com este barbeiro mas estão inativos
                cursor.execute("""
                    WITH ultimo_atendimento AS (
                        SELECT 
                            a.client_id,
                            MAX(a.data_hora_agendamento) as ultima_visita
                        FROM Agendamento a
                        WHERE a.barbeiro_id = %s
                        AND a.status = 'concluido'
                        GROUP BY a.client_id
                    )
                    SELECT 
                        c.cpf,
                        p.nome_completo,
                        p.email,
                        p.telefone,
                        ua.ultima_visita,
                        CURRENT_DATE - DATE(ua.ultima_visita) as dias_sem_visita,
                        COUNT(DISTINCT a.id_agendamento) FILTER (WHERE a.status = 'concluido') as total_atendimentos
                    FROM ultimo_atendimento ua
                    JOIN Cliente c ON ua.client_id = c.cpf
                    JOIN Pessoa p ON c.cpf = p.cpf
                    LEFT JOIN Agendamento a ON c.cpf = a.client_id AND a.barbeiro_id = %s
                    WHERE CURRENT_DATE - DATE(ua.ultima_visita) >= %s
                    GROUP BY c.cpf, p.nome_completo, p.email, p.telefone, ua.ultima_visita
                    ORDER BY dias_sem_visita DESC
                """, (cpf_barbeiro, cpf_barbeiro, dias_inatividade))

                clientes = cursor.fetchall()

                return jsonify({
                    'clientes': clientes,
                    'total': len(clientes),
                    'dias_filtro': dias_inatividade
                }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_clientes_muitas_faltas(cpf_barbeiro):
        """Lista clientes com muitas faltas"""
        try:
            minimo_faltas = int(request.args.get('minimo', 3))

            with Database.get_cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        c.cpf,
                        p.nome_completo,
                        p.email,
                        p.telefone,
                        COUNT(*) FILTER (WHERE a.status = 'falta') as total_faltas,
                        COUNT(*) FILTER (WHERE a.status = 'concluido') as total_atendimentos,
                        MAX(a.data_hora_agendamento) FILTER (WHERE a.status = 'falta') as ultima_falta
                    FROM Cliente c
                    JOIN Pessoa p ON c.cpf = p.cpf
                    JOIN Agendamento a ON c.cpf = a.client_id
                    WHERE a.barbeiro_id = %s
                    GROUP BY c.cpf, p.nome_completo, p.email, p.telefone
                    HAVING COUNT(*) FILTER (WHERE a.status = 'falta') >= %s
                    ORDER BY total_faltas DESC
                """, (cpf_barbeiro, minimo_faltas))

                clientes = cursor.fetchall()

                return jsonify({
                    'clientes': clientes,
                    'total': len(clientes),
                    'minimo_faltas': minimo_faltas
                }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def enviar_notificacao(cpf_barbeiro):
        """Envia notificação por email para clientes selecionados"""
        try:
            dados = request.get_json()

            # Validações
            if 'cpfs_clientes' not in dados or not dados['cpfs_clientes']:
                return jsonify({'error': 'Selecione pelo menos um cliente'}), 400

            if 'tipo_template' not in dados:
                return jsonify({'error': 'Selecione um tipo de mensagem'}), 400

            tipo_template = dados['tipo_template']
            cpfs_clientes = dados['cpfs_clientes']
            conteudo_personalizado = dados.get('conteudo_personalizado', '')

            # Validar tipo de template
            if tipo_template not in NotificacaoController.TEMPLATES:
                return jsonify({'error': 'Tipo de template inválido'}), 400

            # Buscar dados dos clientes
            with Database.get_cursor() as cursor:
                placeholders = ','.join(['%s'] * len(cpfs_clientes))

                cursor.execute(f"""
                    SELECT 
                        c.cpf,
                        p.nome_completo,
                        p.email,
                        COUNT(*) FILTER (WHERE a.status = 'falta') as total_faltas,
                        MAX(a.data_hora_agendamento) FILTER (WHERE a.status = 'concluido') as ultima_visita
                    FROM Cliente c
                    JOIN Pessoa p ON c.cpf = p.cpf
                    LEFT JOIN Agendamento a ON c.cpf = a.client_id AND a.barbeiro_id = %s
                    WHERE c.cpf IN ({placeholders})
                    GROUP BY c.cpf, p.nome_completo, p.email
                """, [cpf_barbeiro] + cpfs_clientes)

                clientes = cursor.fetchall()

            if not clientes:
                return jsonify({'error': 'Nenhum cliente encontrado'}), 404

            # Preparar envio de emails
            template_info = NotificacaoController.TEMPLATES[tipo_template]
            assunto = template_info['assunto'].format(nome_barbearia='Barbearia')

            emails_enviados = []
            emails_falha = []

            for cliente in clientes:
                try:
                    # Calcular dias sem visita
                    dias_sem_visita = 0
                    if cliente['ultima_visita']:
                        dias_sem_visita = (datetime.now().date() - cliente['ultima_visita'].date()).days

                    dados_cliente = {
                        'nome_completo': cliente['nome_completo'],
                        'total_faltas': cliente['total_faltas'],
                        'dias_sem_visita': dias_sem_visita
                    }

                    # Gerar HTML do email
                    corpo_html = NotificacaoController._gerar_html_email(
                        tipo_template,
                        dados_cliente,
                        conteudo_personalizado
                    )

                    # Enviar email
                    msg = Message(
                        assunto,
                        recipients=[cliente['email']],
                        html=corpo_html
                    )
                    mail.send(msg)

                    emails_enviados.append({
                        'cpf': cliente['cpf'],
                        'nome': cliente['nome_completo'],
                        'email': cliente['email']
                    })

                except Exception as e:
                    print(f"Erro ao enviar email para {cliente['email']}: {str(e)}")
                    emails_falha.append({
                        'cpf': cliente['cpf'],
                        'nome': cliente['nome_completo'],
                        'email': cliente['email'],
                        'erro': str(e)
                    })

            return jsonify({
                'message': f'Notificações enviadas para {len(emails_enviados)} cliente(s)',
                'total_enviados': len(emails_enviados),
                'total_falhas': len(emails_falha),
                'emails_enviados': emails_enviados,
                'emails_falha': emails_falha
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_templates():
        """Lista templates disponíveis"""
        try:
            templates = []
            for key, value in NotificacaoController.TEMPLATES.items():
                templates.append({
                    'id': key,
                    'nome': key.replace('_', ' ').title(),
                    'assunto': value['assunto'],
                    'descricao': NotificacaoController._get_descricao_template(key)
                })

            return jsonify({'templates': templates}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def _get_descricao_template(tipo):
        """Retorna descrição do template"""
        descricoes = {
            'cliente_inativo': 'Para clientes que não cortam há muito tempo',
            'muitas_faltas': 'Para clientes com histórico de faltas frequentes',
            'promocao': 'Para divulgar promoções e ofertas especiais',
            'lembrete': 'Lembrete geral para agendar novo corte'
        }
        return descricoes.get(tipo, 'Template genérico')

    @staticmethod
    def visualizar_template(cpf_barbeiro):
        """Gera preview de um template"""
        try:
            tipo_template = request.args.get('tipo')

            if not tipo_template or tipo_template not in NotificacaoController.TEMPLATES:
                return jsonify({'error': 'Tipo de template inválido'}), 400

            # Dados de exemplo
            dados_exemplo = {
                'nome_completo': 'João da Silva',
                'total_faltas': 3,
                'dias_sem_visita': 45
            }

            conteudo_exemplo = request.args.get('conteudo', '')

            html = NotificacaoController._gerar_html_email(
                tipo_template,
                dados_exemplo,
                conteudo_exemplo
            )

            return html, 200, {'Content-Type': 'text/html; charset=utf-8'}

        except Exception as e:
            return jsonify({'error': str(e)}), 500