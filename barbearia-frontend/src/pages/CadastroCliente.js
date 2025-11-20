import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import '../styles/forms.css';

const CadastroCliente = () => {
  const [formData, setFormData] = useState({
    cpf: '',
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    endereco: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { cadastrarCliente } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  
  const handleCPFChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);

    // Aplica máscara
    v = v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    setFormData({ ...formData, cpf: v });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    const { confirmarSenha, cpf, ...resto } = formData;

    const dadosCadastro = {
    ...resto,
    cpf: cpf.replace(/\D/g, ''), // remove máscara antes de enviar
    };

    const result = await cadastrarCliente(dadosCadastro);

    if (result.success) {
      navigate('/cliente/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Cadastro de Cliente</h2>
          <p className="form-subtitle">Crie sua conta para agendar serviços</p>

          {error && <div className="alert alert-error">{error}</div>}

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

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
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

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Já tem uma conta? 
              <Link to="/login"> Faça login aqui</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadastroCliente;