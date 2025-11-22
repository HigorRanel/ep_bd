import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MeusPlanos = () => {
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [minhasAssinaturas, setMinhasAssinaturas] = useState([]);
  const [planosVencendo, setPlanosVencendo] = useState([]);
  const [usoPlanos, setUsoPlanos] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [modalDetalhes, setModalDetalhes] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [planosRes, assinaturasRes, vencendoRes] = await Promise.all([
        api.get('/planos'),
        api.get('/planos/minhas-assinaturas'),
        api.get('/planos/vencendo?dias=7')
      ]);

      console.log('Planos disponíveis:', planosRes.data);
      console.log('Minhas assinaturas:', assinaturasRes.data);

      setPlanosDisponiveis(planosRes.data || []);
      setMinhasAssinaturas(assinaturasRes.data || []);
      setPlanosVencendo(vencendoRes.data.planos_vencendo || []);

      if (assinaturasRes.data && assinaturasRes.data.length > 0) {
        await carregarUsoPlanos(assinaturasRes.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar planos' });
    } finally {
      setLoading(false);
    }
  };

  const carregarUsoPlanos = async (assinaturas) => {
    const usoPromises = assinaturas
      .filter(a => planoEstaAtivo(a.data_fim))
      .map(async (assinatura) => {
        try {
          const response = await api.get(`/planos/${assinatura.id_plano}/uso`);
          return { id_plano: assinatura.id_plano, uso: response.data };
        } catch (error) {
          console.error(`Erro ao carregar uso do plano ${assinatura.id_plano}:`, error);
          return { id_plano: assinatura.id_plano, uso: null };
        }
      });

    const resultados = await Promise.all(usoPromises);
    const usoMap = {};
    resultados.forEach(r => {
      usoMap[r.id_plano] = r.uso;
    });
    setUsoPlanos(usoMap);
  };

  const assinarPlano = async (idPlano) => {
    const dataInicio = new Date().toISOString().split('T')[0];
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
    if (!window.confirm('Deseja realmente cancelar esta assinatura? Esta ação não pode ser desfeita.')) return;

    try {
      await api.delete(`/planos/${idPlano}/cancelar-assinatura`);

      setMessage({ type: 'success', text: 'Assinatura cancelada com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      const mensagemErro = error.response?.data?.error || 'Erro ao cancelar assinatura';
      setMessage({ type: 'error', text: mensagemErro });
    }
  };

  const planoEstaAtivo = (dataFim) => {
    return new Date(dataFim) >= new Date();
  };

  const calcularDiasRestantes = (dataFim) => {
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diff = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const abrirDetalhesPlano = async (idPlano) => {
    try {
      setMessage({ type: '', text: '' });

      const [valoresRes, planoRes] = await Promise.all([
        api.get(`/planos/${idPlano}/valores`),
        api.get(`/planos/${idPlano}`)
      ]);

      setModalDetalhes({
        ...planoRes.data,
        valores: valoresRes.data
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      console.error('Response:', error.response);

      const mensagemErro = error.response?.data?.error || 'Erro ao carregar detalhes do plano';
      setMessage({ type: 'error', text: mensagemErro });
    }
  };

  const renderUsoServico = (servico) => {
    const porcentagemUso = (servico.quantidade_usada / servico.quantidade_plano) * 100;
    const corBarra = porcentagemUso >= 100 ? '#e74c3c' :
      porcentagemUso >= 75 ? '#f39c12' : '#27ae60';

    return (
      <div key={servico.id_servico} style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div>
            <strong>{servico.nome_servico}</strong>
            {servico.desconto_percentual > 0 && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: '#e8f5e9',
                color: '#27ae60',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {servico.desconto_percentual}% OFF
              </span>
            )}
          </div>
          <span>
            {servico.quantidade_usada}/{servico.quantidade_plano}
            {servico.esgotado && ' ⚠️ Esgotado'}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#ecf0f1',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(porcentagemUso, 100)}%`,
            height: '100%',
            backgroundColor: corBarra,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Planos Mensais</h1>
          <p>Gerencie suas assinaturas e economize nos serviços</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {planosVencendo.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '30px' }}>
            <h4 style={{ marginTop: 0 }}>⚠️ Atenção: Planos Próximos do Vencimento</h4>
            {planosVencendo.map(plano => (
              <div key={plano.id_plano} style={{ marginTop: '10px' }}>
                <strong>Plano #{plano.id_plano}</strong> vence em{' '}
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {Math.ceil(plano.dias_restantes)} {Math.ceil(plano.dias_restantes) === 1 ? 'dia' : 'dias'}
                </span>
                {' '}({new Date(plano.data_fim).toLocaleDateString('pt-BR')})
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-section">
          <h2>Minhas Assinaturas ({minhasAssinaturas.length})</h2>
          {minhasAssinaturas.length === 0 ? (
            <div className="empty-state">
              <p>Você não tem assinaturas ativas</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Assine um plano abaixo e economize nos seus cortes!
              </p>
            </div>
          ) : (
            <div className="grid-2">
              {minhasAssinaturas.map(assinatura => {
                const ativo = planoEstaAtivo(assinatura.data_fim);
                const diasRestantes = calcularDiasRestantes(assinatura.data_fim);
                const uso = usoPlanos[assinatura.id_plano];

                const valorComDesconto = assinatura.valor_com_desconto || 0;
                const valorSemDesconto = assinatura.valor_sem_desconto || 0;
                const economiaTotal = assinatura.valor_desconto_total || 0;
                const descontoMedio = assinatura.desconto_medio || 0;

                return (
                  <div key={assinatura.id_plano} className="card">
                    <div className="card-header">
                      <div>
                        <h3>Plano #{assinatura.id_plano}</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                          💰 R$ {valorComDesconto.toFixed(2)}/mês
                          {economiaTotal > 0 && (
                            <span style={{ color: '#27ae60', marginLeft: '8px' }}>
                              (economize R$ {economiaTotal.toFixed(2)})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`badge ${ativo ? 'badge-confirmado' : 'badge-cancelado'}`}>
                        {ativo ? '✓ Ativo' : '✗ Expirado'}
                      </span>
                    </div>

                    <div className="card-body">
                      <p>
                        <strong>Vigência:</strong>{' '}
                        {new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}
                      </p>

                      {ativo && diasRestantes <= 7 && (
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#fff3cd',
                          borderRadius: '4px',
                          marginTop: '10px',
                          marginBottom: '10px'
                        }}>
                          <strong>⏰ Vence em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}!</strong>
                        </div>
                      )}

                      {ativo && uso && uso.servicos && (
                        <div style={{ marginTop: '15px' }}>
                          <strong style={{ display: 'block', marginBottom: '10px' }}>
                            📊 Uso dos Serviços:
                          </strong>
                          {uso.servicos.map(servico => renderUsoServico(servico))}
                        </div>
                      )}

                      {assinatura.servicos && assinatura.servicos.length > 0 && !ativo && (
                        <>
                          <p style={{ marginTop: '15px' }}><strong>Serviços inclusos:</strong></p>
                          <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                            {assinatura.servicos.map((servico, idx) => (
                              servico && servico.nome && (
                                <li key={idx}>
                                  {servico.quantidade}x {servico.nome}
                                  {servico.desconto > 0 && (
                                    <span style={{ color: '#27ae60', marginLeft: '5px' }}>
                                      ({servico.desconto}% OFF)
                                    </span>
                                  )}
                                </li>
                              )
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    <div className="card-footer">
                      {ativo && (
                        <button
                          onClick={() => cancelarAssinatura(assinatura.id_plano)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar Assinatura
                        </button>
                      )}
                      <button
                        onClick={() => abrirDetalhesPlano(assinatura.id_plano)}
                        className="btn btn-secondary btn-sm"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Planos Disponíveis ({planosDisponiveis.length})</h2>
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

                const valorSemDesconto = plano.valor_sem_desconto || 0;
                const valorComDesconto = plano.valor_com_desconto || 0;
                const economiaTotal = plano.valor_desconto_total || 0;
                const descontoMedio = plano.desconto_medio || 0;

                return (
                  <div key={plano.id_plano_mensal} className="card">
                    <div className="card-header">
                      <div>
                        <h3>Plano #{plano.id_plano_mensal}</h3>
                        {descontoMedio > 0 && (
                          <span style={{
                            backgroundColor: '#27ae60',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            display: 'inline-block'
                          }}>
                            🎉 Média {descontoMedio.toFixed(0)}% OFF
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {economiaTotal > 0 ? (
                          <>
                            <small style={{
                              color: '#95a5a6',
                              textDecoration: 'line-through',
                              display: 'block'
                            }}>
                              R$ {valorSemDesconto.toFixed(2)}
                            </small>
                            <h3 style={{ color: '#27ae60', margin: 0 }}>
                              R$ {valorComDesconto.toFixed(2)}
                            </h3>
                            <small style={{ color: '#666', fontSize: '11px' }}>
                              Economia de R$ {economiaTotal.toFixed(2)}
                            </small>
                          </>
                        ) : (
                          <>
                            <small style={{ color: '#666' }}>Valor mensal</small>
                            <h3 style={{ color: '#27ae60', margin: 0 }}>
                              R$ {valorSemDesconto.toFixed(2)}
                            </h3>
                          </>
                        )}
                      </div>
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
                                  <span style={{ color: '#666', fontSize: '12px' }}>
                                    {' '}(R$ {parseFloat(servico.preco).toFixed(2)} cada)
                                  </span>
                                  {servico.desconto > 0 && (
                                    <span style={{ color: '#27ae60', marginLeft: '5px', fontWeight: 'bold' }}>
                                      {servico.desconto}% OFF
                                    </span>
                                  )}
                                </li>
                              )
                            ))}
                          </ul>
                        </>
                      )}

                      {economiaTotal > 0 && (
                        <div style={{
                          marginTop: '15px',
                          padding: '10px',
                          backgroundColor: '#e8f5e9',
                          borderRadius: '4px'
                        }}>
                          <strong style={{ color: '#27ae60' }}>
                            💰 Economize R$ {economiaTotal.toFixed(2)}/mês assinando este plano!
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      <button
                        onClick={() => assinarPlano(plano.id_plano_mensal)}
                        className="btn btn-primary btn-block"
                        disabled={jaAssinado}
                      >
                        {jaAssinado ? '✓ Já Assinado' : 'Assinar Plano'}
                      </button>
                      {!jaAssinado && (
                        <button
                          onClick={() => abrirDetalhesPlano(plano.id_plano_mensal)}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '10px' }}
                        >
                          Ver Detalhes
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {modalDetalhes && (
          <div className="modal-overlay" onClick={() => setModalDetalhes(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Detalhes do Plano #{modalDetalhes.id_plano_mensal}</h3>

              <div style={{ marginBottom: '20px' }}>
                <p><strong>Criado por:</strong> {modalDetalhes.criador_nome}</p>

                {modalDetalhes.valores && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ marginTop: 0 }}>💰 Valores</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Valor sem desconto:</span>
                        <strong style={{
                          textDecoration: modalDetalhes.valores.valor_desconto_total > 0 ? 'line-through' : 'none',
                          color: modalDetalhes.valores.valor_desconto_total > 0 ? '#95a5a6' : '#2c3e50'
                        }}>
                          R$ {modalDetalhes.valores.valor_sem_desconto.toFixed(2)}
                        </strong>
                      </div>

                      {modalDetalhes.valores.valor_desconto_total > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Desconto total ({modalDetalhes.valores.desconto_medio.toFixed(1)}% médio):</span>
                            <strong style={{ color: '#e74c3c' }}>
                              - R$ {modalDetalhes.valores.valor_desconto_total.toFixed(2)}
                            </strong>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '2px solid #ddd'
                          }}>
                            <span><strong>Valor Final:</strong></span>
                            <strong style={{ fontSize: '20px', color: '#27ae60' }}>
                              R$ {modalDetalhes.valores.valor_com_desconto.toFixed(2)}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {modalDetalhes.servicos && modalDetalhes.servicos.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>📋 Serviços Inclusos</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                      {modalDetalhes.servicos.map((servico, idx) => {
                        if (!servico || !servico.nome) return null;

                        const valorSem = parseFloat(servico.preco) * servico.quantidade;
                        const desc = parseFloat(servico.desconto || 0);
                        const valorDesc = valorSem * (desc / 100);
                        const valorCom = valorSem - valorDesc;

                        return (
                          <li key={idx} style={{ marginBottom: '10px' }}>
                            <strong>{servico.quantidade}x</strong> {servico.nome}
                            {desc > 0 && (
                              <span style={{
                                marginLeft: '8px',
                                padding: '2px 6px',
                                backgroundColor: '#e8f5e9',
                                color: '#27ae60',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {desc}% OFF
                              </span>
                            )}
                            <br />
                            <small style={{ color: '#666' }}>
                              R$ {parseFloat(servico.preco).toFixed(2)} cada
                              {desc > 0 && (
                                <span>
                                  {' '}| Sem desconto: R$ {valorSem.toFixed(2)} | Com desconto: <strong style={{ color: '#27ae60' }}>R$ {valorCom.toFixed(2)}</strong>
                                </span>
                              )}
                              {desc === 0 && ' | R$ ' + valorSem.toFixed(2) + ' total'}
                            </small>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button onClick={() => setModalDetalhes(null)} className="btn btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: '40px', backgroundColor: '#f8f9fa' }}>
          <h3>ℹ️ Como Funcionam os Planos</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li><strong>Assinatura Mensal:</strong> Os planos têm duração de 30 dias</li>
            <li><strong>Serviços Inclusos:</strong> Cada plano inclui uma quantidade específica de serviços</li>
            <li><strong>Descontos:</strong> Cada serviço pode ter um desconto individual diferente</li>
            <li><strong>Uso Controlado:</strong> Você pode acompanhar quantos serviços já utilizou</li>
            <li><strong>Alertas de Vencimento:</strong> Receba avisos quando seu plano estiver próximo do vencimento</li>
            <li><strong>Renovação:</strong> Após o vencimento, você pode assinar novamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MeusPlanos;