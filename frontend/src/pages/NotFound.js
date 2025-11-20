import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import '../styles/dashboard.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="empty-state" style={{ minHeight: '60vh', padding: '80px 20px' }}>
          <div style={{ fontSize: '120px', marginBottom: '20px' }}>
            🔍
          </div>
          <h1 style={{ fontSize: '72px', margin: '0 0 20px 0', color: '#e74c3c' }}>
            404
          </h1>
          <h2 style={{ marginBottom: '20px' }}>
            Página Não Encontrada
          </h2>
          <p style={{ fontSize: '18px', color: '#666', maxWidth: '500px', margin: '0 auto 40px' }}>
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              ← Voltar
            </button>
            <Link to="/" className="btn btn-primary">
              🏠 Ir para Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;