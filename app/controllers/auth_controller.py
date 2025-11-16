from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from app.config import Config
from app.models.pessoa import Pessoa
from app.models.cliente import Cliente
from app.models.barbeiro import Barbeiro


class AuthController:
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