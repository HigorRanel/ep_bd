import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const ConsultarReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [filtros, setFiltros] = useState({
    status: 'todos',
    categoria: 'todas',
    dataInicio: '',
    dataFim: '',
    nomeCliente: '',
  });

  const [modalEditar, setModalEditar] = useState(null);
  const [novoStatus, setNovoStatus] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    compradas: 0,
    canceladas: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, reservas]);

  const carregarDados = async () => {
    try {

      const response = await api.get('/reservas/todas');
      const todasReservas = response.data;

      setReservas(todasReservas);
      calcularEstatisticas(todasReservas);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar reservas' });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (listaReservas) => {
    setStats({
      total: listaReservas.length,
      pendentes: listaReservas.filter(r => r.status === 'reservado').length,
      compradas: listaReservas.filter(r => r.status === 'comprado' || r.status === 'retirado').length,
      canceladas: listaReservas.filter(r => r.status === 'cancelado').length,
    });
  };

  const aplicarFiltros = () => {
    let filtradas = [...reservas];

    if (filtros.status !== 'todos') {
      filtradas = filtradas.filter(r => r.status === filtros.status);
    }

    if (filtros.categoria !== 'todas') {
      filtradas = filtradas.filter(r => r.categoria === filtros.categoria);
    }

    if (filtros.dataInicio) {
      filtradas = filtradas.filter(r => {
        const dataReserva = r.data_reserva.split('T')[0];
        return dataReserva >= filtros.dataInicio;
      });
    }

    if (filtros.dataFim) {
      filtradas = filtradas.filter(r => {
        const dataReserva = r.data_reserva.split('T')[0];
        return dataReserva <= filtros.dataFim;
      });
    }

    if (filtros.nomeCliente.trim()) {
      const termo = filtros.nomeCliente.toLowerCase().trim();
      filtradas = filtradas.filter(r =>
        r.cliente_nome.toLowerCase().includes(termo)
      );
    }

    filtradas.sort((a, b) => new Date(b.data_reserva) - new Date(a.data_reserva));

    setReservasFiltradas(filtradas);
  };

  const limparFiltros = () => {
    setFiltros({
      status: 'todos',
      categoria: 'todas',
      dataInicio: '',
      dataFim: '',
      nomeCliente: '',
    });
  };

  const abrirModalEditar = (reserva) => {
    setModalEditar(reserva);
    setNovoStatus(reserva.status);
  };

  const alterarStatusReserva = async () => {
    if (!modalEditar || !novoStatus) return;

    try {
      await api.put('/reservas/atualizar-status', {
        id_cliente: modalEditar.id_cliente,
        id_produto: modalEditar.id_prod,
        status: novoStatus,
      });

      setMessage({ type: 'success', text: 'Status da reserva alterado com sucesso!' });
      setModalEditar(null);
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao alterar status'
      });
    }
  };

  const cancelarReserva = async (idCliente, idProduto, nomeCliente) => {
    if (!window.confirm(`Deseja cancelar a reserva de ${nomeCliente}?`)) return;

    try {
      await api.delete('/reservas/cancelar', {
        data: {
          id_cliente: idCliente,
          id_produto: idProduto,
        }
      });

      setMessage({ type: 'success', text: 'Reserva cancelada com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao cancelar reserva'
      });
    }
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      reservado: { label: 'Reservado', color: '#3498db', icon: '🔖' },
      comprado: { label: 'Comprado', color: '#27ae60', icon: '✅' },
      retirado: { label: 'Retirado', color: '#27ae60', icon: '✅' },
      cancelado: { label: 'Cancelado', color: '#e74c3c', icon: '❌' },
      pendente: { label: 'Pendente', color: '#f39c12', icon: '⏳' }
    };
    return statusMap[status] || statusMap.reservado;
  };

  const categorias = [...new Set(reservas.map(r => r.categoria))];

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Consultar Reservas de Produtos</h1>
          <p>Gerencie todas as reservas realizadas pelos clientes</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total de Reservas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔖</div>
            <div className="stat-content">
              <h3>{stats.pendentes}</h3>
              <p>Reservas Pendentes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.compradas}</h3>
              <p>Compradas/Retiradas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.canceladas}</h3>
              <p>Canceladas</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Filtros</h3>
            <button onClick={limparFiltros} className="btn btn-secondary btn-sm">
              Limpar Filtros
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {/* Filtro Status */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              >
                <option value="todos">Todos</option>
                <option value="reservado">Reservado</option>
                <option value="comprado">Comprado</option>
                <option value="retirado">Retirado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Filtro Categoria */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Categoria</label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              >
                <option value="todas">Todas</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filtro Data Início */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            {/* Filtro Data Fim */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>

            {/* Filtro Nome Cliente */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nome do Cliente</label>
              <input
                type="text"
                value={filtros.nomeCliente}
                onChange={(e) => setFiltros({ ...filtros, nomeCliente: e.target.value })}
                placeholder="Buscar por nome..."
              />
            </div>
          </div>

          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            Mostrando <strong>{reservasFiltradas.length}</strong> de <strong>{reservas.length}</strong> reservas
          </div>
        </div>

        {/* Lista de Reservas */}
        {reservasFiltradas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma reserva encontrada com os filtros aplicados</p>
          </div>
        ) : (
          <div className="grid-2">
            {reservasFiltradas.map((reserva) => {
              const statusInfo = getStatusInfo(reserva.status);

              return (
                <div key={`${reserva.id_cliente}-${reserva.id_prod}`} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{reserva.cliente_nome}</h3>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                        Reservado em {formatarData(reserva.data_reserva)}
                      </p>
                    </div>
                    <span
                      className={`badge`}
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>

                  <div className="card-body">
                    <p><strong>Produto:</strong> {reserva.nome_produto}</p>
                    <p><strong>Categoria:</strong> {reserva.categoria}</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(reserva.preco_venda).toFixed(2)}</p>
                    <p><strong>Estoque disponível:</strong> {reserva.quantidade_estoque}</p>

                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ecf0f1' }}>
                      <p style={{ fontSize: '13px', marginBottom: '5px' }}>
                        <strong>Contato:</strong>
                      </p>
                      {reserva.cliente_telefone && (
                        <p style={{ fontSize: '13px', margin: '2px 0' }}>
                          📞 {reserva.cliente_telefone}
                        </p>
                      )}
                      {reserva.cliente_email && (
                        <p style={{ fontSize: '13px', margin: '2px 0' }}>
                          📧 {reserva.cliente_email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="card-footer">
                    {reserva.status === 'reservado' && (
                      <>
                        <button
                          onClick={() => abrirModalEditar(reserva)}
                          className="btn btn-primary btn-sm"
                        >
                          Alterar Status
                        </button>
                        <button
                          onClick={() => cancelarReserva(reserva.id_cliente, reserva.id_prod, reserva.cliente_nome)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {reserva.status !== 'reservado' && (
                      <button
                        onClick={() => abrirModalEditar(reserva)}
                        className="btn btn-secondary btn-sm"
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Edição */}
        {modalEditar && (
          <div className="modal-overlay" onClick={() => setModalEditar(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Gerenciar Reserva</h3>

              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <p><strong>Cliente:</strong> {modalEditar.cliente_nome}</p>
                <p><strong>Produto:</strong> {modalEditar.nome_produto}</p>
                <p><strong>Data da Reserva:</strong> {formatarData(modalEditar.data_reserva)}</p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Status Atual:</strong> {getStatusInfo(modalEditar.status).label}
                </p>
              </div>

              <div className="form-group">
                <label>Alterar Status para:</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                >
                  <option value="reservado">🔖 Reservado (aguardando retirada)</option>
                  <option value="comprado">✅ Comprado (produto retirado)</option>
                  <option value="retirado">✅ Retirado (confirmado)</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>

              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px'
              }}>
                <strong>ℹ️ Informações:</strong>
                <ul style={{ marginTop: '10px', marginBottom: 0, paddingLeft: '20px' }}>
                  <li><strong>Reservado:</strong> Cliente fez a reserva, aguardando retirada</li>
                  <li><strong>Comprado/Retirado:</strong> Cliente retirou o produto (diminui estoque)</li>
                  <li><strong>Cancelado:</strong> Reserva foi cancelada</li>
                </ul>
              </div>

              <div className="modal-footer">
                {modalEditar.status !== novoStatus && (
                  <button onClick={alterarStatusReserva} className="btn btn-primary">
                    Confirmar Alteração
                  </button>
                )}
                <button onClick={() => setModalEditar(null)} className="btn btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultarReservas;