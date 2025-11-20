import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MeusAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // todos, pendentes, concluidos, cancelados
  const [loading, setLoading] = useState(true);
  const [avaliacaoModal, setAvaliacaoModal] = useState(null);
  const [avaliacao, setAvaliacao] = useState({ nota: 5, comentario: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const response = await api.get('/clientes/me/agendamentos');
      console.log(response.data.data_hora_agendamento);
      // Ordenar por data (mais recentes primeiro)
      const ordenados = response.data.sort((a, b) => 
        new Date(b.data_hora_agendamento) - new Date(a.data_hora_agendamento)
      );
      setAgendamentos(ordenados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar agendamentos' });
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return;

    try {
      await api.put(`/agendamentos/${id}/cancelar`);
      setMessage({ type: 'success', text: 'Agendamento cancelado com sucesso!' });
      carregarAgendamentos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao cancelar agendamento' 
      });
    }
  };

  const abrirAvaliacao = (agendamento) => {
    setAvaliacaoModal(agendamento);
    setAvaliacao({ nota: 5, comentario: '' });
  };

  const enviarAvaliacao = async () => {
    if (!avaliacao.nota || avaliacao.nota < 1 || avaliacao.nota > 5) {
      alert('Por favor, selecione uma nota entre 1 e 5');
      return;
    }

    try {
      await api.post(`/agendamentos/${avaliacaoModal.id_agendamento}/avaliar`, avaliacao);
      setMessage({ type: 'success', text: 'Avaliação enviada com sucesso!' });
      setAvaliacaoModal(null);
      carregarAgendamentos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao enviar avaliação' 
      });
    }
  };

