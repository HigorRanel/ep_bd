import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Icon from '../common/Icon';
import api from '../../services/api';
import '../../styles/dashboard.css';

const ListarProdutos = () => {

  const [produtos, setProdutos] = useState([]);
  const [paginacao, setPaginacao] = useState({
    total_produtos: 0,
    total_paginas: 0,
    pagina_atual: 1,
    por_pagina: 10,
    tem_proxima: false,
    tem_anterior: false
  });


  const [filtros, setFiltros] = useState({
    nome: '',
    categoria: '',
    status: ''
  });

  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [modalEditar, setModalEditar] = useState(null);
  const [produtoEditando, setProdutoEditando] = useState(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [paginacao.pagina_atual, paginacao.por_pagina]);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/produtos/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      setLoading(true);

      const params = {
        pagina: paginacao.pagina_atual,
        por_pagina: paginacao.por_pagina
      };

      if (filtros.nome.trim()) {
        params.nome = filtros.nome.trim();
      }
      if (filtros.categoria) {
        params.categoria = filtros.categoria;
      }
      if (filtros.status) {
        params.status = filtros.status;
      }

      const response = await api.get('/produtos/paginado', { params });

      setProdutos(response.data.produtos);
      setPaginacao({
        total_produtos: response.data.total_produtos,
        total_paginas: response.data.total_paginas,
        pagina_atual: response.data.pagina_atual,
        por_pagina: response.data.por_pagina,
        tem_proxima: response.data.tem_proxima,
        tem_anterior: response.data.tem_anterior
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao carregar produtos'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltros = () => {
    setPaginacao(prev => ({
      ...prev,
      pagina_atual: 1
    }));
    carregarProdutos();
  };

  const limparFiltros = () => {
    setFiltros({
      nome: '',
      categoria: '',
      status: ''
    });
    setPaginacao(prev => ({
      ...prev,
      pagina_atual: 1
    }));

    setTimeout(() => carregarProdutos(), 0);
  };

  const mudarPagina = (novaPagina) => {
    setPaginacao(prev => ({
      ...prev,
      pagina_atual: novaPagina
    }));
  };

  const mudarItensPorPagina = (novoValor) => {
    setPaginacao(prev => ({
      ...prev,
      por_pagina: parseInt(novoValor),
      pagina_atual: 1
    }));
  };

  const atualizarEstoque = async (idProduto, nomeProduto, estoqueAtual) => {
    const qtd = prompt(
      `${nomeProduto}\nEstoque atual: ${estoqueAtual}\n\nQuantidade a adicionar (use valor negativo para subtrair):`,
      '0'
    );

    if (qtd === null) return;

    try {
      await api.put(`/produtos/${idProduto}/estoque`, {
        quantidade: parseInt(qtd)
      });
      setMessage({ type: 'success', text: 'Estoque atualizado com sucesso!' });
      carregarProdutos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar estoque'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const abrirModalEditar = (produto) => {
    setModalEditar(true);
    setProdutoEditando({ ...produto });
  };

  const salvarEdicao = async () => {
    try {
      await api.put(`/produtos/${produtoEditando.id_produto}`, produtoEditando);
      setMessage({ type: 'success', text: 'Produto atualizado com sucesso!' });
      setModalEditar(false);
      setProdutoEditando(null);
      carregarProdutos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao atualizar produto'
      });
    }
  };

  const deletarProduto = async (idProduto, nomeProduto) => {
    if (!window.confirm(`Deseja realmente deletar o produto "${nomeProduto}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await api.delete(`/produtos/${idProduto}`);
      setMessage({ type: 'success', text: 'Produto deletado com sucesso!' });
      carregarProdutos();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erro ao deletar produto'
      });
    }
  };

  const gerarPaginas = () => {
    const paginas = [];
    const maxPaginasVisiveis = 5;

    let inicio = Math.max(1, paginacao.pagina_atual - Math.floor(maxPaginasVisiveis / 2));
    let fim = Math.min(paginacao.total_paginas, inicio + maxPaginasVisiveis - 1);

    if (fim - inicio + 1 < maxPaginasVisiveis) {
      inicio = Math.max(1, fim - maxPaginasVisiveis + 1);
    }

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    return paginas;
  };

  const accent = { color: 'var(--color-accent)' };
  const muted = { color: 'var(--color-text-muted)' };

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Gerenciar produtos</h1>
            <p>Pesquise e gerencie o estoque de produtos</p>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <span className="stat-icon"><Icon name="package" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{paginacao.total_produtos}</h3>
              <p>Total de produtos</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="list" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{paginacao.total_paginas}</h3>
              <p>Total de páginas</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><Icon name="chart" size={28} style={accent} /></span>
            <div className="stat-content">
              <h3>{produtos.length}</h3>
              <p>Produtos nesta página</p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: mostrarFiltros ? '20px' : '0'
          }}>
            <h3 style={{ margin: 0 }}>Filtros e busca</h3>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="btn btn-secondary btn-sm"
            >
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          {mostrarFiltros && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginTop: '20px'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nome do produto</label>
                  <input
                    type="text"
                    value={filtros.nome}
                    onChange={(e) => handleFiltroChange('nome', e.target.value)}
                    placeholder="Digite o nome..."
                    onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Categoria</label>
                  <select
                    value={filtros.categoria}
                    onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => handleFiltroChange('status', e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    <option value="disponivel">Disponível</option>
                    <option value="indisponivel">Indisponível</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Itens por página</label>
                  <select
                    value={paginacao.por_pagina}
                    onChange={(e) => mudarItensPorPagina(e.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-border)'
              }}>
                <button onClick={aplicarFiltros} className="btn btn-primary">
                  Aplicar filtros
                </button>
                <button onClick={limparFiltros} className="btn btn-secondary">
                  Limpar filtros
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando produtos...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum produto encontrado com os filtros aplicados</p>
            <button onClick={limparFiltros} className="btn btn-primary">
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {produtos.map(produto => (
                <div key={produto.id_produto} className="card">
                  <div className="card-header">
                    <h3>{produto.nome_produto}</h3>
                    {produto.quantidade_estoque <= produto.minimo_estoque && (
                      <span className="badge badge-falta">Baixo</span>
                    )}
                  </div>

                  <div className="card-body">
                    <p><strong>Categoria:</strong> {produto.categoria}</p>
                    {produto.descricao && (
                      <p style={{ fontSize: '13px', ...muted }}>
                        {produto.descricao.length > 80
                          ? `${produto.descricao.substring(0, 80)}...`
                          : produto.descricao
                        }
                      </p>
                    )}
                    <p><strong>Compra:</strong> R$ {parseFloat(produto.preco_compra).toFixed(2)}</p>
                    <p><strong>Venda:</strong> R$ {parseFloat(produto.preco_venda).toFixed(2)}</p>
                    <p>
                      <strong>Estoque:</strong>{' '}
                      <span style={{
                        color: produto.quantidade_estoque <= produto.minimo_estoque
                          ? 'var(--color-danger)'
                          : 'var(--color-success)',
                        fontWeight: 'bold'
                      }}>
                        {produto.quantidade_estoque}
                      </span>
                      {' '}/ {produto.minimo_estoque} mínimo
                    </p>
                    <p><strong>Status:</strong> {produto.status}</p>
                  </div>

                  <div className="card-footer">
                    <button
                      onClick={() => atualizarEstoque(
                        produto.id_produto,
                        produto.nome_produto,
                        produto.quantidade_estoque
                      )}
                      className="btn btn-primary btn-sm"
                    >
                      Ajustar estoque
                    </button>
                    <button
                      onClick={() => abrirModalEditar(produto)}
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deletarProduto(produto.id_produto, produto.nome_produto)}
                      className="btn btn-danger btn-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="card" style={{ marginTop: '30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={muted}>
                  Mostrando produtos{' '}
                  <strong>
                    {(paginacao.pagina_atual - 1) * paginacao.por_pagina + 1}
                  </strong>
                  {' '}até{' '}
                  <strong>
                    {Math.min(
                      paginacao.pagina_atual * paginacao.por_pagina,
                      paginacao.total_produtos
                    )}
                  </strong>
                  {' '}de{' '}
                  <strong>{paginacao.total_produtos}</strong>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => mudarPagina(1)}
                    disabled={!paginacao.tem_anterior}
                    className="btn btn-secondary btn-sm"
                  >
                    ««
                  </button>

                  <button
                    onClick={() => mudarPagina(paginacao.pagina_atual - 1)}
                    disabled={!paginacao.tem_anterior}
                    className="btn btn-secondary btn-sm"
                  >
                    « Anterior
                  </button>

                  {gerarPaginas().map(numeroPagina => (
                    <button
                      key={numeroPagina}
                      onClick={() => mudarPagina(numeroPagina)}
                      className={`btn btn-sm ${
                        numeroPagina === paginacao.pagina_atual
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  ))}

                  <button
                    onClick={() => mudarPagina(paginacao.pagina_atual + 1)}
                    disabled={!paginacao.tem_proxima}
                    className="btn btn-secondary btn-sm"
                  >
                    Próxima »
                  </button>

                  <button
                    onClick={() => mudarPagina(paginacao.total_paginas)}
                    disabled={!paginacao.tem_proxima}
                    className="btn btn-secondary btn-sm"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Edição */}
        {modalEditar && produtoEditando && (
          <div className="modal-overlay" onClick={() => setModalEditar(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Editar produto</h3>

              <div className="form-group">
                <label>Nome do produto</label>
                <input
                  type="text"
                  value={produtoEditando.nome_produto}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, nome_produto: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={produtoEditando.descricao || ''}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={produtoEditando.preco_compra}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, preco_compra: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Preço venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={produtoEditando.preco_venda}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, preco_venda: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={produtoEditando.categoria}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Estoque mínimo</label>
                  <input
                    type="number"
                    value={produtoEditando.minimo_estoque}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, minimo_estoque: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={produtoEditando.status}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, status: e.target.value })}
                >
                  <option value="disponivel">Disponível</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </div>

              <div className="modal-footer">
                <button onClick={salvarEdicao} className="btn btn-primary">
                  Salvar alterações
                </button>
                <button onClick={() => setModalEditar(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListarProdutos;