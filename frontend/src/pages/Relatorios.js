import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import '../styles/relatorios.css';

const Relatorios = () => {
  const { isBarbeiroChefe } = useAuth();

  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    cpf_barbeiro: ''
  });

  const [relatorioAtivo, setRelatorioAtivo] = useState(null);
  const [dadosRelatorio, setDadosRelatorio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setPeriodoRapido = (dias) => {
    const hoje = new Date();
    const dataFim = hoje.toISOString().split('T')[0];

    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - dias);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    setFiltros({
      ...filtros,
      data_inicio: dataInicioStr,
      data_fim: dataFim
    });
  };

  const handleChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const gerarRelatorio = async (tipo) => {
    if (!filtros.data_inicio || !filtros.data_fim) {
      setError('Por favor, selecione o período do relatório');
      return;
    }

    setLoading(true);
    setError('');
    setRelatorioAtivo(tipo);

    try {
      let endpoint = '';
      
      let params = {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim
      };

      if (tipo === 'financeiro') {
        endpoint = '/relatorios/financeiro';
        if (filtros.cpf_barbeiro) {
          params.cpf_barbeiro = filtros.cpf_barbeiro;
        }
      } else if (tipo === 'produtos') {
        endpoint = '/relatorios/produtos';
      } else if (tipo === 'clientes') {
        endpoint = '/relatorios/clientes';
      }

      const response = await api.get(endpoint, { params });
      setDadosRelatorio(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    window.print();
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="relatorios-container">

        <div className="dashboard-header">
          <h1>📊 Relatórios Gerenciais</h1>
          <p>Análise detalhada de desempenho e movimentação financeira</p>
        </div>

        <div className="filtros-card">
          <h3>🔍 Filtros de Período</h3>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="filtros-grid">
            <div className="form-group">
              <label>Data Início *</label>
              <input
                type="date"
                name="data_inicio"
                value={filtros.data_inicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Data Fim *</label>
              <input
                type="date"
                name="data_fim"
                value={filtros.data_fim}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="periodos-rapidos">
            <span>Períodos rápidos:</span>
            <button onClick={() => setPeriodoRapido(7)} className="btn btn-sm btn-secondary">
              Últimos 7 dias
            </button>
            <button onClick={() => setPeriodoRapido(30)} className="btn btn-sm btn-secondary">
              Últimos 30 dias
            </button>
            <button onClick={() => setPeriodoRapido(90)} className="btn btn-sm btn-secondary">
              Últimos 90 dias
            </button>
          </div>
        </div>

        <div className="tipos-relatorio">
          <h3>Escolha o tipo de relatório</h3>
          <div className="grid-3">
            <div
              className={`tipo-card ${relatorioAtivo === 'financeiro' ? 'active' : ''}`}
              onClick={() => gerarRelatorio('financeiro')}
            >
              <div className="tipo-icon">💰</div>
              <h4>Relatório Financeiro</h4>
              <p>Balanço, receitas, gastos e lucro líquido</p>
            </div>

            <div
              className={`tipo-card ${relatorioAtivo === 'produtos' ? 'active' : ''}`}
              onClick={() => gerarRelatorio('produtos')}
            >
              <div className="tipo-icon">📦</div>
              <h4>Relatório de Produtos</h4>
              <p>Produtos mais/menos vendidos e análise de estoque</p>
            </div>

            <div
              className={`tipo-card ${relatorioAtivo === 'clientes' ? 'active' : ''}`}
              onClick={() => gerarRelatorio('clientes')}
            >
              <div className="tipo-icon">👥</div>
              <h4>Relatório de Clientes</h4>
              <p>Comportamento, frequência e padrões de consumo</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Gerando relatório...</p>
          </div>
        )}

        {!loading && dadosRelatorio && (
          <div className="relatorio-resultado">
            <div className="resultado-header">
              <h3>
                {relatorioAtivo === 'financeiro' && '💰 Relatório Financeiro'}
                {relatorioAtivo === 'produtos' && '📦 Relatório de Produtos'}
                {relatorioAtivo === 'clientes' && '👥 Relatório de Clientes'}
              </h3>
              <button onClick={exportarPDF} className="btn btn-primary">
                🖨️ Exportar PDF
              </button>
            </div>

            <div className="relatorio-periodo">
              <p><strong>Período:</strong> {dadosRelatorio.periodo?.data_inicio} até {dadosRelatorio.periodo?.data_fim}</p>
            </div>

            {relatorioAtivo === 'financeiro' && <RelatorioFinanceiro dados={dadosRelatorio} />}
            {relatorioAtivo === 'produtos' && <RelatorioProdutos dados={dadosRelatorio} />}
            {relatorioAtivo === 'clientes' && <RelatorioClientes dados={dadosRelatorio} />}
          </div>
        )}
      </div>
    </div>
  );
};

