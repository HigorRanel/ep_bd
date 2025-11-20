import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';

const CadastrarPlano = () => {
  const [servicos, setServicos] = useState([]);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
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
      { id_servico: '', quantidade: 1 },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validações
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

    try {
      await api.post('/planos', {
        servicos: servicosValidos.map(s => ({
          id_servico: parseInt(s.id_servico),
          quantidade: parseInt(s.quantidade),
        })),
      });

      setMessage({ type: 'success', text: 'Plano criado com sucesso!' });
      setServicosSelecionados([]);
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
        return total + (parseFloat(servico.preco) * parseInt(servSel.quantidade));
      }
      return total;
    }, 0);
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Criar Plano Mensal</h2>
          <p className="form-subtitle">Configure um novo plano com serviços inclusos</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

                    <button
                      type="button"
                      onClick={() => removerServico(index)}
                      className="btn btn-danger btn-sm"
                      style={{ height: '42px' }}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>

            {servicosSelecionados.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--light)',
                  padding: '15px',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: '20px',
                }}
              >
                <h4>Resumo do Plano</h4>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  {servicosSelecionados.map((servSel, idx) => {
                    const servico = servicos.find(s => s.id_servico === parseInt(servSel.id_servico));
                    if (!servico) return null;
                    return (
                      <li key={idx}>
                        {servSel.quantidade}x {servico.nome} - R$ {(parseFloat(servico.preco) * servSel.quantidade).toFixed(2)}
                      </li>
                    );
                  })}
                </ul>
                <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>
                  Valor Total: R$ {calcularValorTotal().toFixed(2)}/mês
                </p>
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