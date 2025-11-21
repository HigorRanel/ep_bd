import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/forms.css'; // Reutilizando estilos de formulário existentes

const AlterarSenha = () => {
  const { alterarSenha } = useAuth();
  
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

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
    <div className="form-container" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2>Alterar Senha</h2>
      
      {status.message && (
        <div className={`alert ${status.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Senha Atual</label>
          <input
            type="password"
            name="senhaAtual"
            value={formData.senhaAtual}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Nova Senha</label>
          <input
            type="password"
            name="novaSenha"
            value={formData.novaSenha}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Confirmar Nova Senha</label>
          <input
            type="password"
            name="confirmarSenha"
            value={formData.confirmarSenha}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Alterando...' : 'Atualizar Senha'}
        </button>
      </form>
    </div>
  );
};

export default AlterarSenha;