from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from backend.app.config import Config
from backend.app.models.pessoa import Pessoa
from backend.app.models.cliente import Cliente
from backend.app.models.barbeiro import Barbeiro

# --- MUDANÇA AQUI ---
from flask_mail import Message
# ANTES: from backend.app import mail
# AGORA (Correção):
from backend.app.extensions import mail 
from itsdangerous import URLSafeTimedSerializer
from flask import current_app, url_for

class AuthController:
    # ... (o resto do código permanece igual) ...
    @staticmethod
    def _gerar_token(pessoa, tipo_usuario):
        token = jwt.encode({
            'cpf': pessoa['cpf'],
            'email': pessoa['email'],
            'tipo': tipo_usuario,
            'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        }, Config.SECRET_KEY, algorithm='HS256')

        return {
            'token': token,
            'user': {
                'cpf': pessoa['cpf'],
                'nome': pessoa['nome_completo'],
                'email': pessoa['email'],
                'tipo': tipo_usuario
            }
        }

    @staticmethod
    def registrar_cliente():
        try:
            dados = request.get_json()

            # Validações básicas
            campos_obrigatorios = ['cpf', 'nome_completo', 'data_nascimento', 'email', 'senha']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Verificar se já existe
            if Pessoa.buscar_por_cpf(dados['cpf']):
                return jsonify({'error': 'CPF já cadastrado'}), 400

            if Pessoa.buscar_por_email(dados['email']):
                return jsonify({'error': 'Email já cadastrado'}), 400

            # Criar pessoa
            Pessoa.criar(
                dados['cpf'],
                dados['nome_completo'],
                dados['data_nascimento'],
                dados.get('telefone'),
                dados.get('endereco'),
                dados['email'],
                dados['senha']
            )

            # Criar cliente
            Cliente.criar(dados['cpf'])

            return jsonify({'message': 'Cliente registrado com sucesso'}), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def registrar_barbeiro():
        try:
            dados = request.get_json()

            # Validações básicas
            campos_obrigatorios = ['cpf', 'nome_completo', 'data_nascimento', 'email', 'senha', 'data_inicio']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Verificar se já existe
            if Pessoa.buscar_por_cpf(dados['cpf']):
                return jsonify({'error': 'CPF já cadastrado'}), 400

            # Criar pessoa
            Pessoa.criar(
                dados['cpf'],
                dados['nome_completo'],
                dados['data_nascimento'],
                dados.get('telefone'),
                dados.get('endereco'),
                dados['email'],
                dados['senha']
            )

            # Criar barbeiro
            Barbeiro.criar(dados['cpf'], dados['data_inicio'])

            # Se for chefe
            if dados.get('is_chefe'):
                Barbeiro.criar_chefe(dados['cpf'])

            return jsonify({'message': 'Barbeiro registrado com sucesso'}), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def login():
        try:
            dados = request.get_json()

            if not dados.get('email') or not dados.get('senha'):
                return jsonify({'error': 'Email e senha são obrigatórios'}), 400

            # Buscar pessoa
            pessoa = Pessoa.buscar_por_email(dados['email'])

            if not pessoa:
                return jsonify({'error': 'Credenciais inválidas'}), 401

            # Verificar senha
            if not Pessoa.verificar_senha(dados['senha'], pessoa['senha']):
                return jsonify({'error': 'Credenciais inválidas'}), 401

            # Determinar tipo de usuário
            barbeiro = Barbeiro.buscar_por_cpf(pessoa['cpf'])
            cliente = Cliente.buscar_por_cpf(pessoa['cpf'])

            tipo = None
            if barbeiro:
                tipo = 'barbeiro_chefe' if barbeiro['is_chefe'] else 'barbeiro'
            elif cliente:
                tipo = 'cliente'
            else:
                return jsonify({'error': 'Usuário sem tipo definido'}), 400

            # Gerar token JWT
            token = jwt.encode({
                'cpf': pessoa['cpf'],
                'email': pessoa['email'],
                'tipo': tipo,
                'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
            }, Config.SECRET_KEY, algorithm='HS256')

            return jsonify({
                'token': token,
                'user': {
                    'cpf': pessoa['cpf'],
                    'nome': pessoa['nome_completo'],
                    'email': pessoa['email'],
                    'tipo': tipo
                }
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def registrar_e_logar_cliente():
        try:
            dados = request.get_json()

            # Validações básicas
            campos_obrigatorios = ['cpf', 'nome_completo', 'data_nascimento', 'email', 'senha']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Verificar se já existe
            if Pessoa.buscar_por_cpf(dados['cpf']):
                return jsonify({'error': 'CPF já cadastrado'}), 400

            if Pessoa.buscar_por_email(dados['email']):
                return jsonify({'error': 'Email já cadastrado'}), 400

            # Criar pessoa
            Pessoa.criar(
                dados['cpf'],
                dados['nome_completo'],
                dados['data_nascimento'],
                dados.get('telefone'),
                dados.get('endereco'),
                dados['email'],
                dados['senha']
            )

            # Criar cliente
            Cliente.criar(dados['cpf'])

            # Buscar pessoa criada para gerar token
            pessoa = Pessoa.buscar_por_cpf(dados['cpf'])

            # Gerar token e retornar
            resultado = AuthController._gerar_token(pessoa, 'cliente')

            return jsonify({
                'message': 'Cliente cadastrado com sucesso',
                **resultado  # Inclui 'token' e 'user'
            }), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def registrar_e_logar_barbeiro():

        try:
            dados = request.get_json()

            # Validações básicas
            campos_obrigatorios = ['cpf', 'nome_completo', 'data_nascimento', 'email', 'senha', 'data_inicio']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Verificar se já existe
            if Pessoa.buscar_por_cpf(dados['cpf']):
                return jsonify({'error': 'CPF já cadastrado'}), 400

            if Pessoa.buscar_por_email(dados['email']):
                return jsonify({'error': 'Email já cadastrado'}), 400

            # Criar pessoa
            Pessoa.criar(
                dados['cpf'],
                dados['nome_completo'],
                dados['data_nascimento'],
                dados.get('telefone'),
                dados.get('endereco'),
                dados['email'],
                dados['senha']
            )

            # Criar barbeiro
            Barbeiro.criar(dados['cpf'], dados['data_inicio'])

            # Se for chefe
            if dados.get('is_chefe'):
                Barbeiro.criar_chefe(dados['cpf'])

            # Buscar pessoa criada
            pessoa = Pessoa.buscar_por_cpf(dados['cpf'])

            # Determinar tipo
            tipo = 'barbeiro_chefe' if dados.get('is_chefe') else 'barbeiro'

            # Gerar token e retornar
            resultado = AuthController._gerar_token(pessoa, tipo)

            return jsonify({
                'message': 'Barbeiro cadastrado com sucesso',
                **resultado  # Inclui 'token' e 'user'
            }), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def alterar_senha():
        try:
            # O CPF vem do token JWT decodificado pelo decorator @token_required
            cpf = request.user_cpf
            dados = request.get_json()
            
            senha_atual = dados.get('senha_atual')
            nova_senha = dados.get('nova_senha')

            if not senha_atual or not nova_senha:
                return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400

            # Buscar dados do usuário para pegar o hash atual
            pessoa = Pessoa.buscar_por_cpf(cpf)
            if not pessoa:
                return jsonify({'error': 'Usuário não encontrado'}), 404

            # Verificar se a senha atual está correta
            if not Pessoa.verificar_senha(senha_atual, pessoa['senha']):
                return jsonify({'error': 'A senha atual está incorreta'}), 400

            # Atualizar para a nova senha
            Pessoa.atualizar_senha(cpf, nova_senha)

            return jsonify({'message': 'Senha alterada com sucesso'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    @staticmethod
    def solicitar_recuperacao_email():
        try:
            dados = request.get_json()
            email = dados.get('email')

            if not email:
                return jsonify({'error': 'Email é obrigatório'}), 400

            # Verifica se o usuário existe
            pessoa = Pessoa.buscar_por_email(email)
            if not pessoa:
                # Por segurança, não dizemos que o email não existe, apenas dizemos que enviamos
                return jsonify({'message': 'Se o email existir, um link foi enviado.'}), 200

            # Gerar Token Seguro (Expira em 1 hora)
            s = URLSafeTimedSerializer(Config.SECRET_KEY)
            token = s.dumps(email, salt='recuperacao-senha')

            # Criar Link para o Frontend (Ajuste a porta se seu React não for 3000)
            link = f"http://localhost:3000/redefinir-senha/{token}"

            # Enviar Email
            msg = Message('Recuperação de Senha - Barbearia',
                          recipients=[email])
            msg.body = f"""Olá {pessoa['nome_completo']},

Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:

{link}

Este link expira em 1 hora.
Se você não solicitou isso, ignore este e-mail.
"""
            mail.send(msg)

            return jsonify({'message': 'E-mail de recuperação enviado com sucesso!'}), 200

        except Exception as e:
            print(e)
            return jsonify({'error': 'Erro ao enviar e-mail. Tente novamente mais tarde.'}), 500

    @staticmethod
    def redefinir_senha_token():
        try:
            dados = request.get_json()
            token = dados.get('token')
            nova_senha = dados.get('nova_senha')

            if not token or not nova_senha:
                return jsonify({'error': 'Token e nova senha são obrigatórios'}), 400

            # Verificar Token
            s = URLSafeTimedSerializer(Config.SECRET_KEY)
            try:
                # 3600 segundos = 1 hora
                email = s.loads(token, salt='recuperacao-senha', max_age=3600)
            except Exception:
                return jsonify({'error': 'Link inválido ou expirado'}), 400

            # Buscar Pessoa pelo email recuperado do token
            pessoa = Pessoa.buscar_por_email(email)
            if not pessoa:
                 return jsonify({'error': 'Usuário não encontrado'}), 404

            # Atualizar Senha
            Pessoa.atualizar_senha(pessoa['cpf'], nova_senha)

            return jsonify({'message': 'Senha alterada com sucesso!'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500