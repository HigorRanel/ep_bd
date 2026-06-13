import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';

const CadastrarServico = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    duracao_estimada_min: '',
    descricao: '',
  });
  const [meusServicos, setMeusServicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const [modalEditar, setModalEditar] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);

  useEffect(() => {
    carregarMeusServicos();
  }, []);

  const carregarMeusServicos = async () => {
    try {
      const response = await api.get('/barbeiros/me/servicos');
      setMeusServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/servicos', {
        ...formData,
        preco: parseFloat(formData.preco),
        duracao_estimada_min: parseInt(formData.duracao_estimada_min),
        cpf_barbeiro: user.cpf,
      });

      setMessage({ type: 'success', text: 'Serviço cadastrado com sucesso!' });
      setFormData({
        nome: '',
        preco: '',
        duracao_estimada_min: '',
        descricao: '',
      });
      carregarMeusServicos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao cadastrar serviço',
      });
    } finally {
      setLoading(false);
    }
  };

  const deletarServico = async (idServico) => {
    if (!window.confirm('Deseja realmente deletar este serviço?')) return;

    try {
      await api.delete(`/servicos/${idServico}`);
      setMessage({ type: 'success', text: 'Serviço deletado!' });
      carregarMeusServicos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao deletar serviço' });
    }
  };

  const abrirModalEditar = (servico) => {
    setModalEditar(true);
    setServicoEditando({ ...servico });
  };

  const salvarEdicao = async () => {
    try {
      await api.put(`/servicos/${servicoEditando.id_servico}`, {
        nome: servicoEditando.nome,
        preco: parseFloat(servicoEditando.preco),
        duracao_estimada_min: parseInt(servicoEditando.duracao_estimada_min),
        descricao: servicoEditando.descricao
      });
      setMessage({ type: 'success', text: 'Serviço atualizado com sucesso!' });
      setModalEditar(false);
      setServicoEditando(null);
      carregarMeusServicos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar serviço' });
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Cadastrar serviço</h2>
          <p className="form-subtitle">Adicione um novo serviço ao seu catálogo</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome">Nome do serviço *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Corte masculino, Barba design"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preco">Preço (R$) *</label>
                <input
                  type="number"
                  id="preco"
                  name="preco"
                  value={formData.preco}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="duracao_estimada_min">Duração (minutos) *</label>
                <input
                  type="number"
                  id="duracao_estimada_min"
                  name="duracao_estimada_min"
                  value={formData.duracao_estimada_min}
                  onChange={handleChange}
                  required
                  min="5"
                  step="5"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="4"
                placeholder="Descreva o serviço..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar serviço'}
            </button>
          </form>
        </div>

        {/* Lista de Serviços */}
        {meusServicos.length > 0 && (
          <div className="form-card" style={{ marginTop: '30px' }}>
            <h2>Meus serviços</h2>
            <div className="grid-2">
              {meusServicos.map((servico) => (
                <div key={servico.id_servico} className="card">
                  <div className="card-header">
                    <h3>{servico.nome}</h3>
                  </div>
                  <div className="card-body">
                    {servico.descricao && <p>{servico.descricao}</p>}
                    <p><strong>Preço:</strong> R$ {parseFloat(servico.preco).toFixed(2)}</p>
                    <p><strong>Duração:</strong> {servico.duracao_estimada_min} minutos</p>
                  </div>
                  <div className="card-footer">
                    <button
                      onClick={() => abrirModalEditar(servico)}
                      className="btn btn-primary btn-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deletarServico(servico.id_servico)}
                      className="btn btn-danger btn-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {modalEditar && servicoEditando && (
          <div className="modal-overlay" onClick={() => setModalEditar(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Editar serviço</h3>

              <div className="form-group">
                <label>Nome do serviço *</label>
                <input
                  type="text"
                  value={servicoEditando.nome}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={servicoEditando.descricao || ''}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, descricao: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={servicoEditando.preco}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, preco: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duração (minutos) *</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    value={servicoEditando.duracao_estimada_min}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, duracao_estimada_min: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={salvarEdicao} className="btn btn-primary">
                  Salvar alterações
                </button>
                <button onClick={() => setModalEditar(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastrarServico;