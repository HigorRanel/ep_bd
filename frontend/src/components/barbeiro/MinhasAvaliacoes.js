import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MinhasAvaliacoes = () => {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [estatisticas, setEstatisticas] = useState({
    media_nota: 0,
    total_avaliacoes: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    page: 1,
    per_page: 10,
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [avaliacoesRes, mediaRes] = await Promise.all([
        api.get('/avaliacoes/me', {
          params: {
            page: filtros.page,
            per_page: filtros.per_page,
            data_inicio: filtros.data_inicio || undefined,
            data_fim: filtros.data_fim || undefined
          }
        }),
        api.get('/avaliacoes/me/media'),
      ]);

      setAvaliacoes(avaliacoesRes.data.avaliacoes);
      setPagination({
        total: avaliacoesRes.data.total_avaliacoes,
        has_next: avaliacoesRes.data.tem_proxima,
        has_prev: avaliacoesRes.data.tem_anterior,
        page: avaliacoesRes.data.pagina_atual,
        pages: avaliacoesRes.data.total_paginas,

      });
      setEstatisticas(mediaRes.data);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };
  const renderEstrelas = (nota) => {
    const estrelas = [];
    for (let i = 1; i <= 5; i++) {
      estrelas.push(
        <span
          key={i}
          style={{
            color: i <= nota ? '#f39c12' : '#ddd',
            fontSize: '20px',
          }}
        >
          ★
        </span>
      );
    }
    return estrelas;
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const calcularDistribuicao = () => {
    const distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    // Nota: Esta distribuição é baseada apenas nas avaliações da página atual
    // Para ter uma distribuição completa, seria necessário um endpoint específico
    avaliacoes.forEach((av) => {
      distribuicao[av.nota]++;
    });
    return distribuicao;
  };

  const distribuicao = calcularDistribuicao();

  const limparFiltros = () => {
    setFiltros({
      page: 1,
      per_page: 10,
      data_inicio: '',
      data_fim: ''
    });
  };

  const mudarPagina = (novaPagina) => {
    setFiltros({ ...filtros, page: novaPagina });
  };

  if (loading && filtros.page === 1) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Minhas Avaliações</h1>
          <p>Veja o feedback dos seus clientes</p>
        </div>

        {/* Estatísticas */}
        <div className="stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{parseFloat(estatisticas.media_nota || 0).toFixed(1)}</h3>
              <p>Média de Avaliações</p>
              <div>{renderEstrelas(Math.round(estatisticas.media_nota))}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{estatisticas.total_avaliacoes || 0}</h3>
              <p>Total de Avaliações</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{distribuicao[5]}</h3>
              <p>Avaliações 5 Estrelas</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Filtros</h3>
            {(filtros.data_inicio || filtros.data_fim) && (
              <button onClick={limparFiltros} className="btn btn-secondary btn-sm">
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data Início</label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value, page: 1 })}
              />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value, page: 1 })}
              />
            </div>
          </div>

          {pagination.total !== undefined && (
            <div style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
              Mostrando {avaliacoes.length} de {pagination.total} avaliações
            </div>
          )}
        </div>

        {/* Lista de Avaliações */}
        <div className="dashboard-section">
          <h2>Avaliações</h2>
          {avaliacoes.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma avaliação encontrada</p>
            </div>
          ) : (
            <>
              <div className="grid-2">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id_agen} className="card">
                    <div className="card-header">
                      <div>
                        <h3>{avaliacao.cliente_nome}</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                          {formatarData(avaliacao.data_hora_agendamento)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {renderEstrelas(avaliacao.nota)}
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>
                          {avaliacao.nota}/5
                        </p>
                      </div>
                    </div>
                    <div className="card-body">
                      <p><strong>Serviço:</strong> {avaliacao.servico_nome}</p>
                      {avaliacao.comentario && (
                        <div
                          style={{
                            marginTop: '15px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            fontStyle: 'italic',
                          }}
                        >
                          "{avaliacao.comentario}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div className="card" style={{ marginTop: '30px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div style={{ color: '#666' }}>
                      Página {pagination.page} de {pagination.pages}
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => mudarPagina(1)}
                        disabled={!pagination.has_prev}
                        className="btn btn-secondary btn-sm"
                      >
                        ««
                      </button>

                      <button
                        onClick={() => mudarPagina(pagination.page - 1)}
                        disabled={!pagination.has_prev}
                        className="btn btn-secondary btn-sm"
                      >
                        « Anterior
                      </button>

                      <button
                        onClick={() => mudarPagina(pagination.page + 1)}
                        disabled={!pagination.has_next}
                        className="btn btn-secondary btn-sm"
                      >
                        Próxima »
                      </button>

                      <button
                        onClick={() => mudarPagina(pagination.pages)}
                        disabled={!pagination.has_next}
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
        </div>
      </div>
    </div>
  );
};

export default MinhasAvaliacoes;