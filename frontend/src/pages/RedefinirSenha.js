import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar'; // Adicionado
import '../styles/forms.css';

const RedefinirSenha = () => {
  const { token } = useParams();
  const { redefinirSenhaToken } = useAuth();
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpa mensagens anteriores
    setStatus({ type: '', message: '' });

    if (senha !== confirmar) {
      setStatus({ type: 'error', message: 'As senhas não conferem.' });
      return;
    }
    
    const res = await redefinirSenhaToken(token, senha);
    
    if (res.success) {
      setSucesso(true);
      // Opcional: redirecionar automaticamente
      // setTimeout(() => navigate('/login'), 3000);
    } else {
      setStatus({ type: 'error', message: res.error });
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      
      <div className="form-container">
        <div className="form-card">
          
          {sucesso ? (
            // Tela de Sucesso
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>Senha Alterada!</h2>
              <p style={{ marginBottom: '2rem', color: '#666' }}>
                Sua senha foi atualizada com sucesso.
              </p>
              <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: 'none' }}>
                Fazer Login Agora
              </Link>
            </div>
          ) : (
            // Formulário de Redefinição
            <>
              <h2>Nova Senha</h2>
              <p className="form-subtitle">Crie uma nova senha segura</p>

              {status.message && (
                <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {status.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nova Senha</label>
                  <input 
                    type="password" 
                    value={senha} 
                    onChange={e => setSenha(e.target.value)} 
                    required 
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    value={confirmar} 
                    onChange={e => setConfirmar(e.target.value)} 
                    required 
                    placeholder="Repita a senha"
                  />
                </div>
                
                <button type="submit" className="btn btn-primary btn-block">
                  Alterar Senha
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default RedefinirSenha;