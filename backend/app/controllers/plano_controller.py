from flask import request, jsonify
from backend.app.models.plano_mensal import PlanoMensal
from backend.app.models.barbeiro import Barbeiro


class PlanoController:
    @staticmethod
    def criar(cpf_usuario):
        try:
            dados = request.get_json()

            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode criar planos'}), 403

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

            for servico in dados['servicos']:
                desconto_servico = float(servico.get('desconto', 0))
                if desconto_servico < 0 or desconto_servico > 100:
                    return jsonify({'error': 'Desconto deve ser entre 0 e 100'}), 400

            resultado = PlanoMensal.criar(
                chefe['id_barbeiro_chefe'],
                dados['servicos']
            )

            return jsonify(resultado), 201
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
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
            criador = request.args.get('criador')  

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
        """Atualiza serviços e desconto de um plano"""
        try:
            dados = request.get_json()

            
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode atualizar planos'}), 403

            if 'servicos' not in dados:
                return jsonify({'error': 'Campo servicos é obrigatório'}), 400

            
            desconto = dados.get('desconto')

            
            if desconto is not None:
                desconto = float(desconto)
                if desconto < 0 or desconto > 100:
                    return jsonify({'error': 'Desconto deve ser entre 0 e 100'}), 400

            
            resultado = PlanoMensal.atualizar(
                id_plano,
                dados['servicos'],
                desconto  
            )

            return jsonify(resultado), 200
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def deletar(id_plano, cpf_usuario):
        """Deleta um plano (se não tiver assinaturas ativas)"""
        try:
            
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode deletar planos'}), 403

            
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

    @staticmethod
    def atualizar_desconto_plano(id_plano, cpf_usuario):
        """Atualiza o desconto de um plano - NOVO"""
        try:
            dados = request.get_json()

            
            barbeiro = Barbeiro.buscar_por_cpf(cpf_usuario)
            if not barbeiro or not barbeiro.get('is_chefe'):
                return jsonify({'error': 'Apenas barbeiro chefe pode atualizar descontos'}), 403

            if 'desconto' not in dados:
                return jsonify({'error': 'Campo desconto é obrigatório'}), 400

            desconto = float(dados['desconto'])
            if desconto < 0 or desconto > 100:
                return jsonify({'error': 'Desconto deve ser entre 0 e 100'}), 400

            
            from backend.app.utils.database import Database
            with Database.get_cursor() as cursor:
                cursor.execute("""
                    UPDATE Possui
                    SET desconto = %s
                    WHERE id_plano = %s
                """, (desconto, id_plano))

            
            valores = PlanoMensal.calcular_valores_plano(id_plano)  

            return jsonify({
                'message': 'Desconto atualizado com sucesso',
                'desconto_percentual': desconto,
                **valores
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def verificar_uso_plano(id_plano, cpf_usuario):
        """Verifica uso de serviços do plano pelo cliente"""
        try:
            uso = PlanoMensal.verificar_uso_servicos_plano(cpf_usuario, id_plano)

            if not uso:
                return jsonify({'error': 'Plano não encontrado ou não está ativo'}), 404

            return jsonify(uso), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def planos_vencendo(cpf_usuario):
        """Lista planos próximos do vencimento"""
        try:
            dias = int(request.args.get('dias', 7))
            planos = PlanoMensal.listar_planos_proximos_vencimento(cpf_usuario, dias)

            return jsonify({
                'planos_vencendo': planos,
                'total': len(planos)
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def calcular_valores_plano(id_plano):
        """Retorna valores do plano com desconto"""
        try:
            valores = PlanoMensal.calcular_valores_plano(id_plano)
            return jsonify(valores), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def cancelar_assinatura(id_plano, cpf_usuario):
        """Cancela a assinatura de um plano (chamado pelo cliente)"""
        try:
            from backend.app.models.plano_mensal import PlanoMensal

            
            assinatura = PlanoMensal.verificar_assinatura_ativa(cpf_usuario, id_plano)

            if not assinatura:
                return jsonify({
                    'error': 'Você não tem uma assinatura ativa deste plano'
                }), 404

            
            PlanoMensal.cancelar_assinatura(cpf_usuario, id_plano)

            return jsonify({
                'message': 'Assinatura cancelada com sucesso'
            }), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
