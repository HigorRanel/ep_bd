import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import '../styles/forms.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const resultado = await login(formData.email, formData.senha);

    if (resultado.success) {
      if (resultado.user.tipo === 'cliente') {
        navigate('/cliente/dashboard');
      } else {
        navigate('/barbeiro/dashboard');
      }
    } else {
      setError(resultado.error);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="form-container" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>Login</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="seu@email.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>Senha</label>
                {/* Link movido para a linha do label para economizar espaço e ficar elegante */}
                <Link 
                  to="/esqueci-senha" 
                  style={{ 
                    fontSize: '0.85rem', 
                    color: '#3498db', 
                    textDecoration: 'none' 
                  }}
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Sua senha"
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <p>Ainda não tem conta? <Link to="/cadastro" style={{ color: '#3498db', fontWeight: 'bold' }}>Cadastre-se</Link></p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;