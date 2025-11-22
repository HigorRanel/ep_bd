import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const GerenciarPlanos = () => {
  const [planos, setPlanos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Modal de edição
  const [modalEditar, setModalEditar] = useState(null);
  const [servicosEditando, setServicosEditando] = useState([]);
  const [descontoGeral, setDescontoGeral] = useState(0);

  // Estado para busca
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [planosRes, servicosRes] = await Promise.all([
        api.get('/planos'),
        api.get('/servicos')
      ]);

      setPlanos(planosRes.data);
      setServicos(servicosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = (plano) => {
    setModalEditar(plano);
    
    // Carregar serviços do plano COM seus descontos individuais
    const servicosAtuais = plano.servicos?.filter(s => s && s.id_servico) || [];
    setServicosEditando(servicosAtuais.map(s => ({
      id_servico: s.id_servico,
      quantidade: s.quantidade,
      desconto: s.desconto || 0  // IMPORTANTE: preservar desconto individual
    })));
    
    setDescontoGeral(0);
  };

  const adicionarServicoEdicao = () => {
    setServicosEditando([
      ...servicosEditando, 
      { id_servico: '', quantidade: 1, desconto: descontoGeral }
    ]);
  };

  const removerServicoEdicao = (index) => {
    setServicosEditando(servicosEditando.filter((_, i) => i !== index));
  };

  const atualizarServicoEdicao = (index, field, value) => {
    const novos = [...servicosEditando];
    novos[index][field] = value;
    setServicosEditando(novos);
  };

  // Aplicar desconto geral a todos os serviços
  const aplicarDescontoGeralEdicao = () => {
    if (servicosEditando.length === 0) {
      setMessage({ type: 'warning', text: 'Adicione pelo menos um serviço primeiro' });
      return;
    }

    const novosServicos = servicosEditando.map(s => ({
      ...s,
      desconto: descontoGeral
    }));
    setServicosEditando(novosServicos);
    setMessage({ type: 'success', text: `Desconto de ${descontoGeral}% aplicado a todos!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const salvarEdicao = async () => {
    if (servicosEditando.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um serviço' });
      return;
    }

    const servicosValidos = servicosEditando.filter(s => s.id_servico && s.quantidade > 0);

    if (servicosValidos.length === 0) {
      setMessage({ type: 'error', text: 'Configure os serviços corretamente' });
      return;
    }

    // Validar descontos
    for (const servico of servicosValidos) {
      const desc = parseFloat(servico.desconto || 0);
      if (desc < 0 || desc > 100) {
        setMessage({ type: 'error', text: 'Todos os descontos devem ser entre 0 e 100' });
        return;
      }
    }

    try {
      await api.put(`/planos/${modalEditar.id_plano_mensal}`, {
        servicos: servicosValidos.map(s => ({
          id_servico: parseInt(s.id_servico),
          quantidade: parseInt(s.quantidade),
          desconto: parseFloat(s.desconto || 0)  // IMPORTANTE: enviar desconto individual
        })),
        desconto: 0  // Não usado, mas mantém compatibilidade
      });

      setMessage({ type: 'success', text: 'Plano atualizado com sucesso!' });
      setModalEditar(null);
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar plano'
      });
    }
  };

  const deletarPlano = async (idPlano) => {
    if (!window.confirm('Deseja realmente deletar este plano? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/planos/${idPlano}`);
      setMessage({ type: 'success', text: 'Plano deletado com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao deletar plano'
      });
    }
  };

  const calcularValorTotalEdicao = () => {
    return servicosEditando.reduce((total, servSel) => {
      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
      if (servico && servSel.quantidade) {
        const valorSemDesconto = parseFloat(servico.preco) * parseInt(servSel.quantidade);
        const desconto = parseFloat(servSel.desconto || 0);
        const valorDesconto = valorSemDesconto * (desconto / 100);
        return total + (valorSemDesconto - valorDesconto);
      }
      return total;
    }, 0);
  };

  const calcularValorSemDescontoEdicao = () => {
    return servicosEditando.reduce((total, servSel) => {
      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
      if (servico && servSel.quantidade) {
        return total + (parseFloat(servico.preco) * parseInt(servSel.quantidade));
      }
      return total;
    }, 0);
  };

  // Planos filtrados
  const planosFiltrados = planos.filter(plano => {
    if (!termoBusca.trim()) return true;
    
    const termo = termoBusca.toLowerCase();
    const idMatch = plano.id_plano_mensal.toString().includes(termo);
    const criadorMatch = plano.criador_nome && plano.criador_nome.toLowerCase().includes(termo);
    const servicosMatch = plano.servicos && plano.servicos.some(s => 
      s && s.nome && s.nome.toLowerCase().includes(termo)
    );
    
    return idMatch || criadorMatch || servicosMatch;
  });

  if (loading) {
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
          <div>
            <h1>Gerenciar Planos Mensais</h1>
            <p>Edite ou exclua planos existentes</p>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Barra de Busca */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>🔍 Buscar Plano</label>
            <input
              type="text"
              placeholder="Buscar por ID, criador ou serviço..."
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
            {termoBusca && (
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                Mostrando <strong>{planosFiltrados.length}</strong> de <strong>{planos.length}</strong> planos
              </small>
            )}
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="dashboard-section">
          <h2>Planos Cadastrados ({planos.length})</h2>
          
          {planosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>
                {termoBusca 
                  ? 'Nenhum plano encontrado com os termos de busca' 
                  : 'Nenhum plano cadastrado'
                }
              </p>
              {termoBusca && (
                <button 
                  onClick={() => setTermoBusca('')} 
                  className="btn btn-secondary"
                  style={{ marginTop: '10px' }}
                >
                  Limpar Busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid-2">
              {planosFiltrados.map(plano => {
                // Valores já calculados pelo backend
                const valorSemDesconto = plano.valor_sem_desconto || 0;
                const valorComDesconto = plano.valor_com_desconto || 0;
                const economiaTotal = plano.valor_desconto_total || 0;
                const descontoMedio = plano.desconto_medio || 0;
                
                return (
                  <div key={plano.id_plano_mensal} className="card">
                    <div className="card-header">
                      <div>
                        <h3>Plano #{plano.id_plano_mensal}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                          Criado por: {plano.criador_nome}
                        </p>
                        {descontoMedio > 0 && (
                          <span style={{ 
                            display: 'inline-block',
                            marginTop: '5px',
                            padding: '2px 8px',
                            backgroundColor: '#e8f5e9',
                            color: '#27ae60',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            Média {descontoMedio.toFixed(0)}% OFF
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {economiaTotal > 0 && (
                          <small style={{ 
                            color: '#95a5a6', 
                            textDecoration: 'line-through',
                            display: 'block'
                          }}>
                            R$ {valorSemDesconto.toFixed(2)}
                          </small>
                        )}
                        <h3 style={{ color: '#27ae60', margin: 0 }}>
                          R$ {valorComDesconto.toFixed(2)}
                        </h3>
                        {economiaTotal > 0 && (
                          <small style={{ color: '#666', fontSize: '10px' }}>
                            economize R$ {economiaTotal.toFixed(2)}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="card-body">
                      {plano.servicos && plano.servicos.length > 0 && (
                        <>
                          <strong>Serviços inclusos:</strong>
                          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            {plano.servicos.map((servico, idx) => (
                              servico && servico.nome && (
                                <li key={idx}>
                                  {servico.quantidade}x {servico.nome}
                                  {servico.desconto > 0 && (
                                    <span style={{ 
                                      marginLeft: '8px',
                                      color: '#27ae60',
                                      fontWeight: 'bold',
                                      fontSize: '12px'
                                    }}>
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
                      <button
                        onClick={() => abrirModalEditar(plano)}
                        className="btn btn-primary btn-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => deletarPlano(plano.id_plano_mensal)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Edição */}
        {modalEditar && (
          <div className="modal-overlay" onClick={() => setModalEditar(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <h3>Editar Plano #{modalEditar.id_plano_mensal}</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Configure os serviços inclusos no plano e seus descontos individuais
              </p>

              {/* Desconto Geral */}
              <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
                <h4>💰 Aplicar Desconto Geral (Opcional)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Desconto (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={descontoGeral}
                      onChange={(e) => setDescontoGeral(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={aplicarDescontoGeralEdicao}
                    className="btn btn-secondary"
                    disabled={servicosEditando.length === 0}
                    style={{ height: '42px' }}
                  >
                    Aplicar a Todos
                  </button>
                </div>
              </div>

              {/* Lista de Serviços */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <strong>Serviços do Plano</strong>
                  <button
                    type="button"
                    onClick={adicionarServicoEdicao}
                    className="btn btn-secondary btn-sm"
                  >
                    + Adicionar Serviço
                  </button>
                </div>

                {servicosEditando.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px' }}>
                    <p>Nenhum serviço adicionado</p>
                  </div>
                ) : (
                  servicosEditando.map((servSel, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '10px',
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        alignItems: 'end',
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Serviço</label>
                        <select
                          value={servSel.id_servico}
                          onChange={(e) => atualizarServicoEdicao(index, 'id_servico', e.target.value)}
                          required
                        >
                          <option value="">Selecione</option>
                          {servicos.map((serv) => (
                            <option key={serv.id_servico} value={serv.id_servico}>
                              {serv.nome} - R$ {parseFloat(serv.preco).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Quantidade</label>
                        <input
                          type="number"
                          value={servSel.quantidade}
                          onChange={(e) => atualizarServicoEdicao(index, 'quantidade', e.target.value)}
                          min="1"
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Desconto (%)</label>
                        <input
                          type="number"
                          value={servSel.desconto || 0}
                          onChange={(e) => atualizarServicoEdicao(index, 'desconto', e.target.value)}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removerServicoEdicao(index)}
                        className="btn btn-danger btn-sm"
                        style={{ height: '42px' }}
                      >
                        Remover
                      </button>

                      {/* Cálculo individual */}
                      {servSel.id_servico && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '5px', fontSize: '13px', color: '#666' }}>
                          {(() => {
                            const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                            if (!servico) return null;
                            
                            const valorSem = parseFloat(servico.preco) * parseInt(servSel.quantidade);
                            const desc = parseFloat(servSel.desconto || 0);
                            const valorDesc = valorSem * (desc / 100);
                            const valorCom = valorSem - valorDesc;
                            
                            return (
                              <div style={{ display: 'flex', gap: '15px' }}>
                                <span>Sem desconto: <strong>R$ {valorSem.toFixed(2)}</strong></span>
                                {desc > 0 && (
                                  <>
                                    <span style={{ color: '#e74c3c' }}>
                                      Desconto: <strong>-R$ {valorDesc.toFixed(2)}</strong>
                                    </span>
                                    <span style={{ color: '#27ae60' }}>
                                      Com desconto: <strong>R$ {valorCom.toFixed(2)}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Resumo */}
              {servicosEditando.length > 0 && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}>
                  <h4>Resumo do Plano</h4>
                  {(() => {
                    const valorSemDesc = calcularValorSemDescontoEdicao();
                    const valorComDesc = calcularValorTotalEdicao();
                    const economia = valorSemDesc - valorComDesc;
                    const descMedio = valorSemDesc > 0 ? (economia / valorSemDesc * 100) : 0;

                    return (
                      <>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                          {servicosEditando.map((servSel, idx) => {
                            const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                            if (!servico) return null;
                            const desc = parseFloat(servSel.desconto || 0);
                            return (
                              <li key={idx}>
                                {servSel.quantidade}x {servico.nome}
                                {desc > 0 && (
                                  <span style={{ color: '#27ae60', marginLeft: '5px' }}>
                                    ({desc}% OFF)
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ddd' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Valor sem desconto:</span>
                            <strong style={{ 
                              textDecoration: economia > 0 ? 'line-through' : 'none',
                              color: economia > 0 ? '#95a5a6' : '#2c3e50'
                            }}>
                              R$ {valorSemDesc.toFixed(2)}
                            </strong>
                          </div>
                          
                          {economia > 0 && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Economia ({descMedio.toFixed(1)}% médio):</span>
                                <strong style={{ color: '#e74c3c' }}>
                                  - R$ {economia.toFixed(2)}
                                </strong>
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                paddingTop: '10px',
                                borderTop: '2px solid #27ae60'
                              }}>
                                <span style={{ fontWeight: 'bold' }}>Valor Final:</span>
                                <strong style={{ fontSize: '20px', color: '#27ae60' }}>
                                  R$ {valorComDesc.toFixed(2)}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="modal-footer">
                <button onClick={salvarEdicao} className="btn btn-primary">
                  💾 Salvar Alterações
                </button>
                <button onClick={() => setModalEditar(null)} className="btn btn-secondary">
                  ✕ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciarPlanos;