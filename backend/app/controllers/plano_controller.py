from flask import request, jsonify
from backend.app.models.plano_mensal import PlanoMensal
from backend.app.models.barbeiro import Barbeiro


class PlanoController:
    @staticmethod
    def criar(cpf_usuario):
        try:
            dados = request.get_json()

            # Buscar ID do barbeiro chefe
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode criar planos'}), 403

            # Buscar id_barbeiro_chefe
            from backend.app.utils.database import Database
            with Database.get_cursor() as cursor:
                cursor.execute("""
                    SELECT id_barbeiro_chefe FROM Barbeiro_Chefe WHERE cpf_barbeiro = %s
                """, (cpf_usuario,))
                chefe = cursor.fetchone()

                if not chefe:
                    return jsonify({'error': 'Barbeiro chefe não encontrado'}), 404

            if 'servicos' not in dados or not dados['servicos']:
                return jsonify({'error': 'Pelo menos um serviço é obrigatório'}), 400

            resultado = PlanoMensal.criar(chefe['id_barbeiro_chefe'], dados['servicos'])
            return jsonify(resultado), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar():
        try:
            planos = PlanoMensal.listar_todos()
            return jsonify(planos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar_paginado():
        """Lista planos com paginação e filtros"""
        try:
            pagina = int(request.args.get('pagina', 1))
            por_pagina = int(request.args.get('por_pagina', 10))
            criador = request.args.get('criador')  # Filtro por nome do criador

            planos = PlanoMensal.listar_paginado(pagina, por_pagina, criador)
            return jsonify(planos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(id_plano):
        """Busca um plano específico"""
        try:
            plano = PlanoMensal.buscar_por_id(id_plano)
            if not plano:
                return jsonify({'error': 'Plano não encontrado'}), 404
            return jsonify(plano), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar(id_plano, cpf_usuario):
        """Atualiza serviços de um plano"""
        try:
            dados = request.get_json()

            # Verificar se é barbeiro chefe
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode atualizar planos'}), 403

            if 'servicos' not in dados:
                return jsonify({'error': 'Campo servicos é obrigatório'}), 400

            resultado = PlanoMensal.atualizar_servicos(id_plano, dados['servicos'])
            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def deletar(id_plano, cpf_usuario):
        """Deleta um plano (se não tiver assinaturas ativas)"""
        try:
            # Verificar se é barbeiro chefe
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode deletar planos'}), 403

            # Verificar se há assinaturas ativas
            from backend.app.utils.database import Database
            with Database.get_cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) as total
                    FROM Assina
                    WHERE id_plano = %s AND data_fim >= CURRENT_DATE
                """, (id_plano,))

                result = cursor.fetchone()
                if result['total'] > 0:
                    return jsonify({
                        'error': 'Não é possível deletar plano com assinaturas ativas'
                    }), 400

            PlanoMensal.deletar(id_plano)
            return jsonify({'message': 'Plano deletado com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def assinar(cpf_usuario):
        try:
            dados = request.get_json()

            campos_obrigatorios = ['id_plano', 'data_inicio', 'data_fim']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            PlanoMensal.assinar_plano(
                cpf_usuario,
                dados['id_plano'],
                dados['data_inicio'],
                dados['data_fim']
            )

            return jsonify({'message': 'Plano assinado com sucesso'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def minhas_assinaturas(cpf_usuario):
        try:
            assinaturas = PlanoMensal.listar_assinaturas_cliente(cpf_usuario)
            return jsonify(assinaturas), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500