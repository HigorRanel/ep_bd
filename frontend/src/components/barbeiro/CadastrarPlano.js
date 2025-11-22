import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';

const CadastrarPlano = () => {
  const [servicos, setServicos] = useState([]);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    try {
      const response = await api.get('/servicos');
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const adicionarServico = () => {
    setServicosSelecionados([
      ...servicosSelecionados,
      { id_servico: '', quantidade: 1, desconto: descontoGeral }
    ]);
  };

  const removerServico = (index) => {
    setServicosSelecionados(servicosSelecionados.filter((_, i) => i !== index));
  };

  const atualizarServico = (index, field, value) => {
    const novosServicos = [...servicosSelecionados];
    novosServicos[index][field] = value;
    setServicosSelecionados(novosServicos);
  };

  // Aplicar desconto geral a todos os serviços
  const aplicarDescontoGeral = () => {
    if (servicosSelecionados.length === 0) {
      setMessage({ type: 'warning', text: 'Adicione pelo menos um serviço primeiro' });
      return;
    }

    const novosServicos = servicosSelecionados.map(s => ({
      ...s,
      desconto: descontoGeral
    }));
    setServicosSelecionados(novosServicos);
    setMessage({ type: 'success', text: `Desconto de ${descontoGeral}% aplicado a todos os serviços!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (servicosSelecionados.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um serviço ao plano' });
      setLoading(false);
      return;
    }

    const servicosValidos = servicosSelecionados.filter(
      s => s.id_servico && s.quantidade > 0
    );

    if (servicosValidos.length === 0) {
      setMessage({ type: 'error', text: 'Configure os serviços corretamente' });
      setLoading(false);
      return;
    }

    // Validar descontos
    for (const servico of servicosValidos) {
      const desc = parseFloat(servico.desconto || 0);
      if (desc < 0 || desc > 100) {
        setMessage({ type: 'error', text: 'Todos os descontos devem ser entre 0 e 100' });
        setLoading(false);
        return;
      }
    }

    try {
      // Enviar com desconto=0 pois cada serviço tem seu próprio desconto
      await api.post('/planos', {
        servicos: servicosValidos.map(s => ({
          id_servico: parseInt(s.id_servico),
          quantidade: parseInt(s.quantidade),
          desconto: parseFloat(s.desconto || 0)
        })),
        desconto: 0 // Não usado, mas mantém compatibilidade
      });

      setMessage({ type: 'success', text: 'Plano criado com sucesso!' });
      setServicosSelecionados([]);
      setDescontoGeral(0);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao criar plano',
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularValorTotal = () => {
    return servicosSelecionados.reduce((total, servSel) => {
      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
      if (servico && servSel.quantidade) {
        const valorSemDesconto = parseFloat(servico.preco) * parseInt(servSel.quantidade);
        const desconto = parseFloat(servSel.desconto || 0);
        const valorDesconto = valorSemDesconto * (desconto / 100);
        const valorComDesconto = valorSemDesconto - valorDesconto;
        return total + valorComDesconto;
      }
      return total;
    }, 0);
  };

  const calcularValorSemDesconto = () => {
    return servicosSelecionados.reduce((total, servSel) => {
      const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
      if (servico && servSel.quantidade) {
        return total + (parseFloat(servico.preco) * parseInt(servSel.quantidade));
      }
      return total;
    }, 0);
  };

  const valorSemDesconto = calcularValorSemDesconto();
  const valorComDesconto = calcularValorTotal();
  const economiaTotal = valorSemDesconto - valorComDesconto;
  const descontoMedio = valorSemDesconto > 0 ? (economiaTotal / valorSemDesconto * 100) : 0;

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Criar Plano Mensal</h2>
          <p className="form-subtitle">Configure um novo plano com serviços inclusos e descontos individuais</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Desconto Geral (Aplicar a Todos) */}
            <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
              <h3>💰 Desconto Geral (Opcional)</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                Configure um desconto que pode ser aplicado a todos os serviços de uma vez
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="descontoGeral">Desconto (%)</label>
                  <input
                    type="number"
                    id="descontoGeral"
                    min="0"
                    max="100"
                    step="0.01"
                    value={descontoGeral}
                    onChange={(e) => setDescontoGeral(e.target.value)}
                    placeholder="Ex: 15 para 15% de desconto"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={aplicarDescontoGeral}
                  className="btn btn-secondary"
                  disabled={servicosSelecionados.length === 0}
                  style={{ height: '42px' }}
                >
                  Aplicar a Todos
                </button>
              </div>
              
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '10px' }}>
                💡 Dica: Você também pode configurar descontos diferentes para cada serviço individualmente
              </small>
            </div>

            {/* Lista de Serviços */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Serviços do Plano</h3>
                <button
                  type="button"
                  onClick={adicionarServico}
                  className="btn btn-secondary btn-sm"
                >
                  + Adicionar Serviço
                </button>
              </div>

              {servicosSelecionados.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p>Nenhum serviço adicionado. Clique em "Adicionar Serviço"</p>
                </div>
              ) : (
                servicosSelecionados.map((servSel, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr auto',
                      gap: '10px',
                      marginBottom: '15px',
                      alignItems: 'end',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Serviço</label>
                      <select
                        value={servSel.id_servico}
                        onChange={(e) => atualizarServico(index, 'id_servico', e.target.value)}
                        required
                      >
                        <option value="">Selecione um serviço</option>
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
                        onChange={(e) => atualizarServico(index, 'quantidade', e.target.value)}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Desconto (%)</label>
                      <input
                        type="number"
                        value={servSel.desconto || 0}
                        onChange={(e) => atualizarServico(index, 'desconto', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removerServico(index)}
                      className="btn btn-danger btn-sm"
                      style={{ height: '42px' }}
                    >
                      Remover
                    </button>

                    {/* Mostrar cálculo individual do serviço */}
                    {servSel.id_servico && (
                      <div style={{ gridColumn: '1 / -1', marginTop: '10px', fontSize: '13px' }}>
                        {(() => {
                          const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                          if (!servico) return null;
                          
                          const valorSem = parseFloat(servico.preco) * parseInt(servSel.quantidade);
                          const desc = parseFloat(servSel.desconto || 0);
                          const valorDesc = valorSem * (desc / 100);
                          const valorCom = valorSem - valorDesc;
                          
                          return (
                            <div style={{ display: 'flex', gap: '15px', color: '#666' }}>
                              <span>
                                Sem desconto: <strong>R$ {valorSem.toFixed(2)}</strong>
                              </span>
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

            {/* Resumo do Plano */}
            {servicosSelecionados.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--light)',
                  padding: '20px',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: '20px',
                }}
              >
                <h4>📋 Resumo do Plano</h4>
                
                <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
                  {servicosSelecionados.map((servSel, idx) => {
                    const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                    if (!servico) return null;
                    
                    const valorSem = parseFloat(servico.preco) * servSel.quantidade;
                    const desc = parseFloat(servSel.desconto || 0);
                    
                    return (
                      <li key={idx} style={{ marginBottom: '8px' }}>
                        <strong>{servSel.quantidade}x</strong> {servico.nome}
                        {desc > 0 && (
                          <span style={{ color: '#27ae60', marginLeft: '10px' }}>
                            ({desc}% OFF)
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Valor sem desconto:</span>
                    <strong style={{ 
                      textDecoration: economiaTotal > 0 ? 'line-through' : 'none',
                      color: economiaTotal > 0 ? '#95a5a6' : '#2c3e50'
                    }}>
                      R$ {valorSemDesconto.toFixed(2)}
                    </strong>
                  </div>
                  
                  {economiaTotal > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Economia total ({descontoMedio.toFixed(1)}% médio):</span>
                        <strong style={{ color: '#e74c3c' }}>
                          - R$ {economiaTotal.toFixed(2)}
                        </strong>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '2px solid var(--accent)',
                        marginTop: '10px'
                      }}>
                        <span style={{ fontWeight: 'bold' }}>Valor Final:</span>
                        <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                          R$ {valorComDesconto.toFixed(2)}/mês
                        </strong>
                      </div>
                      <div style={{ 
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px'
                      }}>
                        <small style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          🎉 Economia de R$ {economiaTotal.toFixed(2)} por mês ({descontoMedio.toFixed(1)}%)!
                        </small>
                      </div>
                    </>
                  )}
                  
                  {economiaTotal === 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '2px solid #ddd',
                      marginTop: '10px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Valor Total:</span>
                      <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                        R$ {valorSemDesconto.toFixed(2)}/mês
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || servicosSelecionados.length === 0}
            >
              {loading ? 'Criando...' : 'Criar Plano'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastrarPlano;