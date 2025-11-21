import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const GerenciarClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    carregarClientes();
  }, [page, search]);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes/estatisticas', {
        params: {
          page,
          per_page: 10,
          search: search || undefined
        }
      });
      
      setClientes(response.data.clientes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = (cpf) => {
    navigate(`/barbeiro/clientes/${cpf}`);
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'Nunca';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const calcularIdade = (dataNascimento) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Gestão de Clientes</h1>
            <p>Visualize estatísticas e histórico dos seus clientes</p>
          </div>
        </div>

        {/* Busca */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Buscar Cliente</label>
            <input
              type="text"
              placeholder="Digite o nome ou CPF do cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{pagination.total || 0}</h3>
              <p>Total de Clientes</p>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        {clientes.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <>
            <div className="grid-2">
              {clientes.map((cliente) => (
                <div key={cliente.cpf} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{cliente.nome_completo}</h3>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                        {calcularIdade(cliente.data_nascimento)} anos
                      </p>
                    </div>
                  </div>

                  <div className="card-body">
                    <p><strong>Email:</strong> {cliente.email}</p>
                    <p><strong>Telefone:</strong> {cliente.telefone || 'Não informado'}</p>
                    
                    <div style={{ 
                      marginTop: '15px', 
                      paddingTop: '15px', 
                      borderTop: '1px solid #ecf0f1',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px'
                    }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                          Atendimentos
                        </strong>
                        <span style={{ fontSize: '20px', color: '#27ae60' }}>
                          {cliente.total_atendimentos}
                        </span>
                      </div>
                      
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                          Faltas
                        </strong>
                        <span style={{ fontSize: '20px', color: '#e74c3c' }}>
                          {cliente.total_faltas}
                        </span>
                      </div>
                      
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                          Última Visita
                        </strong>
                        <span style={{ fontSize: '14px' }}>
                          {formatarData(cliente.ultima_visita)}
                        </span>
                      </div>
                      
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#666' }}>
                          Média Avaliações
                        </strong>
                        <span style={{ fontSize: '14px' }}>
                          {parseFloat(cliente.media_avaliacoes || 0).toFixed(1)} ⭐
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      onClick={() => verDetalhes(cliente.cpf)}
                      className="btn btn-primary btn-sm"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="card" style={{ marginTop: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span>Página {page} de {pagination.pages}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="btn btn-secondary btn-sm"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GerenciarClientes;