import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Icon from '../common/Icon';
import api from '../../services/api';
import '../../styles/dashboard.css';

const DetalhesCliente = () => {
  const { cpf } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarEncaixe, setMostrarEncaixe] = useState(false);

  const [servicos, setServicos] = useState([]);
  const [formEncaixe, setFormEncaixe] = useState({
    id_servico: '',
    data: '',
    horario: ''
  });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarDados();
    carregarServicos();
  }, [cpf]);

  useEffect(() => {
    if (formEncaixe.id_servico && formEncaixe.data) {
      carregarHorariosDisponiveis();
    }
  }, [formEncaixe.id_servico, formEncaixe.data]);

  const carregarDados = async () => {
    try {
      const response = await api.get(`/clientes/${cpf}/detalhes`);
      setCliente(response.data.cliente);
      setHistorico(response.data.historico);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarServicos = async () => {
    try {
      const response = await api.get('/barbeiros/me/servicos');
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const carregarHorariosDisponiveis = async () => {
    try {
      setLoadingHorarios(true);

      const cpf_barbeiro = user.cpf;

      const servico = servicos.find(s => s.id_servico === parseInt(formEncaixe.id_servico));

      const response = await api.get('/agendamentos/horarios-disponiveis', {
        params: {
          cpf_barbeiro,
          data: formEncaixe.data,
          duracao_servico_min: servico?.duracao_estimada_min || 30
        }
      });

      setHorariosDisponiveis(response.data.horarios_disponiveis);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setHorariosDisponiveis([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const realizarEncaixe = async () => {
    if (!formEncaixe.id_servico || !formEncaixe.data || !formEncaixe.horario) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }

    try {
      const cpf_barbeiro = user.cpf;

      await api.post('/agendamentos', {
        data_hora_agendamento: `${formEncaixe.data} ${formEncaixe.horario}:00`,
        cpf_cliente: cpf,
        cpf_barbeiro,
        id_servico: parseInt(formEncaixe.id_servico),
        status: 'pendente'
      });

      setMessage({ type: 'success', text: 'Encaixe realizado com sucesso!' });
      setMostrarEncaixe(false);
      setFormEncaixe({ id_servico: '', data: '', horario: '' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao realizar encaixe'
      });
    }
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const renderEstrelas = (nota) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        filled={i < nota}
        size={16}
        style={{ color: i < nota ? 'var(--color-accent)' : 'var(--color-border)' }}
      />
    ));
  };

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

  if (!cliente) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="dashboard-container">
          <div className="empty-state">
            <p>Cliente não encontrado</p>
            <button onClick={() => navigate('/barbeiro/clientes')} className="btn btn-primary">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const accent = { color: 'var(--color-accent)' };
  const muted = { color: 'var(--color-text-muted)' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{cliente.nome_completo}</h1>
            <p>Detalhes e histórico do cliente</p>
          </div>
          <button onClick={() => navigate('/barbeiro/clientes')} className="btn btn-secondary">
            Voltar
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Informações do Cliente */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon"><Icon name="check" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{cliente.total_atendimentos}</h3>
              <p>Atendimentos concluídos</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="x" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{cliente.total_faltas}</h3>
              <p>Faltas registradas</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="calendar" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3 style={{ fontSize: '18px' }}>
                {cliente.ultima_visita
                  ? new Date(cliente.ultima_visita).toLocaleDateString('pt-BR')
                  : 'Nunca'
                }
              </h3>
              <p>Última visita</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="star" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{parseFloat(cliente.media_avaliacoes || 0).toFixed(1)}</h3>
              <p>Média de avaliações</p>
              <small style={{ fontSize: '11px', ...muted }}>
                {cliente.total_avaliacoes} avaliação(ões)
              </small>
            </div>
          </div>
        </div>

        {/* Dados de Contato */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Dados de contato</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', ...muted, marginBottom: '5px' }}>
                Email
              </strong>
              <span>{cliente.email}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', ...muted, marginBottom: '5px' }}>
                Telefone
              </strong>
              <span>{cliente.telefone || 'Não informado'}</span>
            </div>
            {cliente.endereco && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ display: 'block', fontSize: '12px', ...muted, marginBottom: '5px' }}>
                  Endereço
                </strong>
                <span>{cliente.endereco}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão para Realizar Encaixe */}
        <button
          onClick={() => setMostrarEncaixe(!mostrarEncaixe)}
          className={mostrarEncaixe ? 'btn btn-secondary' : 'btn btn-success'}
          style={{ marginBottom: '20px' }}
        >
          {mostrarEncaixe ? 'Cancelar encaixe' : '+ Realizar encaixe'}
        </button>

        {/* Formulário de Encaixe */}
        {mostrarEncaixe && (
          <div className="card" style={{ marginBottom: '30px', background: 'var(--color-surface-2)' }}>
            <h3>Realizar encaixe para {cliente.nome_completo}</h3>

            <div style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Serviço *</label>
                <select
                  value={formEncaixe.id_servico}
                  onChange={(e) => setFormEncaixe({ ...formEncaixe, id_servico: e.target.value, horario: '' })}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map(s => (
                    <option key={s.id_servico} value={s.id_servico}>
                      {s.nome} - R$ {parseFloat(s.preco).toFixed(2)} ({s.duracao_estimada_min} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data *</label>
                <input
                  type="date"
                  value={formEncaixe.data}
                  onChange={(e) => setFormEncaixe({ ...formEncaixe, data: e.target.value, horario: '' })}
                  min={getMinDate()}
                  required
                />
              </div>

              {formEncaixe.id_servico && formEncaixe.data && (
                <div className="form-group">
                  <label>Horário *</label>
                  {loadingHorarios ? (
                    <p>Carregando horários...</p>
                  ) : horariosDisponiveis.length === 0 ? (
                    <p style={{ color: 'var(--color-danger)' }}>Nenhum horário disponível nesta data</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                      {horariosDisponiveis.map(horario => (
                        <button
                          key={horario}
                          type="button"
                          onClick={() => setFormEncaixe({ ...formEncaixe, horario })}
                          className={`btn btn-sm ${formEncaixe.horario === horario ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {horario}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={realizarEncaixe}
                className="btn btn-success"
                disabled={!formEncaixe.id_servico || !formEncaixe.data || !formEncaixe.horario}
              >
                Confirmar encaixe
              </button>
            </div>
          </div>
        )}

        {/* Histórico de Agendamentos */}
        <div className="dashboard-section">
          <h2>Histórico de atendimentos ({historico.length})</h2>

          {historico.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum histórico de atendimento</p>
            </div>
          ) : (
            <div className="grid-2">
              {historico.map((item) => (
                <div key={item.id_agendamento} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{item.servico_nome}</h3>
                      <p style={{ margin: '5px 0 0 0', ...muted, fontSize: '13px' }}>
                        {formatarData(item.data_hora_agendamento)}
                      </p>
                    </div>
                    <span className={`badge badge-${item.status}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="card-body">
                    <p><strong>Barbeiro:</strong> {item.barbeiro_nome}</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(item.preco).toFixed(2)}</p>

                    {item.nota && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: 'var(--color-surface-2)',
                        borderRadius: '6px'
                      }}>
                        <strong>Avaliação:</strong>
                        <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                          {renderEstrelas(item.nota)}
                        </div>
                        {item.comentario && (
                          <p style={{ marginTop: '5px', fontSize: '13px', fontStyle: 'italic' }}>
                            "{item.comentario}"
                          </p>
                        )}
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

export default DetalhesCliente;