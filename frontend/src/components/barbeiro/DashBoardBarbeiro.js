import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Icon from '../common/Icon';
import api from '../../services/api';
import '../../styles/dashboard.css';

const DashboardBarbeiro = () => {
  const { user, isBarbeiroChefe } = useAuth();
  const [stats, setStats] = useState({
    agendamentosHoje: 0,
    agendamentosSemana: 0,
    mediaAvaliacoes: 0,
    totalAvaliacoes: 0,
    proximosAgendamentos: 0,
    reservasPendentes: 0,
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  // Função auxiliar para comparar se duas datas são o mesmo dia (ignora hora)
  const isMesmoDia = (data1, data2) => {
    return data1.getDate() === data2.getDate() &&
           data1.getMonth() === data2.getMonth() &&
           data1.getFullYear() === data2.getFullYear();
  };

  // Função auxiliar para verificar se está dentro do intervalo (inclusivo)
  const isEntreDatas = (dataAlvo, inicio, fim) => {
    const alvo = new Date(dataAlvo.getFullYear(), dataAlvo.getMonth(), dataAlvo.getDate());
    const ini = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const f = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
    return alvo >= ini && alvo <= f;
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      const hoje = new Date();

      const diaSemana = hoje.getDay();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - diaSemana);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const promises = [
        api.get(`/agendamentos/barbeiro/${user.cpf}`),
        api.get('/avaliacoes/me/media'),
        api.get('/reservas/estatisticas')
      ];

      if (isBarbeiroChefe()) {
        promises.push(api.get('/produtos/estoque-baixo'));
      }

      const results = await Promise.all(promises);

      const agendaRes = results[0];
      const avaliacoesRes = results[1];
      const estatisticasRes = results[2];
      const estoqueBaixoRes = isBarbeiroChefe() ? results[3] : null;

      const todosAgendamentos = agendaRes.data;

      const agendamentosHoje = todosAgendamentos.filter(a => {
        const dataAg = new Date(a.data_hora_agendamento);
        return isMesmoDia(dataAg, hoje) &&
               (a.status === 'pendente' || a.status === 'confirmado');
      });

      const agendamentosSemana = todosAgendamentos.filter(a => {
        const dataAg = new Date(a.data_hora_agendamento);
        return isEntreDatas(dataAg, inicioSemana, fimSemana) &&
               (a.status === 'pendente' || a.status === 'confirmado');
      });

      const proximos = todosAgendamentos
        .filter(a => {
          const dataAg = new Date(a.data_hora_agendamento);
          return dataAg > new Date() && (a.status === 'pendente' || a.status === 'confirmado');
        })
        .sort((a, b) => new Date(a.data_hora_agendamento) - new Date(b.data_hora_agendamento))
        .slice(0, 5);

      setProximosAgendamentos(proximos);

      if (estoqueBaixoRes) {
        setProdutosBaixoEstoque(estoqueBaixoRes.data.slice(0, 3));
      }

      setStats({
        agendamentosHoje: agendamentosHoje.length,
        agendamentosSemana: agendamentosSemana.length,
        mediaAvaliacoes: parseFloat(avaliacoesRes.data.media_nota || 0).toFixed(1),
        totalAvaliacoes: avaliacoesRes.data.total_avaliacoes || 0,
        proximosAgendamentos: proximos.length,
        reservasPendentes: estatisticasRes.data.reservados || 0,
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataHora = (dataString) => {
    const data = new Date(dataString);
    return {
      data: data.toLocaleDateString('pt-BR'),
      hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      diaSemana: data.toLocaleDateString('pt-BR', { weekday: 'long' })
    };
  };

  const calcularTempoRestante = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = data - agora;

    if (diff < 0) return 'Já passou';

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (horas < 1) return `Em ${minutos} minutos`;
    if (horas < 24) return `Em ${horas}h ${minutos}min`;

    const dias = Math.floor(horas / 24);
    return `Em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const accent = { color: 'var(--color-accent)' };
  const muted = { color: 'var(--color-text-muted)' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard do barbeiro</h1>
            <p>Bem-vindo, {user.nome}!{isBarbeiroChefe() && ' (Chefe)'}</p>
          </div>
          <Link to="/barbeiro/agenda" className="btn btn-primary">
            Ver agenda completa
          </Link>
        </div>

        {stats.reservasPendentes > 0 && (
          <div className="alert alert-info">
            <strong>Atenção:</strong> Você tem {stats.reservasPendentes} reserva(s) de produto(s) pendente(s).
            <Link to="/barbeiro/reservas" style={{ marginLeft: '10px', textDecoration: 'underline' }}>
              Ver reservas
            </Link>
          </div>
        )}

        {isBarbeiroChefe() && produtosBaixoEstoque.length > 0 && (
          <div className="alert alert-warning">
            <strong>Alerta de estoque:</strong> {produtosBaixoEstoque.length} produto(s) com estoque baixo.
            <Link to="/barbeiro/produtos/novo" style={{ marginLeft: '10px', textDecoration: 'underline' }}>
              Ver produtos
            </Link>
          </div>
        )}

        {stats.agendamentosHoje === 0 && (
          <div className="alert alert-info">
            <strong>Agenda livre hoje!</strong> Você não tem agendamentos para hoje.
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon"><Icon name="calendar" size={30} style={accent} /></span>
            <div className="stat-content">
              <h3>{stats.agendamentosHoje}</h3>
              <p>Agendamentos hoje</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="chart" size={30} style={accent} /></span>
            <div className="stat-content">
              <h3>{stats.agendamentosSemana}</h3>
              <p>Agendamentos na semana</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="star" size={30} style={accent} /></span>
            <div className="stat-content">
              <h3>{stats.mediaAvaliacoes}</h3>
              <p>Média de avaliações</p>
              <small style={{ ...muted, fontSize: '12px' }}>
                {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
              </small>
            </div>
          </div>

          <div className="stat-card" onClick={() => window.location.href = '/barbeiro/reservas'} style={{ cursor: 'pointer' }}>
            <span className="stat-icon"><Icon name="bookmark" size={30} style={accent} /></span>
            <div className="stat-content">
              <h3>{stats.reservasPendentes}</h3>
              <p>Reservas pendentes</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Ações rápidas</h2>
          <div className="actions-grid">
            <Link to="/barbeiro/agenda" className="action-card">
              <span className="action-icon"><Icon name="calendar" size={30} style={accent} /></span>
              <h3>Ver agenda</h3>
              <p>Gerenciar atendimentos</p>
            </Link>

            <Link to="/barbeiro/servicos/novo" className="action-card">
              <span className="action-icon"><Icon name="scissors" size={30} style={accent} /></span>
              <h3>Novo serviço</h3>
              <p>Cadastrar serviço</p>
            </Link>

            <Link to="/barbeiro/avaliacoes" className="action-card">
              <span className="action-icon"><Icon name="star" size={30} style={accent} /></span>
              <h3>Minhas avaliações</h3>
              <p>Ver feedback dos clientes</p>
            </Link>

            <Link to="/barbeiro/reservas" className="action-card">
              <span className="action-icon"><Icon name="bookmark" size={30} style={accent} /></span>
              <h3>Consultar reservas</h3>
              <p>Gerenciar reservas de produtos</p>
            </Link>

            {isBarbeiroChefe() && (
              <>
                <Link to="/barbeiro/produtos/novo" className="action-card">
                  <span className="action-icon"><Icon name="bag" size={30} style={accent} /></span>
                  <h3>Gerenciar produtos</h3>
                  <p>Cadastrar e ver estoque</p>
                </Link>

                <Link to="/barbeiro/planos/novo" className="action-card">
                  <span className="action-icon"><Icon name="card" size={30} style={accent} /></span>
                  <h3>Criar plano</h3>
                  <p>Novo plano mensal</p>
                </Link>

                <Link to="/barbeiro/cadastrar-barbeiro" className="action-card">
                  <span className="action-icon"><Icon name="user" size={30} style={accent} /></span>
                  <h3>Cadastrar barbeiro</h3>
                  <p>Adicionar à equipe</p>
                </Link>
              </>
            )}
          </div>
        </div>

        {proximosAgendamentos.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Próximos atendimentos</h2>
              <Link to="/barbeiro/agenda" className="btn btn-secondary btn-sm">
                Ver todos
              </Link>
            </div>
            <div className="cards-grid">
              {proximosAgendamentos.map(ag => {
                const { data, hora, diaSemana } = formatarDataHora(ag.data_hora_agendamento);
                const tempoRestante = calcularTempoRestante(ag.data_hora_agendamento);

                return (
                  <div key={ag.id_agendamento} className="card">
                    <div className="card-header">
                      <div>
                        <h3>{ag.cliente_nome}</h3>
                        <p style={{ margin: '5px 0 0 0', ...muted, fontSize: '12px', textTransform: 'capitalize' }}>
                          {diaSemana}
                        </p>
                      </div>
                      <span className={`badge badge-${ag.status}`}>
                        {ag.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <p><strong>Serviço:</strong> {ag.servico_nome}</p>
                      <p><strong>Horário:</strong> {data} às {hora}</p>
                      <p><strong>Duração:</strong> {ag.duracao_estimada_min} minutos</p>
                      {ag.cliente_telefone && (
                        <p><strong>Telefone:</strong> {ag.cliente_telefone}</p>
                      )}
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        backgroundColor: 'var(--color-accent-soft)',
                        color: 'var(--color-accent-text)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Icon name="clock" size={15} /> {tempoRestante}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isBarbeiroChefe() && produtosBaixoEstoque.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="h2_titulo">Produtos com estoque baixo</h2>
              <Link to="/barbeiro/produtos/novo" className="btn btn-warning btn-sm">
                Ver todos
              </Link>
            </div>
            <div className="grid-3">
              {produtosBaixoEstoque.map(produto => (
                <div
                  key={produto.id_produto}
                  className="card"
                  style={{ borderLeft: '4px solid var(--color-warning)' }}
                >
                  <div className="card-header">
                    <h3>{produto.nome_produto}</h3>
                    <span className="badge badge-cancelado">
                      Baixo
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Categoria:</strong> {produto.categoria}</p>
                    <p>
                      <strong>Estoque:</strong>
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginLeft: '5px' }}>
                        {produto.quantidade_estoque}
                      </span>
                      <span style={muted}>
                        {' '}/ {produto.minimo_estoque} mínimo
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: '40px', backgroundColor: 'var(--color-surface-2)' }}>
          <h3>Dicas do sistema</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li>Mantenha sua agenda atualizada para evitar conflitos</li>
            <li>Responda às avaliações dos clientes para melhorar o relacionamento</li>
            <li>Atualize o status dos agendamentos após cada atendimento</li>
            <li>Gerencie as reservas de produtos regularmente</li>
            {isBarbeiroChefe() && (
              <>
                <li>Monitore o estoque regularmente para evitar falta de produtos</li>
                <li>Crie planos mensais atrativos para fidelizar clientes</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardBarbeiro;