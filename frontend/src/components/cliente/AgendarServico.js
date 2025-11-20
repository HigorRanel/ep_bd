import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';

const AgendarServico = () => {
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [formData, setFormData] = useState({
    cpf_barbeiro: '',
    id_servico: '',
    data_hora_agendamento: '',
  });
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    carregarBarbeiros();
  }, []);

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
      // Buscar todos os serviços e filtrar os do barbeiro
      const response = await api.get('/servicos');
      const todosServicos = response.data;
      
      // Filtrar serviços oferecidos pelo barbeiro selecionado
      const servicosDoBarbeiro = todosServicos.filter(servico => {
        // Verificar se o barbeiro está na lista de barbeiros que oferecem o serviço
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

  const handleBarbeiroChange = (e) => {
    const cpf = e.target.value;
    setFormData({ ...formData, cpf_barbeiro: cpf, id_servico: '' });
    setServicoSelecionado(null);
    if (cpf) {
      carregarServicos(cpf);
    } else {
      setServicos([]);
    }
  };

  const handleServicoChange = (e) => {
    const idServico = e.target.value;
    setFormData({ ...formData, id_servico: idServico });
    
    if (idServico) {
      const servico = servicos.find(s => s.id_servico === parseInt(idServico));
      setServicoSelecionado(servico);
    } else {
      setServicoSelecionado(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Buscar CPF do cliente logado
      const meRes = await api.get('/clientes/me');
      const cpfCliente = meRes.data.cpf;

      // Formatar data e hora para o formato correto
      const dataHoraFormatada = formData.data_hora_agendamento.replace('T', ' ') + ':00';

      await api.post('/agendamentos', {
        data_hora_agendamento: dataHoraFormatada,
        cpf_cliente: cpfCliente,
        cpf_barbeiro: formData.cpf_barbeiro,
        id_servico: parseInt(formData.id_servico),
        status: 'pendente'
      });

      setMessage({ type: 'success', text: 'Agendamento realizado com sucesso!' });
      
      // Limpar formulário
      setFormData({
        cpf_barbeiro: '',
        id_servico: '',
        data_hora_agendamento: '',
      });
      setServicoSelecionado(null);
      setServicos([]);

      // Redirecionar após 2 segundos
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

  // Pegar data mínima (hoje)
  const getMinDate = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const horas = String(hoje.getHours()).padStart(2, '0');
    const minutos = String(hoje.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  };

  const barbeiroSelecionado = barbeiros.find(b => b.cpf === formData.cpf_barbeiro);

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Agendar Serviço</h2>
          <p className="form-subtitle">Escolha o barbeiro, serviço e horário desejado</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Selecionar Barbeiro */}
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

            {/* Informações do Barbeiro Selecionado */}
            {barbeiroSelecionado && (
              <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
                <h4 style={{ marginTop: 0 }}>Sobre o Barbeiro</h4>
                <p><strong>Email:</strong> {barbeiroSelecionado.email}</p>
                <p><strong>Telefone:</strong> {barbeiroSelecionado.telefone || 'Não informado'}</p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Trabalhando desde:</strong> {new Date(barbeiroSelecionado.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {/* Selecionar Serviço */}
            <div className="form-group">
              <label htmlFor="servico">Serviço *</label>
              <select
                id="servico"
                value={formData.id_servico}
                onChange={handleServicoChange}
                required
                disabled={!formData.cpf_barbeiro}
              >
                <option value="">
                  {formData.cpf_barbeiro ? 'Selecione um serviço' : 'Primeiro selecione um barbeiro'}
                </option>
                {servicos.map(servico => (
                  <option key={servico.id_servico} value={servico.id_servico}>
                    {servico.nome} - R$ {parseFloat(servico.preco).toFixed(2)} ({servico.duracao_estimada_min} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Informações do Serviço Selecionado */}
            {servicoSelecionado && (
              <div className="card" style={{ marginBottom: '20px', backgroundColor: '#e8f5e9' }}>
                <h4 style={{ marginTop: 0 }}>{servicoSelecionado.nome}</h4>
                {servicoSelecionado.descricao && (
                  <p style={{ fontStyle: 'italic', color: '#666' }}>
                    {servicoSelecionado.descricao}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                  <div>
                    <strong>Preço:</strong>
                    <p style={{ fontSize: '20px', color: '#27ae60', margin: '5px 0 0 0' }}>
                      R$ {parseFloat(servicoSelecionado.preco).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <strong>Duração:</strong>
                    <p style={{ fontSize: '20px', color: '#3498db', margin: '5px 0 0 0' }}>
                      {servicoSelecionado.duracao_estimada_min} min
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selecionar Data e Hora */}
            <div className="form-group">
              <label htmlFor="data_hora">Data e Hora *</label>
              <input
                type="datetime-local"
                id="data_hora"
                value={formData.data_hora_agendamento}
                onChange={(e) => setFormData({ ...formData, data_hora_agendamento: e.target.value })}
                required
                min={getMinDate()}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Escolha um horário disponível. Recomendamos agendar com antecedência.
              </small>
            </div>

            {/* Resumo do Agendamento */}
            {formData.cpf_barbeiro && formData.id_servico && formData.data_hora_agendamento && (
              <div className="card" style={{ marginBottom: '20px', backgroundColor: '#fff3cd', border: '2px solid #ffc107' }}>
                <h4 style={{ marginTop: 0 }}>📋 Resumo do Agendamento</h4>
                <p><strong>Barbeiro:</strong> {barbeiroSelecionado?.nome_completo}</p>
                <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
                <p><strong>Data/Hora:</strong> {new Date(formData.data_hora_agendamento).toLocaleString('pt-BR')}</p>
                <p><strong>Duração estimada:</strong> {servicoSelecionado?.duracao_estimada_min} minutos</p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Valor:</strong> <span style={{ fontSize: '18px', color: '#27ae60' }}>
                    R$ {servicoSelecionado ? parseFloat(servicoSelecionado.preco).toFixed(2) : '0.00'}
                  </span>
                </p>
              </div>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
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

          {/* Dicas */}
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>💡 Dicas:</h4>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Agende com pelo menos 24 horas de antecedência</li>
              <li>Você receberá uma notificação próximo ao horário</li>
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