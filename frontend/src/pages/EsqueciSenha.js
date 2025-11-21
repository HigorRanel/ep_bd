import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/perfil.css'; // Reutilizando estilo

const EsqueciSenha = () => {
  const { solicitarRecuperacaoEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await solicitarRecuperacaoEmail(email);
    setLoading(false);
    
    if (res.success) {
      setStatus({ type: 'success', message: res.message });
      setEmail('');
    } else {
      setStatus({ type: 'error', message: res.error });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div className="perfil-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="perfil-header" style={{ justifyContent: 'center' }}>
          <h2>✉️ Recuperar Senha</h2>
        </div>
        <div className="perfil-content" style={{ display: 'block' }}>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Digite seu e-mail e enviaremos um link para você redefinir sua senha.
          </p>

          {status.message && (
            <div className={`custom-alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Seu e-mail cadastrado"
                className="modern-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-update" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" style={{ color: '#3498db' }}>Voltar ao Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;