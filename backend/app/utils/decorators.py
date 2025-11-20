from functools import wraps
from flask import request, jsonify
import jwt
from backend.app.config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            request.user_cpf = data['cpf']
            request.user_type = data['tipo']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401

        return f(*args, **kwargs)

    return decorated


def barbeiro_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user_type not in ['barbeiro', 'barbeiro_chefe']:
            return jsonify({'error': 'Acesso negado: apenas barbeiros'}), 403
        return f(*args, **kwargs)

    return decorated


def barbeiro_chefe_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user_type != 'barbeiro_chefe':
            return jsonify({'error': 'Acesso negado: apenas barbeiro chefe'}), 403
        return f(*args, **kwargs)

    return decorated