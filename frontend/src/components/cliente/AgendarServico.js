import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';
import '../../styles/agendamento.css';

const AgendarServico = () => {
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [formData, setFormData] = useState({
    cpf_barbeiro: '',
    id_servico: '',
    data: '',
    horario: ''
  });
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const [podeUsarPlano, setPodeUsarPlano] = useState(false);
  const [infoPlano, setInfoPlano] = useState(null);
  const [usarPlano, setUsarPlano] = useState(false);

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  useEffect(() => {
    if (formData.cpf_barbeiro && formData.data && servicoSelecionado) {
      carregarHorariosDisponiveis();
    } else {
      setHorariosDisponiveis([]);
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  }, [formData.cpf_barbeiro, formData.data, servicoSelecionado]);

  const verificarPlano = async (idServico) => {
    if (!idServico) {
      setPodeUsarPlano(false);
      setInfoPlano(null);
      return;
    }

    try {
      const response = await api.get(`/planos/pode-agendar/${idServico}`);

      if (response.data.pode_usar_plano) {
        setPodeUsarPlano(true);
        setInfoPlano(response.data);
      } else {
        setPodeUsarPlano(false);
        setInfoPlano(response.data);
      }
    } catch (error) {
      setPodeUsarPlano(false);
      setInfoPlano(null);
    }
  };

  const carregarBarbeiros = async () => {
    try {
      const response = await api.get('/barbeiros');
      setBarbeiros(response.data);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar barbeiros' });
    }
  };

  const carregarServicos = async (cpfBarbeiro) => {
    try {
      const response = await api.get('/servicos');
      const todosServicos = response.data;

      const servicosDoBarbeiro = todosServicos.filter(servico => {
        return servico.barbeiros && servico.barbeiros.some(nome => {
          const barbeiro = barbeiros.find(b => b.cpf === cpfBarbeiro);
          return barbeiro && nome === barbeiro.nome_completo;
        });
      });

      setServicos(servicosDoBarbeiro);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar serviços' });
    }
  };

  const carregarHorariosDisponiveis = async () => {
    try {
      setLoadingHorarios(true);
      const response = await api.get('/agendamentos/horarios-disponiveis', {
        params: {
          cpf_barbeiro: formData.cpf_barbeiro,
          data: formData.data,
          duracao_servico_min: servicoSelecionado.duracao_estimada_min
        }
      });

      setHorariosDisponiveis(response.data.horarios_disponiveis);

      if (response.data.horarios_disponiveis.length === 0) {
        setMessage({
          type: 'warning',
          text: 'Não há horários disponíveis nesta data. Tente outra data.'
        });
      } else {
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao carregar horários disponíveis'
      });
      setHorariosDisponiveis([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleBarbeiroChange = (e) => {
    const cpf = e.target.value;
    setFormData({
      cpf_barbeiro: cpf,
      id_servico: '',
      data: '',
      horario: ''
    });
    setServicoSelecionado(null);
    setHorariosDisponiveis([]);
    if (cpf) {
      carregarServicos(cpf);
    } else {
      setServicos([]);
    }
  };

  const handleServicoChange = (e) => {
    const idServico = e.target.value;
    setFormData({ ...formData, id_servico: idServico, horario: '' });

    if (idServico) {
      const servico = servicos.find(s => s.id_servico === parseInt(idServico));
      setServicoSelecionado(servico);
      verificarPlano(idServico);
    } else {
      setServicoSelecionado(null);
      setPodeUsarPlano(false);
      setInfoPlano(null);
    }

    setUsarPlano(false);
  };

  const handleDataChange = (e) => {
    setFormData({ ...formData, data: e.target.value, horario: '' });
  };

  const handleHorarioClick = (horario) => {
    setFormData({ ...formData, horario });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const meRes = await api.get('/clientes/me');
      const cpfCliente = meRes.data.cpf;
      const dataHoraFormatada = `${formData.data} ${formData.horario}:00`;

      await api.post('/agendamentos', {
        data_hora_agendamento: dataHoraFormatada,
        cpf_cliente: cpfCliente,
        cpf_barbeiro: formData.cpf_barbeiro,
        id_servico: parseInt(formData.id_servico),
        status: 'pendente',
        usar_plano: usarPlano
      });

      setMessage({ type: 'success', text: 'Agendamento realizado com sucesso!' });

      setFormData({
        cpf_barbeiro: '',
        id_servico: '',
        data: '',
        horario: ''
      });
      setServicoSelecionado(null);
      setServicos([]);
      setHorariosDisponiveis([]);
      setPodeUsarPlano(false);
      setInfoPlano(null);
      setUsarPlano(false);

      setTimeout(() => navigate('/cliente/agendamentos'), 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao agendar serviço'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const getMaxDate = () => {
    const hoje = new Date();
    const maxData = new Date(hoje.setMonth(hoje.getMonth() + 3));
    const ano = maxData.getFullYear();
    const mes = String(maxData.getMonth() + 1).padStart(2, '0');
    const dia = String(maxData.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const barbeiroSelecionado = barbeiros.find(b => b.cpf === formData.cpf_barbeiro);

  const agruparHorariosPorPeriodo = () => {
    const grupos = {
      manha: [],
      tarde: [],
      noite: []
    };

    horariosDisponiveis.forEach(horario => {
      const hora = parseInt(horario.split(':')[0]);
      if (hora < 12) {
        grupos.manha.push(horario);
      } else if (hora < 18) {
        grupos.tarde.push(horario);
      } else {
        grupos.noite.push(horario);
      }
    });

    return grupos;
  };

  const horariosPorPeriodo = agruparHorariosPorPeriodo();

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Agendar Serviço</h2>
          <p className="form-subtitle">Escolha o barbeiro, serviço, data e horário desejado</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="agendamento-step">
              <div className="step-header">
                <span className="step-number">1</span>
                <h3>Escolha o Barbeiro</h3>
              </div>

              <div className="form-group">
                <label htmlFor="barbeiro">Barbeiro *</label>
                <select
                  id="barbeiro"
                  value={formData.cpf_barbeiro}
                  onChange={handleBarbeiroChange}
                  required
                >
                  <option value="">Selecione um barbeiro</option>
                  {barbeiros.map(barbeiro => (
                    <option key={barbeiro.cpf} value={barbeiro.cpf}>
                      {barbeiro.nome_completo}
                      {barbeiro.is_chefe && ' ⭐ (Chefe)'}
                    </option>
                  ))}
                </select>
              </div>

              {barbeiroSelecionado && (
                <div className="info-box">
                  <h4>Sobre o Barbeiro</h4>
                  <p><strong>Email:</strong> {barbeiroSelecionado.email}</p>
                  <p><strong>Telefone:</strong> {barbeiroSelecionado.telefone || 'Não informado'}</p>
                  <p><strong>Trabalhando desde:</strong> {new Date(barbeiroSelecionado.data_inicio).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            {formData.cpf_barbeiro && (
              <div className="agendamento-step">
                <div className="step-header">
                  <span className="step-number">2</span>
                  <h3>Escolha o Serviço</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="servico">Serviço *</label>
                  <select
                    id="servico"
                    value={formData.id_servico}
                    onChange={handleServicoChange}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {servicos.map(servico => (
                      <option key={servico.id_servico} value={servico.id_servico}>
                        {servico.nome} - R$ {parseFloat(servico.preco).toFixed(2)} ({servico.duracao_estimada_min} min)
                      </option>
                    ))}
                  </select>
                </div>

                {servicoSelecionado && (
                  <div className="info-box info-box-success">
                    <h4>{servicoSelecionado.nome}</h4>
                    {servicoSelecionado.descricao && (
                      <p style={{ fontStyle: 'italic', color: '#666', marginTop: '10px' }}>
                        {servicoSelecionado.descricao}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '30px', marginTop: '15px' }}>
                      <div>
                        <strong>Preço:</strong>
                        <p style={{ fontSize: '24px', color: '#27ae60', margin: '5px 0 0 0' }}>
                          R$ {parseFloat(servicoSelecionado.preco).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <strong>Duração:</strong>
                        <p style={{ fontSize: '24px', color: '#3498db', margin: '5px 0 0 0' }}>
                          {servicoSelecionado.duracao_estimada_min} min
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {servicoSelecionado && podeUsarPlano && infoPlano && (
                  <div className="agendamento-step">
                    <div className="info-box info-box-success">
                      <h4>🎉 Você Pode Usar Seu Plano!</h4>
                      <p style={{ marginTop: '10px' }}>
                        Você tem um plano ativo que inclui este serviço.
                      </p>

                      <div style={{
                        padding: '10px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        marginTop: '10px'
                      }}>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Disponível:</strong> {infoPlano.uso.quantidade_disponivel} de {infoPlano.uso.quantidade_plano} serviços
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Já utilizados:</strong> {infoPlano.uso.quantidade_usada}
                        </p>
                      </div>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '15px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        <input
                          type="checkbox"
                          checked={usarPlano}
                          onChange={(e) => setUsarPlano(e.target.checked)}
                          style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                        />
                        <span style={{ color: '#27ae60' }}>
                          ✓ Usar meu plano para este agendamento
                        </span>
                      </label>

                      {usarPlano && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px',
                          backgroundColor: '#e8f5e9',
                          borderRadius: '4px'
                        }}>
                          <strong style={{ color: '#27ae60' }}>
                            💰 Economia aplicada! Você não será cobrado por este serviço.
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {servicoSelecionado && !podeUsarPlano && infoPlano && infoPlano.motivo && (
                  <div className="agendamento-step">
                    <div className="info-box" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #f39c12' }}>
                      <h4>ℹ️ Informação sobre Plano</h4>
                      <p>{infoPlano.motivo}</p>

                      {infoPlano.uso && (
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Usado:</strong> {infoPlano.uso.quantidade_usada} de {infoPlano.uso.quantidade_plano}
                          </p>
                          <p style={{ margin: '5px 0', color: '#e74c3c', fontWeight: 'bold' }}>
                            ⚠️ Limite do plano atingido para este mês
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {servicoSelecionado && (
              <div className="agendamento-step">
                <div className="step-header">
                  <span className="step-number">3</span>
                  <h3>Escolha a Data</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="data">Data *</label>
                  <input
                    type="date"
                    id="data"
                    value={formData.data}
                    onChange={handleDataChange}
                    required
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Você pode agendar até {new Date(getMaxDate()).toLocaleDateString('pt-BR')}
                  </small>
                </div>
              </div>
            )}

            {formData.data && (
              <div className="agendamento-step">
                <div className="step-header">
                  <span className="step-number">4</span>
                  <h3>Escolha o Horário</h3>
                </div>

                {loadingHorarios ? (
                  <div className="loading-container" style={{ minHeight: '200px' }}>
                    <div className="spinner"></div>
                    <p>Carregando horários disponíveis...</p>
                  </div>
                ) : horariosDisponiveis.length === 0 ? (
                  <div className="empty-state">
                    <p>😞 Não há horários disponíveis nesta data</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Tente selecionar outra data
                    </p>
                  </div>
                ) : (
                  <div className="horarios-container">
                    {horariosPorPeriodo.manha.length > 0 && (
                      <div className="periodo-horarios">
                        <h4>🌅 Manhã</h4>
                        <div className="horarios-grid">
                          {horariosPorPeriodo.manha.map(horario => (
                            <button
                              key={horario}
                              type="button"
                              className={`horario-btn ${formData.horario === horario ? 'selected' : ''}`}
                              onClick={() => handleHorarioClick(horario)}
                            >
                              {horario}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {horariosPorPeriodo.tarde.length > 0 && (
                      <div className="periodo-horarios">
                        <h4>☀️ Tarde</h4>
                        <div className="horarios-grid">
                          {horariosPorPeriodo.tarde.map(horario => (
                            <button
                              key={horario}
                              type="button"
                              className={`horario-btn ${formData.horario === horario ? 'selected' : ''}`}
                              onClick={() => handleHorarioClick(horario)}
                            >
                              {horario}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {horariosPorPeriodo.noite.length > 0 && (
                      <div className="periodo-horarios">
                        <h4>🌙 Noite</h4>
                        <div className="horarios-grid">
                          {horariosPorPeriodo.noite.map(horario => (
                            <button
                              key={horario}
                              type="button"
                              className={`horario-btn ${formData.horario === horario ? 'selected' : ''}`}
                              onClick={() => handleHorarioClick(horario)}
                            >
                              {horario}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {formData.cpf_barbeiro && formData.id_servico && formData.data && formData.horario && (
              <div className="agendamento-step">
                <div className={`info-box ${usarPlano ? 'info-box-success' : 'info-box-warning'}`}>
                  <h4>📋 Resumo do Agendamento</h4>
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Barbeiro:</strong> {barbeiroSelecionado?.nome_completo}</p>
                    <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
                    <p><strong>Data:</strong> {new Date(formData.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                    <p><strong>Horário:</strong> {formData.horario}</p>
                    <p><strong>Duração:</strong> {servicoSelecionado?.duracao_estimada_min} minutos</p>

                    {usarPlano ? (
                      <div style={{
                        marginTop: '15px',
                        paddingTop: '15px',
                        borderTop: '2px solid #27ae60'
                      }}>
                        <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '18px' }}>
                          ✓ Usando Plano - SEM CUSTO
                        </p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Este agendamento será coberto pelo seu plano ativo
                        </p>
                      </div>
                    ) : (
                      <p style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #f39c12' }}>
                        <strong>Valor Total:</strong>{' '}
                        <span style={{ fontSize: '24px', color: '#27ae60' }}>
                          R$ {servicoSelecionado ? parseFloat(servicoSelecionado.preco).toFixed(2) : '0.00'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading || !formData.horario}
              >
                {loading ? 'Agendando...' : '✅ Confirmar Agendamento'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/cliente/dashboard')}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="info-box" style={{ marginTop: '30px' }}>
            <h4>💡 Dicas Importantes:</h4>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Escolha a data e veja os horários disponíveis em tempo real</li>
              <li>Horários ocupados não aparecerão na seleção</li>
              <li>Você pode agendar com até 3 meses de antecedência</li>
              <li>Você pode cancelar até 2 horas antes do agendamento</li>
              <li>Chegue com 5 minutos de antecedência</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendarServico;