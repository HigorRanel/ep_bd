import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MinhasAvaliacoes = () => {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    media_nota: 0,
    total_avaliacoes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [avaliacoesRes, mediaRes] = await Promise.all([
        api.get('/avaliacoes/me'),
        api.get('/avaliacoes/me/media'),
      ]);

      setAvaliacoes(avaliacoesRes.data);
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
    avaliacoes.forEach((av) => {
      distribuicao[av.nota]++;
    });
    return distribuicao;
  };

  const distribuicao = calcularDistribuicao();

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

        {/* Distribuição de Notas */}
        <div className="card" style={{ marginBottom: '40px' }}>
          <h3>Distribuição de Notas</h3>
          <div style={{ marginTop: '20px' }}>
            {[5, 4, 3, 2, 1].map((nota) => {
              const total = estatisticas.total_avaliacoes || 1;
              const porcentagem = (distribuicao[nota] / total) * 100;
              
              return (
                <div
                  key={nota}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px',
                  }}
                >
                  <span style={{ minWidth: '80px' }}>
                    {nota} estrelas
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '25px',
                      backgroundColor: '#ecf0f1',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${porcentagem}%`,
                        height: '100%',
                        backgroundColor: '#f39c12',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ minWidth: '60px', textAlign: 'right' }}>
                    {distribuicao[nota]} ({porcentagem.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="dashboard-section">
          <h2>Todas as Avaliações</h2>
          {avaliacoes.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não recebeu avaliações</p>
            </div>
          ) : (
            <div className="grid-2">
              {avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id_agen} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{avaliacao.cliente_nome}</h3>
                      <p style={{ margin: 0, color: 'var(--gray)', fontSize: '12px' }}>
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
                          backgroundColor: 'var(--light)',
                          borderRadius: 'var(--border-radius)',
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
          )}
        </div>
      </div>
    </div>
  );
};

export default MinhasAvaliacoes;