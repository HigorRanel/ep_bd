import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import '../../styles/forms.css';

const CadastrarBarbeiro = () => {
  const { cadastrarBarbeiro } = useAuth();
  const [formData, setFormData] = useState({
    cpf: '',
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    endereco: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    data_inicio: '',
    is_chefe: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Atualiza campos comuns
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError('');
  };

  // Formata CPF com máscara
  const handleCPFChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);

    v = v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    setFormData({ ...formData, cpf: v });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF deve ter 11 dígitos');
      return;
    }

    setLoading(true);

    // Remove máscara antes de enviar
    const { confirmarSenha, cpf, ...resto } = formData;
    const dadosCadastro = {
      ...resto,
      cpf: cpf.replace(/\D/g, ''), // somente números
    };

    const result = await cadastrarBarbeiro(dadosCadastro);

    if (result.success) {
      setSuccess('Barbeiro cadastrado com sucesso!');
      setFormData({
        cpf: '',
        nome_completo: '',
        data_nascimento: '',
        telefone: '',
        endereco: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        data_inicio: '',
        is_chefe: false,
      });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Cadastrar Novo Barbeiro</h2>
          <p className="form-subtitle">Adicione um novo barbeiro à equipe</p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome_completo">Nome Completo *</label>
                <input
                  type="text"
                  id="nome_completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  required
                  placeholder="João da Silva"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cpf">CPF *</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  required
                  placeholder="000.000.000-00"
                  maxLength="14"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_nascimento">Data de Nascimento *</label>
                <input
                  type="date"
                  id="data_nascimento"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="data_inicio">Data de Início *</label>
                <input
                  type="date"
                  id="data_inicio"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(11) 98888-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="barbeiro@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="endereco">Endereço</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="senha">Senha *</label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar Senha *</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_chefe"
                  checked={formData.is_chefe}
                  onChange={handleChange}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Este barbeiro será chefe (poderá gerenciar outros barbeiros e produtos)</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Barbeiro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastrarBarbeiro;