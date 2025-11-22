import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../services/api';
import '../../styles/dashboard.css';

const NotificarClientes = () => {
  const [etapa, setEtapa] = useState(1); 
  const [tipoFiltro, setTipoFiltro] = useState('inativos');
  const [clientes, setClientes] = useState([]);
  const [clientesSelecionados, setClientesSelecionados] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [conteudoPersonalizado, setConteudoPersonalizado] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [diasInatividade, setDiasInatividade] = useState(60);
  const [minimoFaltas, setMinimoFaltas] = useState(3);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      const response = await api.get('/notificacoes/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const carregarClientes = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      let response;
      if (tipoFiltro === 'inativos') {
        response = await api.get('/notificacoes/clientes-inativos', {
          params: { dias: diasInatividade }
        });
      } else {
        response = await api.get('/notificacoes/clientes-faltas', {
          params: { minimo: minimoFaltas }
        });
      }
      
      setClientes(response.data.clientes || []);
      
      if (response.data.clientes.length === 0) {
        setMessage({ 
          type: 'info', 
          text: 'Nenhum cliente encontrado com os filtros aplicados' 
        });
      } else {
        setEtapa(2);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao carregar clientes' 
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCliente = (cpf) => {
    setClientesSelecionados(prev => {
      if (prev.includes(cpf)) {
        return prev.filter(c => c !== cpf);
      } else {
        return [...prev, cpf];
      }
    });
  };

  const selecionarTodos = () => {
    if (clientesSelecionados.length === clientes.length) {
      setClientesSelecionados([]);
    } else {
      setClientesSelecionados(clientes.map(c => c.cpf));
    }
  };

  const visualizarPreview = async () => {
    if (!templateSelecionado) {
      setMessage({ type: 'warning', text: 'Selecione um template primeiro' });
      return;
    }
    
    try {
      const response = await api.get('/notificacoes/template/preview', {
        params: {
          tipo: templateSelecionado,
          conteudo: conteudoPersonalizado
        }
      });
      
      setPreviewHtml(response.data);
      setShowPreview(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao gerar preview' });
    }
  };

  const enviarNotificacoes = async () => {
    if (clientesSelecionados.length === 0) {
      setMessage({ type: 'warning', text: 'Selecione pelo menos um cliente' });
      return;
    }
    
    if (!templateSelecionado) {
      setMessage({ type: 'warning', text: 'Selecione um template' });
      return;
    }
    
    if (!window.confirm(
      `Confirma o envio de ${clientesSelecionados.length} email(s)?`
    )) {
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.post('/notificacoes/enviar', {
        cpfs_clientes: clientesSelecionados,
        tipo_template: templateSelecionado,
        conteudo_personalizado: conteudoPersonalizado
      });
      
      setMessage({ 
        type: 'success', 
        text: response.data.message 
      });
      
      setEtapa(4);
      
      if (response.data.emails_falha && response.data.emails_falha.length > 0) {
        console.warn('Falhas no envio:', response.data.emails_falha);
      }
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao enviar notificações' 
      });
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setEtapa(1);
    setClientes([]);
    setClientesSelecionados([]);
    setTemplateSelecionado('');
    setConteudoPersonalizado('');
    setMessage({ type: '', text: '' });
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'Nunca';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>📧 Notificar Clientes</h1>
            <p>Envie emails personalizados para seus clientes</p>
          </div>
          <button onClick={reiniciar} className="btn btn-secondary">
            🔄 Reiniciar
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Indicador de Etapas */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: etapa >= 1 ? 1 : 0.3 
            }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: etapa >= 1 ? '#3498db' : '#ecf0f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                1
              </div>
              <span style={{ fontWeight: etapa === 1 ? 'bold' : 'normal' }}>
                Filtrar Clientes
              </span>
            </div>
            
            <div style={{ flex: 1, height: '2px', backgroundColor: '#ecf0f1', margin: '0 15px' }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: etapa >= 2 ? 1 : 0.3 
            }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: etapa >= 2 ? '#3498db' : '#ecf0f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                2
              </div>
              <span style={{ fontWeight: etapa === 2 ? 'bold' : 'normal' }}>
                Selecionar Clientes
              </span>
            </div>
            
            <div style={{ flex: 1, height: '2px', backgroundColor: '#ecf0f1', margin: '0 15px' }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: etapa >= 3 ? 1 : 0.3 
            }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: etapa >= 3 ? '#3498db' : '#ecf0f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                3
              </div>
              <span style={{ fontWeight: etapa === 3 ? 'bold' : 'normal' }}>
                Compor Mensagem
              </span>
            </div>
            
            <div style={{ flex: 1, height: '2px', backgroundColor: '#ecf0f1', margin: '0 15px' }} />
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: etapa >= 4 ? 1 : 0.3 
            }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: etapa >= 4 ? '#27ae60' : '#ecf0f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                ✓
              </div>
              <span style={{ fontWeight: etapa === 4 ? 'bold' : 'normal' }}>
                Concluído
              </span>
            </div>
          </div>
        </div>

        {/* Filtrar Clientes */}
        {etapa === 1 && (
          <div className="card">
            <h3>1️⃣ Escolha o Tipo de Notificação</h3>
            
            <div style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Tipo de Cliente</label>
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="inativos">Clientes Inativos (há muito tempo sem cortar)</option>
                  <option value="faltas">Clientes com Muitas Faltas</option>
                </select>
              </div>

              {tipoFiltro === 'inativos' && (
                <div className="form-group">
                  <label>Inativo há quantos dias?</label>
                  <input
                    type="number"
                    value={diasInatividade}
                    onChange={(e) => setDiasInatividade(e.target.value)}
                    min="7"
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: '#666' }}>
                    Clientes que não cortam há pelo menos {diasInatividade} dias
                  </small>
                </div>
              )}

              {tipoFiltro === 'faltas' && (
                <div className="form-group">
                  <label>Mínimo de Faltas</label>
                  <input
                    type="number"
                    value={minimoFaltas}
                    onChange={(e) => setMinimoFaltas(e.target.value)}
                    min="1"
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: '#666' }}>
                    Clientes com pelo menos {minimoFaltas} falta(s) registrada(s)
                  </small>
                </div>
              )}

              <button
                onClick={carregarClientes}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? 'Buscando...' : 'Buscar Clientes'}
              </button>
            </div>
          </div>
        )}

        {/* Selecionar Clientes */}
        {etapa === 2 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>2️⃣ Selecione os Clientes ({clientesSelecionados.length}/{clientes.length})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={selecionarTodos} className="btn btn-secondary btn-sm">
                  {clientesSelecionados.length === clientes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
                <button
                  onClick={() => setEtapa(3)}
                  className="btn btn-primary btn-sm"
                  disabled={clientesSelecionados.length === 0}
                >
                  Próximo →
                </button>
              </div>
            </div>

            <div className="grid-2">
              {clientes.map(cliente => {
                const selecionado = clientesSelecionados.includes(cliente.cpf);
                
                return (
                  <div
                    key={cliente.cpf}
                    className="card"
                    style={{
                      border: selecionado ? '2px solid #3498db' : '1px solid #ecf0f1',
                      cursor: 'pointer',
                      backgroundColor: selecionado ? '#e3f2fd' : 'white'
                    }}
                    onClick={() => toggleCliente(cliente.cpf)}
                  >
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => {}}
                          style={{ width: 'auto', margin: 0 }}
                        />
                        <h3 style={{ margin: 0 }}>{cliente.nome_completo}</h3>
                      </div>
                    </div>
                    <div className="card-body">
                      <p><strong>Email:</strong> {cliente.email}</p>
                      {cliente.dias_sem_visita !== undefined && (
                        <p><strong>Inativo há:</strong> {cliente.dias_sem_visita} dias</p>
                      )}
                      {cliente.total_faltas !== undefined && (
                        <p><strong>Total de Faltas:</strong> {cliente.total_faltas}</p>
                      )}
                      {cliente.total_atendimentos !== undefined && (
                        <p><strong>Atendimentos:</strong> {cliente.total_atendimentos}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compor Mensagem */}
        {etapa === 3 && (
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>3️⃣ Escolha o Template e Personalize a Mensagem</h3>
              
              <div className="form-group">
                <label>Template de Email</label>
                <select
                  value={templateSelecionado}
                  onChange={(e) => setTemplateSelecionado(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Selecione um template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.nome} - {template.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Conteúdo Personalizado (Opcional)</label>
                <textarea
                  value={conteudoPersonalizado}
                  onChange={(e) => setConteudoPersonalizado(e.target.value)}
                  rows="6"
                  placeholder="Adicione uma mensagem personalizada que será incluída no email..."
                  style={{ width: '100%', fontFamily: 'inherit' }}
                />
                <small style={{ color: '#666' }}>
                  💡 Você pode usar HTML aqui para formatação especial (negrito, listas, etc)
                </small>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={visualizarPreview}
                  className="btn btn-secondary"
                  disabled={!templateSelecionado}
                >
                  👁️ Visualizar Preview
                </button>
                <button
                  onClick={enviarNotificacoes}
                  className="btn btn-success"
                  disabled={loading || !templateSelecionado || clientesSelecionados.length === 0}
                >
                  {loading ? 'Enviando...' : `📧 Enviar para ${clientesSelecionados.length} Cliente(s)`}
                </button>
                <button
                  onClick={() => setEtapa(2)}
                  className="btn btn-secondary"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conclusão */}
        {etapa === 4 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#27ae60', marginBottom: '15px' }}>Notificações Enviadas!</h2>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
              Os emails foram enviados com sucesso para os clientes selecionados.
            </p>
            <button onClick={reiniciar} className="btn btn-primary">
              Enviar Mais Notificações
            </button>
          </div>
        )}

        {/* Modal de Preview */}
        {showPreview && (
          <div className="modal-overlay" onClick={() => setShowPreview(false)}>
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
            >
              <h3>Preview do Email</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Este é um exemplo de como o email será visualizado pelo cliente
              </p>
              
              <div 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  marginTop: '20px'
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button onClick={() => setShowPreview(false)} className="btn btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informações sobre Notificações */}
        <div className="card" style={{ marginTop: '40px', backgroundColor: '#f8f9fa' }}>
          <h3>💡 Sobre as Notificações</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '15px', marginBottom: 0 }}>
            <li><strong>Templates Profissionais:</strong> Emails com design responsivo e profissional</li>
            <li><strong>Personalização:</strong> Adicione conteúdo personalizado a cada tipo de mensagem</li>
            <li><strong>Segmentação:</strong> Envie para clientes específicos baseado em critérios</li>
            <li><strong>Preview:</strong> Visualize como o email ficará antes de enviar</li>
            <li><strong>Rastreamento:</strong> Acompanhe quais emails foram enviados com sucesso</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificarClientes;