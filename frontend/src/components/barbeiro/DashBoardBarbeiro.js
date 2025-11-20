import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
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
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];
      
      // Calcular início e fim da semana
      const diaSemana = hoje.getDay();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      
      const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];
      const fimSemanaStr = fimSemana.toISOString().split('T')[0];

      // Buscar agenda
      const agendaRes = await api.get(`/agendamentos/barbeiro/${user.cpf}`);
      const todosAgendamentos = agendaRes.data;
      
      // Filtrar agendamentos de hoje
      const agendamentosHoje = todosAgendamentos.filter(a => 
        a.data_hora_agendamento.startsWith(hojeStr) && 
        (a.status === 'pendente' || a.status === 'confirmado')
      );

      // Filtrar agendamentos da semana
      const agendamentosSemana = todosAgendamentos.filter(a => {
        const dataAg = a.data_hora_agendamento.split('T')[0];
        return dataAg >= inicioSemanaStr && dataAg <= fimSemanaStr &&
               (a.status === 'pendente' || a.status === 'confirmado');
      });

      // Buscar média de avaliações
      const avaliacoesRes = await api.get('/avaliacoes/me/media');
      
      // Próximos agendamentos (futuros, ordenados)
      const agora = new Date();
      const proximos = todosAgendamentos
        .filter(a => {
          const dataAg = new Date(a.data_hora_agendamento);
          return dataAg > agora && (a.status === 'pendente' || a.status === 'confirmado');
        })
        .sort((a, b) => new Date(a.data_hora_agendamento) - new Date(b.data_hora_agendamento))
        .slice(0, 5);
      
      setProximosAgendamentos(proximos);

      setStats({
        agendamentosHoje: agendamentosHoje.length,
        agendamentosSemana: agendamentosSemana.length,
        mediaAvaliacoes: parseFloat(avaliacoesRes.data.media_nota || 0).toFixed(1),
        totalAvaliacoes: avaliacoesRes.data.total_avaliacoes || 0,
        proximosAgendamentos: proximos.length,
      });

      // Se for barbeiro chefe, buscar produtos com estoque baixo
      if (isBarbeiroChefe()) {
        try {
          const estoqueBaixoRes = await api.get('/produtos/estoque-baixo');
          setProdutosBaixoEstoque(estoqueBaixoRes.data.slice(0, 3)); // Mostrar apenas 3
        } catch (error) {
          console.log('Erro ao buscar estoque baixo:', error);
        }
      }
      
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
        <div className="loading-container">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard do Barbeiro</h1>
            <p>Bem-vindo, {user.nome}! {isBarbeiroChefe() && '⭐ (Chefe)'}</p>
          </div>
          <Link to="/barbeiro/agenda" className="btn btn-primary">
            Ver Agenda Completa
          </Link>
        </div>

        {/* Alertas */}
        {isBarbeiroChefe() && produtosBaixoEstoque.length > 0 && (
          <div className="alert alert-warning">
            <strong>⚠️ Alerta de Estoque:</strong> {produtosBaixoEstoque.length} produto(s) com estoque baixo.
            <Link to="/barbeiro/produtos/novo" style={{ marginLeft: '10px', textDecoration: 'underline' }}>
              Ver produtos
            </Link>
          </div>
        )}

        {stats.agendamentosHoje === 0 && (
          <div className="alert alert-info">
            <strong>📅 Agenda livre hoje!</strong> Você não tem agendamentos para hoje.
          </div>
        )}

        {/* Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.agendamentosHoje}</h3>
              <p>Agendamentos Hoje</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.agendamentosSemana}</h3>
              <p>Agendamentos na Semana</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{stats.mediaAvaliacoes}</h3>
              <p>Média de Avaliações</p>
              <small style={{ color: '#666', fontSize: '12px' }}>
                {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats.proximosAgendamentos}</h3>
              <p>Próximos Agendamentos</p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="quick-actions">
          <h2>Ações Rápidas</h2>
          <div className="actions-grid">
            <Link to="/barbeiro/agenda" className="action-card">
              <span className="action-icon">📅</span>
              <h3>Ver Agenda</h3>
              <p>Gerenciar atendimentos</p>
            </Link>

            <Link to="/barbeiro/servicos/novo" className="action-card">
              <span className="action-icon">✂️</span>
              <h3>Novo Serviço</h3>
              <p>Cadastrar serviço</p>
            </Link>

            <Link to="/barbeiro/avaliacoes" className="action-card">
              <span className="action-icon">⭐</span>
              <h3>Minhas Avaliações</h3>
              <p>Ver feedback dos clientes</p>
            </Link>

            {isBarbeiroChefe() && (
              <>
                <Link to="/barbeiro/produtos/novo" className="action-card">
                  <span className="action-icon">🛒</span>
                  <h3>Gerenciar Produtos</h3>
                  <p>Cadastrar e ver estoque</p>
                </Link>

                <Link to="/barbeiro/planos/novo" className="action-card">
                  <span className="action-icon">💳</span>
                  <h3>Criar Plano</h3>
                  <p>Novo plano mensal</p>
                </Link>

                <Link to="/barbeiro/cadastrar-barbeiro" className="action-card">
                  <span className="action-icon">👤</span>
                  <h3>Cadastrar Barbeiro</h3>
                  <p>Adicionar à equipe</p>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Próximos Atendimentos */}
        {proximosAgendamentos.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Próximos Atendimentos</h2>
              <Link to="/barbeiro/agenda" className="btn btn-secondary btn-sm">
                Ver Todos
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
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', textTransform: 'capitalize' }}>
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
                        padding: '8px', 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }}>
                        ⏰ {tempoRestante}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Produtos com Estoque Baixo (apenas para chefe) */}
        {isBarbeiroChefe() && produtosBaixoEstoque.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>⚠️ Produtos com Estoque Baixo</h2>
              <Link to="/barbeiro/produtos/novo" className="btn btn-warning btn-sm">
                Ver Todos
              </Link>
            </div>
            <div className="grid-3">
              {produtosBaixoEstoque.map(produto => (
                <div 
                  key={produto.id_produto} 
                  className="card" 
                  style={{ borderLeft: '4px solid #f39c12' }}
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
                      <span style={{ color: '#e74c3c', fontWeight: 'bold', marginLeft: '5px' }}>
                        {produto.quantidade_estoque}
                      </span>
                      <span style={{ color: '#666' }}>
                        {' '}/ {produto.minimo_estoque} mínimo
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas e Informações */}
        <div className="card" style={{ marginTop: '40px', backgroundColor: '#f8f9fa' }}>
          <h3>💡 Dicas do Sistema</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li>Mantenha sua agenda atualizada para evitar conflitos</li>
            <li>Responda às avaliações dos clientes para melhorar o relacionamento</li>
            <li>Atualize o status dos agendamentos após cada atendimento</li>
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