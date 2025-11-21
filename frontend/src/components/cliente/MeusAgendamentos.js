import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MeusAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [avaliacoesExistentes, setAvaliacoesExistentes] = useState(new Set());
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [avaliacaoModal, setAvaliacaoModal] = useState(null);
  const [avaliacao, setAvaliacao] = useState({ nota: 5, comentario: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  // Estados para busca
  const [termoBusca, setTermoBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes'); // recentes, antigas

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  // Resetar página ao mudar filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtro, termoBusca]);

  const carregarAgendamentos = async () => {
    try {
      const response = await api.get('/clientes/me/agendamentos');
      
      // Ordenar por data (mais recentes primeiro)
      const ordenados = response.data.sort((a, b) => 
        new Date(b.data_hora_agendamento) - new Date(a.data_hora_agendamento)
      );
      
      setAgendamentos(ordenados);
      
      // Verificar avaliações existentes para cada agendamento
      await verificarAvaliacoesExistentes(ordenados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar agendamentos' });
    } finally {
      setLoading(false);
    }
  };

  const verificarAvaliacoesExistentes = async (listaAgendamentos) => {
    const avaliacoes = new Set();
    
    // Verificar apenas agendamentos concluídos
    const concluidos = listaAgendamentos.filter(a => a.status === 'concluido');
    
    for (const agendamento of concluidos) {
      try {
        const response = await api.get(`/avaliacoes/agendamento/${agendamento.id_agendamento}`);
        if (response.data) {
          avaliacoes.add(agendamento.id_agendamento);
        }
      } catch (error) {
        // Se retornar 404, significa que não tem avaliação
        if (error.response?.status !== 404) {
          console.error('Erro ao verificar avaliação:', error);
        }
      }
    }
    
    setAvaliacoesExistentes(avaliacoes);
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
    let filtrados = [...agendamentos];

    // Filtro por status
    if (filtro === 'pendentes') {
      filtrados = filtrados.filter(a => a.status === 'pendente' || a.status === 'confirmado');
    } else if (filtro === 'concluidos') {
      filtrados = filtrados.filter(a => a.status === 'concluido');
    } else if (filtro === 'cancelados') {
      filtrados = filtrados.filter(a => a.status === 'cancelado');
    }

    // Busca por termo
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.servico_nome.toLowerCase().includes(termo) ||
        a.barbeiro_nome.toLowerCase().includes(termo)
      );
    }

    // Ordenação
    if (ordenacao === 'antigas') {
      filtrados.sort((a, b) => 
        new Date(a.data_hora_agendamento) - new Date(b.data_hora_agendamento)
      );
    } else {
      filtrados.sort((a, b) => 
        new Date(b.data_hora_agendamento) - new Date(a.data_hora_agendamento)
      );
    }

    return filtrados;
  };

  const agendamentosFiltrados = filtrarAgendamentos();

  // Cálculo da paginação
  const totalPaginas = Math.ceil(agendamentosFiltrados.length / itensPorPagina);
  const indexUltimo = paginaAtual * itensPorPagina;
  const indexPrimeiro = indexUltimo - itensPorPagina;
  const agendamentosPaginados = agendamentosFiltrados.slice(indexPrimeiro, indexUltimo);

  const mudarPagina = (numeroPagina) => {
    setPaginaAtual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    return agendamento.status === 'concluido' && !avaliacoesExistentes.has(agendamento.id_agendamento);
  };

  const jaAvaliou = (agendamento) => {
    return avaliacoesExistentes.has(agendamento.id_agendamento);
  };

  const podeCancelar = (agendamento) => {
    if (agendamento.status !== 'pendente' && agendamento.status !== 'confirmado') {
      return false;
    }
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

        {/* Filtros e Busca */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>🔍 Filtros e Busca</h3>
            
            {/* Busca */}
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Buscar por serviço ou barbeiro..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Filtros por Status */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
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

            {/* Ordenação */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Ordenar por:</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
              </select>
            </div>
          </div>

          {/* Info de resultados */}
          <div style={{ 
            paddingTop: '15px', 
            borderTop: '1px solid #ecf0f1',
            color: '#666',
            fontSize: '14px'
          }}>
            Mostrando <strong>{agendamentosPaginados.length}</strong> de <strong>{agendamentosFiltrados.length}</strong> agendamentos
          </div>
        </div>

        {/* Lista de Agendamentos */}
        {agendamentosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>
              {filtro === 'todos' && !termoBusca
                ? 'Você ainda não tem agendamentos' 
                : 'Nenhum agendamento encontrado com os filtros aplicados'}
            </p>
            {!termoBusca && (
              <Link to="/cliente/agendar" className="btn btn-primary">
                Fazer Primeiro Agendamento
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid-2">
              {agendamentosPaginados.map((agendamento) => {
                const { data, hora } = formatarData(agendamento.data_hora_agendamento);
                const statusInfo = getStatusInfo(agendamento.status);
                const avaliado = jaAvaliou(agendamento);
                
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
                          backgroundColor: avaliado ? '#e3f2fd' : '#e8f5e9',
                          borderRadius: '4px'
                        }}>
                          <strong>{avaliado ? '⭐ Já avaliado' : '✓ Serviço concluído'}</strong>
                          {avaliado && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                              Você já avaliou este agendamento
                            </p>
                          )}
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
                      
                      {avaliado && (
                        <button 
                          disabled
                          className="btn btn-sm"
                          style={{ 
                            backgroundColor: '#e0e0e0', 
                            color: '#666',
                            cursor: 'not-allowed',
                            opacity: 0.6
                          }}
                          title="Você já avaliou este agendamento"
                        >
                          ✓ Já Avaliado
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

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="card" style={{ marginTop: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => mudarPagina(1)}
                      disabled={paginaAtual === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      ««
                    </button>

                    <button
                      onClick={() => mudarPagina(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      « Anterior
                    </button>

                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaAtual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaAtual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaAtual - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => mudarPagina(pageNum)}
                          className={`btn btn-sm ${
                            pageNum === paginaAtual ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => mudarPagina(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginas}
                      className="btn btn-secondary btn-sm"
                    >
                      Próxima »
                    </button>

                    <button
                      onClick={() => mudarPagina(totalPaginas)}
                      disabled={paginaAtual === totalPaginas}
                      className="btn btn-secondary btn-sm"
                    >
                      »»
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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