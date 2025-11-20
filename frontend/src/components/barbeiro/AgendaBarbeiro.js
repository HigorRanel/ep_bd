import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const AgendaBarbeiro = () => {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtros, setFiltros] = useState({
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarAgenda();
  }, [filtros]);

  const carregarAgenda = async () => {
    try {
      const params = {};
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;

      const response = await api.get(`/agendamentos/barbeiro/${user.cpf}`, { params });
      setAgendamentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (idAgendamento, novoStatus) => {
    try {
      await api.put(`/agendamentos/${idAgendamento}/status`, { status: novoStatus });
      setMessage({ type: 'success', text: 'Status atualizado!' });
      carregarAgenda();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar status' });
    }
  };

  const formatarDataHora = (dataString) => {
    const data = new Date(dataString);
    return {
      data: data.toLocaleDateString('pt-BR'),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const agruparPorData = () => {
    const grupos = {};
    agendamentos.forEach((ag) => {
      const { data } = formatarDataHora(ag.data_hora_agendamento);
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(ag);
    });

    // Ordenar agendamentos dentro de cada dia
    Object.keys(grupos).forEach((data) => {
      grupos[data].sort((a, b) => 
        new Date(a.data_hora_agendamento) - new Date(b.data_hora_agendamento)
      );
    });

    return grupos;
  };

  const agendamentosPorData = agruparPorData();

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Minha Agenda</h1>
          <p>Gerencie seus atendimentos</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Filtros</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Data Início</label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={() => setFiltros({ data_inicio: '', data_fim: '' })}
            className="btn btn-secondary btn-sm"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Estatísticas */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{agendamentos.length}</h3>
              <p>Total de Agendamentos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{agendamentos.filter(a => a.status === 'pendente').length}</h3>
              <p>Pendentes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{agendamentos.filter(a => a.status === 'concluido').length}</h3>
              <p>Concluídos</p>
            </div>
          </div>
        </div>

        {/* Agenda Agrupada por Data */}
        {Object.keys(agendamentosPorData).length === 0 ? (
          <div className="empty-state">
            <p>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          Object.keys(agendamentosPorData).sort().map((data) => (
            <div key={data} className="dashboard-section">
              <h2>{data}</h2>
              <div className="grid-2">
                {agendamentosPorData[data].map((agendamento) => {
                  const { hora } = formatarDataHora(agendamento.data_hora_agendamento);
                  return (
                    <div key={agendamento.id_agendamento} className="card">
                      <div className="card-header">
                        <h3>{hora} - {agendamento.cliente_nome}</h3>
                        <span className={`badge badge-${agendamento.status}`}>
                          {agendamento.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <p><strong>Serviço:</strong> {agendamento.servico_nome}</p>
                        <p><strong>Duração:</strong> {agendamento.duracao_estimada_min} minutos</p>
                        <p><strong>Preço:</strong> R$ {parseFloat(agendamento.preco).toFixed(2)}</p>
                        <p><strong>Telefone:</strong> {agendamento.cliente_telefone || 'Não informado'}</p>
                        <p><strong>Origem:</strong> {agendamento.cpf_origem === user.cpf ? 'Encaixe' : 'Cliente'}</p>
                      </div>
                      {agendamento.status === 'pendente' && (
                        <div className="card-footer">
                          <button
                            onClick={() => atualizarStatus(agendamento.id_agendamento, 'confirmado')}
                            className="btn btn-success btn-sm"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => atualizarStatus(agendamento.id_agendamento, 'concluido')}
                            className="btn btn-primary btn-sm"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => atualizarStatus(agendamento.id_agendamento, 'cancelado')}
                            className="btn btn-danger btn-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      {agendamento.status === 'confirmado' && (
                        <div className="card-footer">
                          <button
                            onClick={() => atualizarStatus(agendamento.id_agendamento, 'concluido')}
                            className="btn btn-primary btn-sm"
                          >
                            Marcar como Concluído
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgendaBarbeiro;