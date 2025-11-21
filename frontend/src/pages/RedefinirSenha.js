import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/perfil.css';

const RedefinirSenha = () => {
  const { token } = useParams();
  const { redefinirSenhaToken } = useAuth();
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sucesso, setSucesso] = useState(false); // Estado para controlar a exibição

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha !== confirmar) {
      setStatus({ type: 'error', message: 'Senhas não conferem.' });
      return;
    }
    
    const res = await redefinirSenhaToken(token, senha);
    
    if (res.success) {
      setSucesso(true); // Ativa o modo de sucesso
      setStatus({ type: 'success', message: res.message });
      // Redireciona automaticamente após 3 segundos, mas o usuário já vê a tela de sucesso
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus({ type: 'error', message: res.error });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div className="perfil-card" style={{ maxWidth: '400px', width: '100%' }}>
        
        {/* Se deu sucesso, mostra APENAS a mensagem e botão */}
        {sucesso ? (
          <div className="perfil-content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>Senha Alterada!</h2>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
              Sua senha foi atualizada com sucesso. Você será redirecionado para o login.
            </p>
            <Link to="/login" className="btn-update" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Ir para Login agora
            </Link>
          </div>
        ) : (
          /* Se não, mostra o formulário normal */
          <>
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
                  <input 
                    type="password" 
                    className="modern-input" 
                    value={senha} 
                    onChange={e => setSenha(e.target.value)} 
                    required 
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="info-label">Confirmar Senha</label>
                  <input 
                    type="password" 
                    className="modern-input" 
                    value={confirmar} 
                    onChange={e => setConfirmar(e.target.value)} 
                    required 
                    placeholder="Repita a senha"
                  />
                </div>
                <button type="submit" className="btn-update">Alterar Senha</button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default RedefinirSenha;