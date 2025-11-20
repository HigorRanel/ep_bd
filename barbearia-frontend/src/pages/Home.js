import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import '../styles/dashboard.css';

const Home = () => {
  const { user, isCliente, isBarbeiro } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona usuários logados para seus dashboards
    if (user) {
      if (isCliente()) {
        navigate('/cliente/dashboard');
      } else if (isBarbeiro()) {
        navigate('/barbeiro/dashboard');
      }
    }
  }, [user, isCliente, isBarbeiro, navigate]);

  return (
    <div className="page-container">
      <Navbar />
      <div className="home-container">
        <div className="home-hero">
          <h1>✂️ Bem-vindo à Barbearia</h1>
          <p className="home-subtitle">
            Sistema completo de agendamento e gerenciamento para barbearias
          </p>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <h3>👤 Para Clientes</h3>
            <ul>
              <li>Agende cortes online</li>
              <li>Reserve produtos</li>
              <li>Assine planos mensais</li>
              <li>Avalie serviços</li>
            </ul>
            <Link to="/cadastro" className="btn btn-primary">
              Cadastrar-se
            </Link>
          </div>

          <div className="feature-card">
            <h3>✂️ Para Barbeiros</h3>
            <ul>
              <li>Gerencie sua agenda</li>
              <li>Cadastre serviços</li>
              <li>Visualize avaliações</li>
              <li>Controle de clientes</li>
            </ul>
            <Link to="/login" className="btn btn-secondary">
              Fazer Login
            </Link>
          </div>
        </div>

        <div className="home-info">
          <h2>Funcionalidades</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <h4>Agendamento Inteligente</h4>
              <p>Sistema completo de agendamento com controle de horários</p>
            </div>
            <div className="info-item">
              <span className="info-icon">🛒</span>
              <h4>Loja de Produtos</h4>
              <p>Reserve produtos para retirar na barbearia</p>
            </div>
            <div className="info-item">
              <span className="info-icon">💳</span>
              <h4>Planos Mensais</h4>
              <p>Assine planos e economize nos cortes</p>
            </div>
            <div className="info-item">
              <span className="info-icon">⭐</span>
              <h4>Avaliações</h4>
              <p>Sistema de feedback e avaliação de serviços</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;