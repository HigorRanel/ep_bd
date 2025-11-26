import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const MinhasReservas = () => {
  const [produtos, setProdutos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosRes, reservasRes, categoriasRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/produtos/minhas-reservas'),
        api.get('/produtos/categorias')
      ]);

      setProdutos(produtosRes.data);
      setReservas(reservasRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  };

  const reservarProduto = async (idProduto) => {
    try {
      await api.post('/produtos/reservar', { id_produto: idProduto });
      setMessage({ type: 'success', text: 'Produto reservado com sucesso!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao reservar produto'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const atualizarStatusReserva = async (idReserva, status) => {
    try {
      await api.put(`/reservas/${idReserva}/status`, { status });
      setMessage({ type: 'success', text: 'Status atualizado!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao atualizar status' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const cancelarReserva = async (idReserva) => {
    if (!window.confirm('Deseja cancelar esta reserva?')) return;

    try {
      await api.delete(`/reservas/${idReserva}`);
      setMessage({ type: 'success', text: 'Reserva cancelada!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao cancelar reserva' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const filtrarProdutos = () => {
    let produtosFiltrados = produtos.filter(
      p => p.quantidade_estoque > 0
    );

    if (filtroNome.trim()) {
      const termo = filtroNome.toLowerCase();
      produtosFiltrados = produtosFiltrados.filter(p =>
        p.nome_produto.toLowerCase().includes(termo) ||
        (p.descricao && p.descricao.toLowerCase().includes(termo))
      );
    }

    if (filtroCategoria !== 'todas') {
      produtosFiltrados = produtosFiltrados.filter(
        p => p.categoria === filtroCategoria
      );
    }

    return produtosFiltrados;
  };

  const produtosFiltrados = filtrarProdutos();

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroCategoria('todas');
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando...</p>
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
            <h1>Reservas de Produtos</h1>
            <p>Reserve produtos para retirar na barbearia</p>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Minhas Reservas Ativas */}
        <div className="dashboard-section">
          <h2>Minhas Reservas Ativas</h2>
          {reservas.length === 0 ? (
            <div className="empty-state">
              <p>Você não tem reservas ativas</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Navegue pelos produtos disponíveis abaixo e faça sua primeira reserva!
              </p>
            </div>
          ) : (
            <div className="grid-2">
              {reservas.map((reserva) => (
                <div key={reserva.id_reserva} className="card">
                  <div className="card-header">
                    <h3>{reserva.nome_produto}</h3>
                    <span className={`badge badge-${reserva.status}`}>
                      {reserva.status === 'reservado' ? '🔖 Reservado' : 
                       reserva.status === 'comprado' ? '✅ Comprado' : 
                       reserva.status === 'retirado' ? '✅ Retirado' : reserva.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Categoria:</strong> {reserva.categoria}</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(reserva.preco_venda).toFixed(2)}</p>
                    <p><strong>Reservado em:</strong> {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}</p>

                    {reserva.status === 'reservado' && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        <strong>ℹ️ Status: Reservado</strong>
                        <p style={{ margin: '5px 0 0 0' }}>
                          Seu produto está reservado! Retire na barbearia quando desejar.
                        </p>
                      </div>
                    )}

                    {(reserva.status === 'comprado' || reserva.status === 'retirado') && (
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        <strong>✅ Status: {reserva.status === 'comprado' ? 'Comprado' : 'Retirado'}</strong>
                        <p style={{ margin: '5px 0 0 0' }}>
                          Produto já foi retirado.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    {reserva.status === 'reservado' && (
                      <>
                        <button
                          onClick={() => atualizarStatusReserva(reserva.id_reserva, 'comprado')}
                          className="btn btn-success btn-sm"
                        >
                          Marcar como Retirado
                        </button>
                        <button
                          onClick={() => cancelarReserva(reserva.id_reserva)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar Reserva
                        </button>
                      </>
                    )}

                    {(reserva.status === 'comprado' || reserva.status === 'retirado') && (
                      <span style={{ color: '#27ae60', fontSize: '13px' }}>
                        ✓ Produto retirado com sucesso
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Disponíveis */}
        <div className="dashboard-section">
          <h2>Produtos Disponíveis para Reserva</h2>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>🔍 Filtrar Produtos</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Buscar por Nome</label>
                <input
                  type="text"
                  placeholder="Digite o nome do produto..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Categoria</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '15px',
              borderTop: '1px solid #ecf0f1'
            }}>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {produtosFiltrados.length === produtos.filter(p => p.quantidade_estoque > 0).length ? (
                  `Mostrando todos os ${produtosFiltrados.length} produtos disponíveis`
                ) : (
                  `Mostrando ${produtosFiltrados.length} de ${produtos.filter(p => p.quantidade_estoque > 0).length} produtos`
                )}
              </div>

              {(filtroNome || filtroCategoria !== 'todas') && (
                <button
                  onClick={limparFiltros}
                  className="btn btn-secondary btn-sm"
                >
                  🔄 Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>
                {filtroNome || filtroCategoria !== 'todas'
                  ? 'Nenhum produto encontrado com os filtros aplicados'
                  : 'Nenhum produto disponível para reserva no momento'
                }
              </p>
              {(filtroNome || filtroCategoria !== 'todas') && (
                <button onClick={limparFiltros} className="btn btn-primary">
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid-3">
              {produtosFiltrados.map((produto) => {
                const jaReservado = reservas.some(r =>
                  r.id_prod === produto.id_produto &&
                  (r.status === 'reservado' || r.status === 'pendente')
                );

                return (
                  <div key={produto.id_produto} className="card">
                    <div className="card-header">
                      <h3>{produto.nome_produto}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                        <span className="badge" style={{
                          backgroundColor: '#3498db',
                          fontSize: '11px'
                        }}>
                          {produto.categoria}
                        </span>
                        {produto.quantidade_estoque <= produto.minimo_estoque && (
                          <span className="badge" style={{ backgroundColor: '#f39c12' }}>
                            Estoque Baixo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      {produto.descricao && (
                        <p style={{ fontSize: '13px', color: '#666', marginTop: '0', marginBottom: '10px' }}>
                          {produto.descricao.length > 80
                            ? `${produto.descricao.substring(0, 80)}...`
                            : produto.descricao
                          }
                        </p>
                      )}
                      <p style={{ marginTop: '10px' }}>
                        <strong>Preço:</strong>{' '}
                        <span style={{ fontSize: '18px', color: '#27ae60' }}>
                          R$ {parseFloat(produto.preco_venda).toFixed(2)}
                        </span>
                      </p>
                      <p><strong>Estoque disponível:</strong> {produto.quantidade_estoque} unidades</p>
                    </div>
                    <div className="card-footer">
                      <button
                        onClick={() => reservarProduto(produto.id_produto)}
                        className="btn btn-primary btn-sm btn-block"
                        disabled={jaReservado}
                      >
                        {jaReservado ? '✓ Já Reservado' : '🔖 Reservar Produto'}
                      </button>
                      {jaReservado && (
                        <small style={{
                          display: 'block',
                          marginTop: '8px',
                          color: '#666',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          Você já tem uma reserva deste produto
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="card" style={{ marginTop: '40px', backgroundColor: '#f8f9fa' }}>
          <h3>ℹ️ Como Funciona</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li><strong>Reservar:</strong> Ao clicar em "Reservar Produto", o item fica reservado automaticamente para você</li>
            <li><strong>Status Reservado:</strong> O produto está garantido e aguardando sua retirada na barbearia</li>
            <li><strong>Retirar:</strong> Vá até a barbearia e retire seu produto. Marque como "Retirado" após a retirada</li>
            <li><strong>Cancelar:</strong> Caso não queira mais o produto, você pode cancelar a reserva a qualquer momento</li>
            <li><strong>Busca:</strong> Use os filtros acima para encontrar produtos por nome ou categoria</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MinhasReservas;
