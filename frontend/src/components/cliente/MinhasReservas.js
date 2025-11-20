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
      // AJUSTE: Backend agora cria com status 'reservado' automaticamente
      // Não precisa passar status, o backend define como 'reservado' por padrão
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
                    
                    {/* Informação sobre status */}
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
                    
                    {reserva.status === 'comprado' && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        backgroundColor: '#e8f5e9',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        <strong>✅ Status: Comprado</strong>
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
                          onClick={() => atualizarStatusReserva(reserva.id_prod, 'comprado')}
                          className="btn btn-success btn-sm"
                        >
                          Marcar como Retirado
                        </button>
                        <button
                          onClick={() => cancelarReserva(reserva.id_prod)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancelar Reserva
                        </button>
                      </>
                    )}
                    
                    {reserva.status === 'comprado' && (
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
          <div className="grid-3">
            {produtos
              .filter(p => p.status === 'ativo' && p.quantidade_estoque > 0)
              .map((produto) => {
                // Verificar se já está reservado
                const jaReservado = reservas.some(r => 
                  r.id_prod === produto.id_produto && 
                  (r.status === 'reservado' || r.status === 'pendente')
                );
                
                return (
                  <div key={produto.id_produto} className="card">
                    <div className="card-header">
                      <h3>{produto.nome_produto}</h3>
                      {produto.quantidade_estoque <= produto.minimo_estoque && (
                        <span className="badge" style={{ backgroundColor: '#f39c12' }}>
                          Estoque Baixo
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <p><strong>Categoria:</strong> {produto.categoria}</p>
                      {produto.descricao && (
                        <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                          {produto.descricao}
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
          
          {produtos.filter(p => p.status === 'ativo' && p.quantidade_estoque > 0).length === 0 && (
            <div className="empty-state">
              <p>Nenhum produto disponível para reserva no momento</p>
            </div>
          )}
        </div>

        {/* Informações sobre Reservas */}
        <div className="card" style={{ marginTop: '40px', backgroundColor: '#f8f9fa' }}>
          <h3>ℹ️ Como Funciona</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li><strong>Reservar:</strong> Ao clicar em "Reservar Produto", o item fica reservado automaticamente para você</li>
            <li><strong>Status Reservado:</strong> O produto está garantido e aguardando sua retirada na barbearia</li>
            <li><strong>Retirar:</strong> Vá até a barbearia e retire seu produto. Marque como "Retirado" após a retirada</li>
            <li><strong>Cancelar:</strong> Caso não queira mais o produto, você pode cancelar a reserva a qualquer momento</li>
            <li><strong>Estoque:</strong> Produtos reservados não diminuem o estoque até serem marcados como retirados</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MinhasReservas;