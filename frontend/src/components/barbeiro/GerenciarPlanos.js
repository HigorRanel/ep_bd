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

  // NOVO: Estado para desconto no modal de edição
  const [novoDesconto, setNovoDesconto] = useState(0);

  // NOVO: Estado para busca
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

  // MODIFICADA: função abrirModalEditar para carregar desconto
  const abrirModalEditar = (plano) => {
    setModalEditar(plano);
    // Carregar serviços do plano
    const servicosAtuais = plano.servicos?.filter(s => s && s.id_servico) || [];
    setServicosEditando(servicosAtuais.map(s => ({
      id_servico: s.id_servico,
      quantidade: s.quantidade
    })));
    
    // NOVO: Carregar desconto atual
    const descontoAtual = plano.servicos && plano.servicos[0] ? plano.servicos[0].desconto : 0;
    setNovoDesconto(descontoAtual);
  };

  const adicionarServicoEdicao = () => {
    setServicosEditando([...servicosEditando, { id_servico: '', quantidade: 1 }]);
  };

  const removerServicoEdicao = (index) => {
    setServicosEditando(servicosEditando.filter((_, i) => i !== index));
  };

  const atualizarServicoEdicao = (index, field, value) => {
    const novos = [...servicosEditando];
    novos[index][field] = value;
    setServicosEditando(novos);
  };

  // MODIFICADA: função salvarEdicao para incluir desconto
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

    // NOVO: Validar desconto
    const descontoNum = parseFloat(novoDesconto);
    if (descontoNum < 0 || descontoNum > 100) {
      setMessage({ type: 'error', text: 'Desconto deve ser entre 0 e 100' });
      return;
    }

    try {
      await api.put(`/planos/${modalEditar.id_plano_mensal}`, {
        servicos: servicosValidos.map(s => ({
          id_servico: parseInt(s.id_servico),
          quantidade: parseInt(s.quantidade)
        })),
        desconto: descontoNum // NOVO
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

  const calcularValorTotal = (servicos) => {
    if (!servicos || servicos.length === 0) return 0;
    return servicos.reduce((total, s) => {
      if (s && s.preco && s.quantidade) {
        return total + (parseFloat(s.preco) * s.quantidade);
      }
      return total;
    }, 0);
  };

  const calcularValorTotalEdicao = () => {
    return servicosEditando.reduce((total, servSel) => {
      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
      if (servico && servSel.quantidade) {
        return total + (parseFloat(servico.preco) * parseInt(servSel.quantidade));
      }
      return total;
    }, 0);
  };

  // NOVO: Função para filtrar planos
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

        {/* Lista de Planos */}
        <div className="dashboard-section">
          <h2>Planos Cadastrados ({planos.length})</h2>
          
          {/* NOVO: Barra de Busca */}
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
                const valorTotal = calcularValorTotal(plano.servicos);
                
                return (
                  <div key={plano.id_plano_mensal} className="card">
                    <div className="card-header">
                      <div>
                        <h3>Plano #{plano.id_plano_mensal}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                          Criado por: {plano.criador_nome}
                        </p>
                      </div>
                      {valorTotal > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <small style={{ color: '#666' }}>Valor mensal</small>
                          <h3 style={{ color: '#27ae60', margin: 0 }}>
                            R$ {valorTotal.toFixed(2)}
                          </h3>
                        </div>
                      )}
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
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Editar Plano #{modalEditar.id_plano_mensal}</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Configure os serviços inclusos no plano
              </p>

              {/* NOVO: Campo de Desconto no Modal de Edição */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>
                  💰 Desconto do Plano (%)
                  <small style={{ color: '#666', fontWeight: 'normal', marginLeft: '10px' }}>
                    Deixe 0 para sem desconto
                  </small>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={novoDesconto}
                  onChange={(e) => setNovoDesconto(e.target.value)}
                  placeholder="Ex: 15 para 15% de desconto"
                />
                <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                  Valor entre 0 e 100. Será aplicado sobre o valor total dos serviços.
                </small>
              </div>

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
                        gridTemplateColumns: '2fr 1fr auto',
                        gap: '10px',
                        marginBottom: '15px',
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

                      <button
                        type="button"
                        onClick={() => removerServicoEdicao(index)}
                        className="btn btn-danger btn-sm"
                        style={{ height: '42px' }}
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* MODIFICADO: Resumo do Plano para mostrar desconto */}
              {servicosEditando.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <h4>Resumo do Plano</h4>
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    {servicosEditando.map((servSel, idx) => {
                      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                      if (!servico) return null;
                      return (
                        <li key={idx}>
                          {servSel.quantidade}x {servico.nome} - R$ {(parseFloat(servico.preco) * servSel.quantidade).toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                  
                  {/* NOVO: Cálculos com desconto */}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ddd' }}>
                    {(() => {
                      const valorSemDesconto = calcularValorTotalEdicao();
                      const descontoNum = parseFloat(novoDesconto) || 0;
                      const valorDesconto = valorSemDesconto * (descontoNum / 100);
                      const valorComDesconto = valorSemDesconto - valorDesconto;
                      
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span>Valor sem desconto:</span>
                            <strong style={{ 
                              textDecoration: descontoNum > 0 ? 'line-through' : 'none',
                              color: descontoNum > 0 ? '#95a5a6' : '#2c3e50'
                            }}>
                              R$ {valorSemDesconto.toFixed(2)}
                            </strong>
                          </div>
                          
                          {descontoNum > 0 && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Desconto ({descontoNum.toFixed(2)}%):</span>
                                <strong style={{ color: '#e74c3c' }}>
                                  - R$ {valorDesconto.toFixed(2)}
                                </strong>
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                paddingTop: '10px',
                                borderTop: '2px solid #27ae60',
                                marginTop: '10px'
                              }}>
                                <span style={{ fontWeight: 'bold' }}>Valor Final:</span>
                                <strong style={{ fontSize: '20px', color: '#27ae60' }}>
                                  R$ {valorComDesconto.toFixed(2)}/mês
                                </strong>
                              </div>
                              <div style={{ 
                                marginTop: '10px',
                                padding: '8px',
                                backgroundColor: '#e8f5e9',
                                borderRadius: '4px'
                              }}>
                                <small style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                  🎉 Economia de R$ {valorDesconto.toFixed(2)} por mês!
                                </small>
                              </div>
                            </>
                          )}
                          
                          {descontoNum === 0 && (
                            <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                              Valor Total: R$ {valorSemDesconto.toFixed(2)}/mês
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
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