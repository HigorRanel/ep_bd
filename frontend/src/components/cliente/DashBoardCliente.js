import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const DashboardCliente = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    agendamentosPendentes: 0,
    reservasAtivas: 0,
    planosAtivos: 0,
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const agendamentosRes = await api.get('/clientes/me/agendamentos');
      const agendamentos = agendamentosRes.data;

      const pendentes = agendamentos.filter(a =>
        a.status === 'pendente' || a.status === 'confirmado'
      );

      const proximos = pendentes
        .sort((a, b) => new Date(a.data_hora_agendamento) - new Date(b.data_hora_agendamento))
        .slice(0, 3);

      const reservasRes = await api.get('/produtos/minhas-reservas');
      const reservasAtivas = reservasRes.data.filter(r => r.status === 'reservado').length;

      const planosRes = await api.get('/planos/minhas-assinaturas');
      const planosAtivos = planosRes.data.filter(p =>
        new Date(p.data_fim) >= new Date()
      ).length;

      setStats({
        agendamentosPendentes: pendentes.length,
        reservasAtivas,
        planosAtivos,
      });
      setProximosAgendamentos(proximos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Bem-vindo, {user.nome}!</h1>
          <p>Aqui está um resumo das suas atividades</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.agendamentosPendentes}</h3>
              <p>Agendamentos Pendentes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <h3>{stats.reservasAtivas}</h3>
              <p>Reservas Ativas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <h3>{stats.planosAtivos}</h3>
              <p>Planos Ativos</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Próximos Agendamentos</h2>
            <Link to="/cliente/agendamentos" className="btn btn-secondary btn-sm">
              Ver Todos
            </Link>
          </div>

          {proximosAgendamentos.length === 0 ? (
            <div className="empty-state">
              <p>Você não tem agendamentos pendentes</p>
              <Link to="/cliente/agendar" className="btn btn-primary">
                Agendar Serviço
              </Link>
            </div>
          ) : (
            <div className="cards-grid">
              {proximosAgendamentos.map((agendamento) => (
                <div key={agendamento.id_agendamento} className="card">
                  <div className="card-header">
                    <h3>{agendamento.servico_nome}</h3>
                    <span className={`badge badge-${agendamento.status}`}>
                      {agendamento.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Barbeiro:</strong> {agendamento.barbeiro_nome}</p>
                    <p><strong>Data:</strong> {formatarData(agendamento.data_hora_agendamento)}</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(agendamento.preco).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Ações Rápidas</h2>
          <div className="actions-grid">
            <Link to="/cliente/agendar" className="action-card">
              <span className="action-icon">✂️</span>
              <h3>Agendar Serviço</h3>
              <p>Marque seu próximo corte</p>
            </Link>

            <Link to="/cliente/reservas" className="action-card">
              <span className="action-icon">🛒</span>
              <h3>Reservar Produto</h3>
              <p>Reserve produtos para retirar</p>
            </Link>

            <Link to="/cliente/planos" className="action-card">
              <span className="action-icon">💳</span>
              <h3>Ver Planos</h3>
              <p>Assine um plano mensal</p>
            </Link>

            <Link to="/cliente/agendamentos" className="action-card">
              <span className="action-icon">📋</span>
              <h3>Meus Agendamentos</h3>
              <p>Veja todos seus agendamentos</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCliente;