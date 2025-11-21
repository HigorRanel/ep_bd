import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/perfil.css';

const RedefinirSenha = () => {
  const { token } = useParams(); // Pega o token da URL
  const { redefinirSenhaToken } = useAuth();
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha !== confirmar) {
      setStatus({ type: 'error', message: 'Senhas não conferem.' });
      return;
    }
    
    const res = await redefinirSenhaToken(token, senha);
    
    if (res.success) {
      setStatus({ type: 'success', message: res.message });
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus({ type: 'error', message: res.error });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div className="perfil-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="perfil-header" style={{ justifyContent: 'center' }}>
          <h2>🔐 Nova Senha</h2>
        </div>
        <div className="perfil-content" style={{ display: 'block' }}>
          {status.message && (
             <div className={`custom-alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {status.message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="info-label">Nova Senha</label>
              <input type="password" className="modern-input" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="info-label">Confirmar Senha</label>
              <input type="password" className="modern-input" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
            </div>
            <button type="submit" className="btn-update">Alterar Senha</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RedefinirSenha;