import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar'; // Adicionado
import '../styles/forms.css'; // Usando o estilo padrão

const EsqueciSenha = () => {
  const { solicitarRecuperacaoEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Limpa qualquer mensagem anterior (Resolve o "acúmulo")
    setStatus({ type: '', message: '' });
    
    setLoading(true);
    const res = await solicitarRecuperacaoEmail(email);
    setLoading(false);
    
    if (res.success) {
      setStatus({ type: 'success', message: res.message });
      setEmail(''); // Limpa o campo após sucesso
    } else {
      setStatus({ type: 'error', message: res.error });
    }
  };

  // Limpa o erro quando o usuário começa a digitar novamente
  const handleChange = (e) => {
    setEmail(e.target.value);
    if (status.message) setStatus({ type: '', message: '' });
  };

  return (
    <div className="page-container">
      <Navbar /> {/* Adicionado a Navbar */}
      
      <div className="form-container">
        <div className="form-card">
          <h2>Recuperar Senha</h2>
          <p className="form-subtitle">
            Digite seu e-mail para receber o link de redefinição
          </p>

          {/* Renderização condicional da mensagem */}
          {status.message && (
            <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Cadastrado</label>
              <input
                type="email"
                id="email"
                className="modern-input"
                value={email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
          </form>
          
          <div className="form-footer">
            <Link to="/login" className="btn-link">
              ← Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;