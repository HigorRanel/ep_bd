import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/forms.css';

const CadastrarProduto = () => {
  const [formData, setFormData] = useState({
    nome_produto: '',
    descricao: '',
    preco_compra: '',
    preco_venda: '',
    categoria: '',
    quantidade_estoque: '',
    minimo_estoque: '',
  });
  const [produtos, setProdutos] = useState([]);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarProdutos();
    carregarBaixoEstoque();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarBaixoEstoque = async () => {
    try {
      const response = await api.get('/produtos/estoque-baixo');
      setProdutosBaixoEstoque(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos com estoque baixo:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/produtos', {
        ...formData,
        preco_compra: parseFloat(formData.preco_compra),
        preco_venda: parseFloat(formData.preco_venda),
        quantidade_estoque: parseInt(formData.quantidade_estoque),
        minimo_estoque: parseInt(formData.minimo_estoque),
      });

      setMessage({ type: 'success', text: 'Produto cadastrado com sucesso!' });
      setFormData({
        nome_produto: '',
        descricao: '',
        preco_compra: '',
        preco_venda: '',
        categoria: '',
        quantidade_estoque: '',
        minimo_estoque: '',
      });
      carregarProdutos();
      carregarBaixoEstoque();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao cadastrar produto',
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarEstoque = async (idProduto, quantidade) => {
    const qtd = prompt('Quantidade a adicionar (use valor negativo para subtrair):', '0');
    if (qtd === null) return;

    try {
      await api.put(`/produtos/${idProduto}/estoque`, {
        quantidade: parseInt(qtd),
      });
      setMessage({ type: 'success', text: 'Estoque atualizado!' });
      carregarProdutos();
      carregarBaixoEstoque();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar produto' });
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="form-container">
        <div className="form-card">
          <h2>Cadastrar produto</h2>
          <p className="form-subtitle">Adicione um novo produto ao estoque</p>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome_produto">Nome do produto *</label>
              <input
                type="text"
                id="nome_produto"
                name="nome_produto"
                value={formData.nome_produto}
                onChange={handleChange}
                required
                placeholder="Ex: Pomada fixadora"
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoria *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma categoria</option>
                <option value="Cabelo">Cabelo</option>
                <option value="Barba">Barba</option>
                <option value="Modelador">Modelador</option>
                <option value="Tratamento">Tratamento</option>
                <option value="Coloração">Coloração</option>
                <option value="Acessório">Acessório</option>
                <option value="Equipamento">Equipamento</option>
                <option value="Insumo">Insumo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="3"
                placeholder="Descrição do produto..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preco_compra">Preço de compra (R$) *</label>
                <input
                  type="number"
                  id="preco_compra"
                  name="preco_compra"
                  value={formData.preco_compra}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preco_venda">Preço de venda (R$) *</label>
                <input
                  type="number"
                  id="preco_venda"
                  name="preco_venda"
                  value={formData.preco_venda}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantidade_estoque">Quantidade em estoque *</label>
                <input
                  type="number"
                  id="quantidade_estoque"
                  name="quantidade_estoque"
                  value={formData.quantidade_estoque}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="minimo_estoque">Estoque mínimo *</label>
                <input
                  type="number"
                  id="minimo_estoque"
                  name="minimo_estoque"
                  value={formData.minimo_estoque}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar produto'}
            </button>
          </form>
        </div>

        {/* Produtos com Estoque Baixo */}
        {produtosBaixoEstoque.length > 0 && (
          <div className="form-card" style={{ marginTop: '30px' }}>
            <h2>Produtos com estoque baixo</h2>
            <div className="grid-2">
              {produtosBaixoEstoque.map((produto) => (
                <div key={produto.id_produto} className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                  <div className="card-header">
                    <h3>{produto.nome_produto}</h3>
                    <span className="badge badge-falta">Baixo</span>
                  </div>
                  <div className="card-body">
                    <p><strong>Estoque:</strong> {produto.quantidade_estoque} / {produto.minimo_estoque} mínimo</p>
                    <p><strong>Categoria:</strong> {produto.categoria}</p>
                  </div>
                  <div className="card-footer">
                    <button
                      onClick={() => atualizarEstoque(produto.id_produto)}
                      className="btn btn-primary btn-sm"
                    >
                      Atualizar estoque
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Todos os Produtos */}
        <div className="form-card" style={{ marginTop: '30px' }}>
          <h2>Todos os produtos</h2>
          <div className="grid-3">
            {produtos.map((produto) => (
              <div key={produto.id_produto} className="card">
                <div className="card-header">
                  <h3>{produto.nome_produto}</h3>
                </div>
                <div className="card-body">
                  <p><strong>Categoria:</strong> {produto.categoria}</p>
                  <p><strong>Compra:</strong> R$ {parseFloat(produto.preco_compra).toFixed(2)}</p>
                  <p><strong>Venda:</strong> R$ {parseFloat(produto.preco_venda).toFixed(2)}</p>
                  <p><strong>Estoque:</strong> {produto.quantidade_estoque}</p>
                </div>
                <div className="card-footer">
                  <button
                    onClick={() => atualizarEstoque(produto.id_produto)}
                    className="btn btn-secondary btn-sm"
                  >
                    Ajustar estoque
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

export default CadastrarProduto;