const RelatorioFinanceiro = ({ dados }) => {
  const resumo = dados.resumo_financeiro;
  const metricas = dados.metricas_atendimento;
  const produtos = dados.produtos;
  const planos = dados.planos;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>R$ {resumo.receita_total?.toFixed(2)}</h3>
            <p>Receita Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>R$ {resumo.gastos_total?.toFixed(2)}</h3>
            <p>Gastos Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>R$ {resumo.lucro_liquido?.toFixed(2)}</h3>
            <p>Lucro Líquido</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{resumo.margem_lucro?.toFixed(1)}%</h3>
            <p>Margem de Lucro</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>📊 Detalhamento de Receitas</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Receita de Serviços</span>
            <span className="info-value">R$ {resumo.receita_servicos?.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Receita de Produtos</span>
            <span className="info-value">R$ {resumo.receita_produtos?.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Receita de Planos</span>
            <span className="info-value">R$ {resumo.receita_planos?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>📊 Métricas de Atendimento</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Total de Atendimentos</span>
            <span className="info-value">{metricas.total_atendimentos}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Clientes Atendidos</span>
            <span className="info-value">{metricas.clientes_atendidos}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ticket Médio</span>
            <span className="info-value">R$ {metricas.ticket_medio?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>📦 Vendas de Produtos</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Total de Vendas</span>
            <span className="info-value">{produtos.vendas}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Receita</span>
            <span className="info-value">R$ {produtos.receita?.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Lucro</span>
            <span className="info-value">R$ {produtos.lucro?.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gastos</span>
            <span className="info-value">R$ {produtos.gastos?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>💼 Assinaturas de Planos</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Total de Assinaturas</span>
            <span className="info-value">{planos.total_assinaturas}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Novas Assinaturas</span>
            <span className="info-value">{planos.novas_assinaturas}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cancelamentos</span>
            <span className="info-value">{planos.cancelamentos}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Receita Estimada</span>
            <span className="info-value">R$ {planos.receita_estimada?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {dados.detalhamento_servicos && dados.detalhamento_servicos.length > 0 && (
        <div className="card">
          <h4>✂️ Detalhamento por Serviço</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Quantidade</th>
                  <th>Receita Total</th>
                  <th>Preço Médio</th>
                </tr>
              </thead>
              <tbody>
                {dados.detalhamento_servicos.map((servico, index) => (
                  <tr key={index}>
                    <td>{servico.servico_nome}</td>
                    <td>{servico.quantidade}</td>
                    <td>R$ {parseFloat(servico.receita_total).toFixed(2)}</td>
                    <td>R$ {parseFloat(servico.preco_medio).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const RelatorioProdutos = ({ dados }) => {
  return (
    <>
      {dados.mais_vendidos && dados.mais_vendidos.length > 0 && (
        <div className="card">
          <h4>🔥 Produtos Mais Vendidos</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd Vendida</th>
                  <th>Receita</th>
                  <th>Lucro</th>
                  <th>Lucro/Unidade</th>
                </tr>
              </thead>
              <tbody>
                {dados.mais_vendidos.map((produto, index) => (
                  <tr key={index}>
                    <td>{produto.nome_produto}</td>
                    <td>{produto.categoria}</td>
                    <td>{produto.quantidade_vendida}</td>
                    <td>R$ {parseFloat(produto.receita_total).toFixed(2)}</td>
                    <td className="lucro-positivo">R$ {parseFloat(produto.lucro_total).toFixed(2)}</td>
                    <td>R$ {parseFloat(produto.lucro_medio_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.menos_vendidos && dados.menos_vendidos.length > 0 && (
        <div className="card">
          <h4>❄️ Produtos Menos Vendidos</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd Vendida</th>
                  <th>Receita</th>
                  <th>Lucro</th>
                </tr>
              </thead>
              <tbody>
                {dados.menos_vendidos.map((produto, index) => (
                  <tr key={index}>
                    <td>{produto.nome_produto}</td>
                    <td>{produto.categoria}</td>
                    <td>{produto.quantidade_vendida}</td>
                    <td>R$ {parseFloat(produto.receita_total).toFixed(2)}</td>
                    <td>R$ {parseFloat(produto.lucro_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.sem_vendas && dados.sem_vendas.length > 0 && (
        <div className="card">
          <h4>⚠️ Produtos Sem Vendas no Período</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Preço de Venda</th>
                </tr>
              </thead>
              <tbody>
                {dados.sem_vendas.map((produto, index) => (
                  <tr key={index}>
                    <td>{produto.nome_produto}</td>
                    <td>{produto.categoria}</td>
                    <td>{produto.quantidade_estoque}</td>
                    <td>R$ {parseFloat(produto.preco_venda).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.por_categoria && dados.por_categoria.length > 0 && (
        <div className="card">
          <h4>📊 Vendas por Categoria</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Qtd Vendida</th>
                  <th>Receita Total</th>
                  <th>Lucro Total</th>
                </tr>
              </thead>
              <tbody>
                {dados.por_categoria.map((categoria, index) => (
                  <tr key={index}>
                    <td>{categoria.categoria}</td>
                    <td>{categoria.quantidade_vendida}</td>
                    <td>R$ {parseFloat(categoria.receita_total).toFixed(2)}</td>
                    <td className="lucro-positivo">R$ {parseFloat(categoria.lucro_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const RelatorioClientes = ({ dados }) => {
  return (
    <>
      {dados.mais_frequentes && dados.mais_frequentes.length > 0 && (
        <div className="card">
          <h4>⭐ Clientes Mais Frequentes</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Total Visitas</th>
                  <th>Valor Gasto</th>
                  <th>Ticket Médio</th>
                  <th>Última Visita</th>
                </tr>
              </thead>
              <tbody>
                {dados.mais_frequentes.map((cliente, index) => (
                  <tr key={index}>
                    <td>{cliente.nome_completo}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.total_visitas}</td>
                    <td>R$ {parseFloat(cliente.valor_gasto).toFixed(2)}</td>
                    <td>R$ {parseFloat(cliente.ticket_medio).toFixed(2)}</td>
                    <td>{new Date(cliente.ultima_visita).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.inativos && dados.inativos.length > 0 && (
        <div className="card">
          <h4>⏰ Clientes Inativos</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Última Visita</th>
                  <th>Dias sem Visita</th>
                </tr>
              </thead>
              <tbody>
                {dados.inativos.map((cliente, index) => (
                  <tr key={index}>
                    <td>{cliente.nome_completo}</td>
                    <td>{cliente.email}</td>
                    <td>{new Date(cliente.ultima_visita).toLocaleDateString('pt-BR')}</td>
                    <td className="dias-inativo">{cliente.dias_sem_visita} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.servicos_populares && dados.servicos_populares.length > 0 && (
        <div className="card">
          <h4>✂️ Serviços Mais Populares</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Clientes Únicos</th>
                  <th>Total Agendamentos</th>
                  <th>Preço Médio</th>
                </tr>
              </thead>
              <tbody>
                {dados.servicos_populares.map((servico, index) => (
                  <tr key={index}>
                    <td>{servico.servico_nome}</td>
                    <td>{servico.clientes_unicos}</td>
                    <td>{servico.total_agendamentos}</td>
                    <td>R$ {parseFloat(servico.preco_medio).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dados.com_faltas && dados.com_faltas.length > 0 && (
        <div className="card">
          <h4>⚠️ Clientes com Faltas</h4>
          <div className="table-responsive">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Total de Faltas</th>
                  <th>Última Falta</th>
                </tr>
              </thead>
              <tbody>
                {dados.com_faltas.map((cliente, index) => (
                  <tr key={index}>
                    <td>{cliente.nome_completo}</td>
                    <td>{cliente.email}</td>
                    <td className="faltas">{cliente.total_faltas}</td>
                    <td>{new Date(cliente.ultima_falta).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default Relatorios;