import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MeusPlanos = () => {
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [minhasAssinaturas, setMinhasAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [planosRes, assinaturasRes] = await Promise.all([
        api.get('/planos'),
        api.get('/planos/minhas-assinaturas')
      ]);
      
      setPlanosDisponiveis(planosRes.data);
      setMinhasAssinaturas(assinaturasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const assinarPlano = async (idPlano) => {
    // Data de início: hoje
    const dataInicio = new Date().toISOString().split('T')[0];
    // Data de fim: 30 dias depois
    const dataFim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await api.post('/planos/assinar', {
        id_plano: idPlano,
        data_inicio: dataInicio,
        data_fim: dataFim
      });
      
      setMessage({ type: 'success', text: 'Plano assinado com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao assinar plano' 
      });
    }
  };

  const cancelarAssinatura = async (idPlano) => {
    if (!window.confirm('Deseja cancelar esta assinatura?')) return;

    try {
      await api.delete(`/assinaturas/cancelar/${idPlano}`);
      setMessage({ type: 'success', text: 'Assinatura cancelada com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cancelar assinatura' });
    }
  };

  const calcularValorTotal = (servicos) => {
    if (!servicos || servicos.length === 0) return 0;
    return servicos.reduce((total, s) => {
      if (s && s.preco && s.quantidade) {
        return total + (parseFloat(s.preco) * s.quantidade);
      }
      return total;
    }, 0);
  };

  const planoEstaAtivo = (dataFim) => {
    return new Date(dataFim) >= new Date();
  };

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
        <h1>Planos Mensais</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Minhas Assinaturas */}
        <div className="dashboard-section">
          <h2>Minhas Assinaturas</h2>
          {minhasAssinaturas.length === 0 ? (
            <div className="empty-state">
              <p>Você não tem assinaturas ativas</p>
            </div>
          ) : (
            <div className="grid-2">
              {minhasAssinaturas.map(assinatura => (
                <div key={assinatura.id_plano} className="card">
                  <div className="card-header">
                    <h3>Plano #{assinatura.id_plano}</h3>
                    <span className={`badge ${planoEstaAtivo(assinatura.data_fim) ? 'badge-confirmado' : 'badge-cancelado'}`}>
                      {planoEstaAtivo(assinatura.data_fim) ? 'Ativo' : 'Expirado'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Vigência:</strong> {new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')} até {new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}</p>
                    
                    {assinatura.servicos && assinatura.servicos.length > 0 && (
                      <>
                        <p><strong>Serviços inclusos:</strong></p>
                        <ul style={{ paddingLeft: '20px' }}>
                          {assinatura.servicos.map((servico, idx) => (
                            servico && servico.nome && (
                              <li key={idx}>
                                {servico.quantidade}x {servico.nome}
                              </li>
                            )
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  {planoEstaAtivo(assinatura.data_fim) && (
                    <div className="card-footer">
                      <button 
                        onClick={() => cancelarAssinatura(assinatura.id_plano)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancelar Assinatura
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planos Disponíveis */}
        <div className="dashboard-section">
          <h2>Planos Disponíveis</h2>
          {planosDisponiveis.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum plano disponível no momento</p>
            </div>
          ) : (
            <div className="grid-2">
              {planosDisponiveis.map(plano => {
                const jaAssinado = minhasAssinaturas.some(
                  a => a.id_plano === plano.id_plano_mensal && planoEstaAtivo(a.data_fim)
                );
                const valorTotal = calcularValorTotal(plano.servicos);

                return (
                  <div key={plano.id_plano_mensal} className="card">
                    <div className="card-header">
                      <h3>Plano #{plano.id_plano_mensal}</h3>
                      {valorTotal > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <small style={{ color: 'var(--gray)' }}>Valor mensal</small>
                          <h3 style={{ color: 'var(--success)', margin: 0 }}>
                            R$ {valorTotal.toFixed(2)}
                          </h3>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <p><strong>Criado por:</strong> {plano.criador_nome}</p>
                      
                      {plano.servicos && plano.servicos.length > 0 && (
                        <>
                          <p><strong>Inclui:</strong></p>
                          <ul style={{ paddingLeft: '20px' }}>
                            {plano.servicos.map((servico, idx) => (
                              servico && servico.nome && (
                                <li key={idx}>
                                  {servico.quantidade}x {servico.nome}
                                </li>
                              )
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                    <div className="card-footer">
                      <button 
                        onClick={() => assinarPlano(plano.id_plano_mensal)}
                        className="btn btn-primary btn-block"
                        disabled={jaAssinado}
                      >
                        {jaAssinado ? 'Já Assinado' : 'Assinar Plano'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeusPlanos;