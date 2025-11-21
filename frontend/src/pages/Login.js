import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import '../styles/forms.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.senha);

    if (result.success) {
      // Redireciona baseado no tipo de usuário
      if (result.user.tipo === 'cliente') {
        navigate('/cliente/dashboard');
      } else if (['barbeiro', 'barbeiro_chefe'].includes(result.user.tipo)) {
        navigate('/barbeiro/dashboard');
      }
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
          <h2>Login</h2>
          <p className="form-subtitle">Entre com sua conta</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
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

            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
              {/* Link adicionado discretamente abaixo do input */}
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Link 
                  to="/esqueci-senha" 
                  style={{ fontSize: '0.85rem', color: '#666', textDecoration: 'none' }}
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Não tem uma conta? 
              <Link to="/cadastro"> Cadastre-se aqui</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;