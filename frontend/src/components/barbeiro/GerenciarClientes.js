import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const GerenciarClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // Debounce do search - só atualiza após 500ms sem digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1); // Reset para página 1 ao buscar
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [search]);

  // Carrega clientes quando o search debounced ou página mudam
  useEffect(() => {
    carregarClientes();
  }, [page, searchDebounced]);

  const carregarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes/estatisticas', {
        params: {
          page,
          per_page: 10,
          search: searchDebounced || undefined
        }
      });
      
      setClientes(response.data.clientes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced]);

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

  const limparBusca = () => {
    setSearch('');
    setSearchDebounced('');
    setPage(1);
  };

  if (loading && page === 1 && !search) {
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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Digite o nome ou CPF do cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%',
                  paddingRight: search ? '100px' : '12px'
                }}
              />
              
              {/* Indicador de busca ativa */}
              {search && search !== searchDebounced && (
                <span style={{
                  position: 'absolute',
                  right: search ? '90px' : '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#3498db',
                  fontSize: '12px'
                }}>
                  Buscando...
                </span>
              )}
              
              {/* Botão limpar */}
              {search && (
                <button
                  onClick={limparBusca}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#c0392b'}
                  onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                >
                  ✕ Limpar
                </button>
              )}
            </div>
            
            {/* Info de busca */}
            {searchDebounced && (
              <small style={{ 
                display: 'block', 
                marginTop: '8px', 
                color: '#666',
                fontSize: '13px'
              }}>
                {loading ? (
                  <>🔍 Buscando por "{searchDebounced}"...</>
                ) : (
                  <>
                    {pagination.total > 0 ? (
                      <>✓ Encontrados <strong>{pagination.total}</strong> cliente(s) com "{searchDebounced}"</>
                    ) : (
                      <>⚠️ Nenhum cliente encontrado com "{searchDebounced}"</>
                    )}
                  </>
                )}
              </small>
            )}
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{pagination.total || 0}</h3>
              <p>{searchDebounced ? 'Clientes Encontrados' : 'Total de Clientes'}</p>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        {loading && page === 1 ? (
          <div className="loading-container" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Carregando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="empty-state">
            {searchDebounced ? (
              <>
                <p>Nenhum cliente encontrado com "{searchDebounced}"</p>
                <button onClick={limparBusca} className="btn btn-primary">
                  Limpar Busca
                </button>
              </>
            ) : (
              <p>Nenhum cliente cadastrado</p>
            )}
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
                  <span>
                    Página {page} de {pagination.pages}
                    {loading && <span style={{ marginLeft: '10px', color: '#3498db' }}>(Carregando...)</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="btn btn-secondary btn-sm"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages || loading}
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