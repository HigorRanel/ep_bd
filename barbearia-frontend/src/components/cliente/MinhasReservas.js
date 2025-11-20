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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosRes, reservasRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/produtos/minhas-reservas'),
      ]);
      setProdutos(produtosRes.data);
      setReservas(reservasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    }
  };

  const atualizarStatusReserva = async (idProduto, status) => {
    try {
      await api.put(`/reservas/${idProduto}/status`, { status });
      setMessage({ type: 'success', text: 'Status atualizado!' });
      carregarDados();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar status' });
    }
  };

  const cancelarReserva = async (idProduto) => {
    if (!window.confirm('Deseja cancelar esta reserva?')) return;
    
    try {
      await api.delete(`/reservas/${idProduto}`);
      setMessage({ type: 'success', text: 'Reserva cancelada!' });
      carregarDados();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao cancelar reserva' });
    }
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
        <h1>Reservas de Produtos</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Minhas Reservas */}
        <div className="dashboard-section">
          <h2>Minhas Reservas</h2>
          {reservas.length === 0 ? (
            <div className="empty-state">
              <p>Você não tem reservas ativas</p>
            </div>
          ) : (
            <div className="grid-2">
              {reservas.map((reserva) => (
                <div key={reserva.id_prod} className="card">
                  <div className="card-header">
                    <h3>{reserva.nome_produto}</h3>
                    <span className={`badge badge-${reserva.status}`}>
                      {reserva.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Categoria:</strong> {reserva.categoria}</p>
                    <p><strong>Preço:</strong> R$ {parseFloat(reserva.preco_venda).toFixed(2)}</p>
                    <p><strong>Reservado em:</strong> {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="card-footer">
                    {reserva.status === 'reservado' && (
                      <>
                        <button
                          onClick={() => atualizarStatusReserva(reserva.id_prod, 'comprado')}
                          className="btn btn-success btn-sm"
                        >
                          Marcar como Retirado
                        </button>
                        <button
                          onClick={() => cancelarReserva(reserva.id_prod)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Disponíveis */}
        <div className="dashboard-section">
          <h2>Produtos Disponíveis</h2>
          <div className="grid-3">
            {produtos
              .filter(p => p.status === 'ativo' && p.quantidade_estoque > 0)
              .map((produto) => (
                <div key={produto.id_produto} className="card">
                  <div className="card-header">
                    <h3>{produto.nome_produto}</h3>
                  </div>
                  <div className="card-body">
                    <p><strong>Categoria:</strong> {produto.categoria}</p>
                    {produto.descricao && <p>{produto.descricao}</p>}
                    <p><strong>Preço:</strong> R$ {parseFloat(produto.preco_venda).toFixed(2)}</p>
                    <p><strong>Estoque:</strong> {produto.quantidade_estoque} unidades</p>
                  </div>
                  <div className="card-footer">
                    <button
                      onClick={() => reservarProduto(produto.id_produto)}
                      className="btn btn-primary btn-sm btn-block"
                      disabled={reservas.some(r => r.id_prod === produto.id_produto && r.status === 'reservado')}
                    >
                      {reservas.some(r => r.id_prod === produto.id_produto && r.status === 'reservado') 
                        ? 'Já Reservado' 
                        : 'Reservar'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinhasReservas;