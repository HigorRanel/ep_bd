from flask import request, jsonify
from backend.app.models.servico import Servico


class ServicoController:
    @staticmethod
    def criar():
        try:
            dados = request.get_json()

            campos_obrigatorios = ['nome', 'preco', 'duracao_estimada_min', 'cpf_barbeiro']
            for campo in campos_obrigatorios:
                if campo not in dados:
                    return jsonify({'error': f'Campo {campo} é obrigatório'}), 400

            # Criar serviço
            resultado = Servico.criar(
                dados['nome'],
                dados['preco'],
                dados['duracao_estimada_min'],
                dados.get('descricao')
            )

            # Associar ao barbeiro
            Servico.associar_barbeiro(resultado['id_servico'], dados['cpf_barbeiro'])

            return jsonify(resultado), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def listar():
        try:
            servicos = Servico.listar_todos()
            return jsonify(servicos), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def buscar(id_servico):
        try:
            servico = Servico.buscar_por_id(id_servico)
            if not servico:
                return jsonify({'error': 'Serviço não encontrado'}), 404
            return jsonify(servico), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def atualizar(id_servico):
        try:
            dados = request.get_json()

            # Campos permitidos para atualização
            campos_permitidos = ['nome', 'preco', 'duracao_estimada_min', 'descricao']
            dados_atualizacao = {}

            for campo in campos_permitidos:
                if campo in dados:
                    dados_atualizacao[campo] = dados[campo]

            if not dados_atualizacao:
                return jsonify({'error': 'Nenhum dado para atualizar'}), 400

            resultado = Servico.atualizar(id_servico, dados_atualizacao)

            if not resultado:
                return jsonify({'error': 'Serviço não encontrado'}), 404

            return jsonify(resultado), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @staticmethod
    def deletar(id_servico):
        try:
            # Verificar se há agendamentos ativos com este serviço
            from backend.app.utils.database import Database
            with Database.get_cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*) as total
                    FROM Agendamento a
                    JOIN Contem c ON a.id_agendamento = c.id_agen
                    WHERE c.id_serv = %s 
                    AND a.status IN ('pendente', 'confirmado')
                """, (id_servico,))

                result = cursor.fetchone()
                if result['total'] > 0:
                    return jsonify({
                        'error': 'Não é possível deletar serviço com agendamentos ativos'
                    }), 400

            Servico.deletar(id_servico)
            return jsonify({'message': 'Serviço deletado com sucesso'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500