const formatarData = (dataString) => {
  const data = new Date(dataString);

  return {
    data: data.toLocaleDateString('pt-BR'),
    hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    completo: data.toLocaleString('pt-BR')
  };
};


  const filtrarAgendamentos = () => {
    if (filtro === 'todos') return agendamentos;
    if (filtro === 'pendentes') return agendamentos.filter(a => a.status === 'pendente' || a.status === 'confirmado');
    if (filtro === 'concluidos') return agendamentos.filter(a => a.status === 'concluido');
    if (filtro === 'cancelados') return agendamentos.filter(a => a.status === 'cancelado');
    return agendamentos;
  };

  const agendamentosFiltrados = filtrarAgendamentos();

  const renderEstrelas = (nota) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          fontSize: '24px',
          color: i < nota ? '#f39c12' : '#ddd',
          cursor: 'pointer'
        }}
        onClick={() => setAvaliacao({ ...avaliacao, nota: i + 1 })}
      >
        ★
      </span>
    ));
  };

  const podeAvaliar = (agendamento) => {
    return agendamento.status === 'concluido';
  };

  const podeCancelar = (agendamento) => {
    if (agendamento.status !== 'pendente' && agendamento.status !== 'confirmado') {
      return false;
    }
    // Verificar se falta mais de 2 horas
    const dataAgendamento = new Date(agendamento.data_hora_agendamento);
    const agora = new Date();
    const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
    return diferencaHoras > 2;
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pendente: { label: 'Pendente', color: '#f39c12', icon: '⏳' },
      confirmado: { label: 'Confirmado', color: '#3498db', icon: '✓' },
      concluido: { label: 'Concluído', color: '#27ae60', icon: '✓✓' },
      cancelado: { label: 'Cancelado', color: '#e74c3c', icon: '✗' }
    };
    return statusMap[status] || statusMap.pendente;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">Carregando seus agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Meus Agendamentos</h1>
            <p>Gerencie seus agendamentos e avalie os serviços</p>
          </div>
          <Link to="/cliente/agendar" className="btn btn-primary">
            + Novo Agendamento
          </Link>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Estatísticas */}
        <div className="stats-grid">
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
              <h3>{agendamentos.filter(a => a.status === 'pendente' || a.status === 'confirmado').length}</h3>
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

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFiltro('todos')}
              className={`btn btn-sm ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos ({agendamentos.length})
            </button>
            <button
              onClick={() => setFiltro('pendentes')}
              className={`btn btn-sm ${filtro === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pendentes ({agendamentos.filter(a => a.status === 'pendente' || a.status === 'confirmado').length})
            </button>
            <button
              onClick={() => setFiltro('concluidos')}
              className={`btn btn-sm ${filtro === 'concluidos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Concluídos ({agendamentos.filter(a => a.status === 'concluido').length})
            </button>
            <button
              onClick={() => setFiltro('cancelados')}
              className={`btn btn-sm ${filtro === 'cancelados' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Cancelados ({agendamentos.filter(a => a.status === 'cancelado').length})
            </button>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {agendamentosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>
              {filtro === 'todos' 
                ? 'Você ainda não tem agendamentos' 
                : `Você não tem agendamentos ${filtro}`}
            </p>
            <Link to="/cliente/agendar" className="btn btn-primary">
              Fazer Primeiro Agendamento
            </Link>
          </div>
        ) : (
          <div className="grid-2">
            {agendamentosFiltrados.map((agendamento) => {
              const { data, hora } = formatarData(agendamento.data_hora_agendamento);
              const statusInfo = getStatusInfo(agendamento.status);
              
              return (
                <div key={agendamento.id_agendamento} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{agendamento.servico_nome}</h3>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                        {data} às {hora}
                      </p>
                    </div>
                    <span 
                      className={`badge badge-${agendamento.status}`}
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <p><strong>Barbeiro:</strong> {agendamento.barbeiro_nome}</p>
                    <p><strong>Duração:</strong> {agendamento.duracao_estimada_min} minutos</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(agendamento.preco).toFixed(2)}</p>
                    
                    {agendamento.status === 'concluido' && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px'
                      }}>
                        <strong>✓ Serviço concluído</strong>
                      </div>
                    )}
                    
                    {agendamento.status === 'cancelado' && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        backgroundColor: '#ffebee',
                        borderRadius: '4px'
                      }}>
                        <strong>✗ Agendamento cancelado</strong>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    {podeAvaliar(agendamento) && (
                      <button 
                        onClick={() => abrirAvaliacao(agendamento)}
                        className="btn btn-success btn-sm"
                      >
                        ⭐ Avaliar Serviço
                      </button>
                    )}
                    
                    {podeCancelar(agendamento) && (
                      <button 
                        onClick={() => cancelarAgendamento(agendamento.id_agendamento)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancelar
                      </button>
                    )}
                    
                    {!podeCancelar(agendamento) && (agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                      <small style={{ color: '#e74c3c' }}>
                        ⚠️ Falta menos de 2h - não pode cancelar
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Avaliação */}
        {avaliacaoModal && (
          <div className="modal-overlay" onClick={() => setAvaliacaoModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Avaliar Serviço</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Serviço:</strong> {avaliacaoModal.servico_nome}</p>
                <p><strong>Barbeiro:</strong> {avaliacaoModal.barbeiro_nome}</p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Data:</strong> {formatarData(avaliacaoModal.data_hora_agendamento).completo}
                </p>
              </div>

              <div className="form-group">
                <label>Sua Nota (1-5 estrelas) *</label>
                <div style={{ fontSize: '24px', marginTop: '10px' }}>
                  {renderEstrelas(avaliacao.nota)}
                </div>
                <p style={{ marginTop: '10px', color: '#666' }}>
                  Nota selecionada: {avaliacao.nota} {avaliacao.nota === 1 ? 'estrela' : 'estrelas'}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="comentario">Comentário (opcional)</label>
                <textarea
                  id="comentario"
                  value={avaliacao.comentario}
                  onChange={(e) => setAvaliacao({ ...avaliacao, comentario: e.target.value })}
                  rows="4"
                  placeholder="Conte-nos sobre sua experiência..."
                  maxLength="255"
                />
                <small style={{ color: '#666' }}>
                  {avaliacao.comentario.length}/255 caracteres
                </small>
              </div>

              <div className="modal-footer">
                <button onClick={enviarAvaliacao} className="btn btn-primary">
                  Enviar Avaliação
                </button>
                <button onClick={() => setAvaliacaoModal(null)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusAgendamentos;