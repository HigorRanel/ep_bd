import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import '../styles/perfil.css'; // Importando o novo CSS

const Perfil = () => {
  const { user, alterarSenha } = useAuth();
  
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Pega a primeira letra do nome para o avatar
  const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : '?';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.novaSenha !== formData.confirmarSenha) {
      setStatus({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    if (formData.novaSenha.length < 6) {
      setStatus({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    const resultado = await alterarSenha(formData.senhaAtual, formData.novaSenha);
    setLoading(false);

    if (resultado.success) {
      setStatus({ type: 'success', message: resultado.message });
      setFormData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } else {
      setStatus({ type: 'error', message: resultado.error });
    }
  };

  return (
    <>
      <Navbar />
      <div className="perfil-container">
        <div className="perfil-card">
          
          {/* Cabeçalho com Avatar */}
          <div className="perfil-header">
            <div className="avatar-circle">{inicial}</div>
            <div className="user-welcome">
              <h2>{user?.nome}</h2>
              <span>{user?.tipo?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          <div className="perfil-content">
            
            {/* Coluna da Esquerda: Dados do Usuário */}
            <div className="info-section">
              <h3>Meus Dados</h3>
              
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">CPF</span>
                <span className="info-value">{user?.cpf}</span>
              </div>

              <div className="info-item">
                 <span className="info-label">Status da Conta</span>
                 <span className="info-value" style={{color: '#27ae60'}}>Ativa</span>
              </div>
            </div>

            {/* Coluna da Direita: Alterar Senha */}
            <div className="password-section">
              <h3>Segurança</h3>

              {status.message && (
                <div className={`custom-alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {status.type === 'error' ? '⚠️ ' : '✅ '}
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label className="info-label">Senha Atual</label>
                  <input
                    type="password"
                    name="senhaAtual"
                    value={formData.senhaAtual}
                    onChange={handleChange}
                    required
                    className="modern-input"
                    placeholder="Sua senha atual"
                  />
                </div>

                <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label className="info-label">Nova Senha</label>
                  <input
                    type="password"
                    name="novaSenha"
                    value={formData.novaSenha}
                    onChange={handleChange}
                    required
                    className="modern-input"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label className="info-label">Confirmar Senha</label>
                  <input
                    type="password"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    required
                    className="modern-input"
                    placeholder="Repita a nova senha"
                  />
                </div>

                <button type="submit" className="btn-update" disabled={loading}>
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Perfil;