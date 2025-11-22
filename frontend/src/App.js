import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Páginas públicas
import Home from './pages/Home';
import Login from './pages/Login';
import CadastroCliente from './pages/CadastroCliente';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import NotFound from './pages/NotFound';

// Páginas comuns (qualquer usuário logado)
import Perfil from './pages/Perfil';

// Páginas do Cliente
import DashboardCliente from './components/cliente/DashBoardCliente';
import AgendarServico from './components/cliente/AgendarServico';
import MeusAgendamentos from './components/cliente/MeusAgendamentos';
import MinhasReservas from './components/cliente/MinhasReservas';
import MeusPlanos from './components/cliente/MeusPlanos';

// Páginas do Barbeiro
import DashboardBarbeiro from './components/barbeiro/DashBoardBarbeiro';
import AgendaBarbeiro from './components/barbeiro/AgendaBarbeiro';
import CadastrarServico from './components/barbeiro/CadastrarServico';
import CadastrarProduto from './components/barbeiro/CadastrarProduto';
import CadastrarPlano from './components/barbeiro/CadastrarPlano';
import CadastrarBarbeiro from './components/barbeiro/CadastrarBarbeiro';
import MinhasAvaliacoes from './components/barbeiro/MinhasAvaliacoes';
import ConsultarReservas from './components/barbeiro/ConsultarReservas';
import ListarProdutos from './components/barbeiro/ListarProdutos';
import GerenciarClientes from './components/barbeiro/GerenciarClientes';
import DetalhesCliente from './components/barbeiro/DetalhesCliente';
import GerenciarPlanos from './components/barbeiro/GerenciarPlanos';
import NotificarClientes from './components/barbeiro/NotificarClientes';

import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroCliente />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />

          {/* Rota do Perfil (qualquer usuário logado) */}
          <Route 
            path="/perfil" 
            element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            } 
          />

          {/* Rotas do Cliente */}
          <Route
            path="/cliente/dashboard"
            element={
              <PrivateRoute requiredType="cliente">
                <DashboardCliente />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/agendar"
            element={
              <PrivateRoute requiredType="cliente">
                <AgendarServico />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/agendamentos"
            element={
              <PrivateRoute requiredType="cliente">
                <MeusAgendamentos />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/reservas"
            element={
              <PrivateRoute requiredType="cliente">
                <MinhasReservas />
              </PrivateRoute>
            }
          />
          <Route
            path="/cliente/planos"
            element={
              <PrivateRoute requiredType="cliente">
                <MeusPlanos />
              </PrivateRoute>
            }
          />

          {/* Rotas do Barbeiro */}
          <Route
            path="/barbeiro/dashboard"
            element={
              <PrivateRoute requiredType="barbeiro">
                <DashboardBarbeiro />
              </PrivateRoute>
            }
          />
          <Route
            path="/barbeiro/agenda"
            element={
              <PrivateRoute requiredType="barbeiro">
                <AgendaBarbeiro />
              </PrivateRoute>
            }
          />
          
          {/* NOVA: Gestão de Clientes */}
          <Route
            path="/barbeiro/clientes"
            element={
              <PrivateRoute requiredType="barbeiro">
                <GerenciarClientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/barbeiro/clientes/:cpf"
            element={
              <PrivateRoute requiredType="barbeiro">
                <DetalhesCliente />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/barbeiro/servicos/novo"
            element={
              <PrivateRoute requiredType="barbeiro">
                <CadastrarServico />
              </PrivateRoute>
            }
          />
          <Route
            path="/barbeiro/avaliacoes"
            element={
              <PrivateRoute requiredType="barbeiro">
                <MinhasAvaliacoes />
              </PrivateRoute>
            }
          />

          {/* Notificações - Apenas Barbeiros */}
          <Route
            path="/barbeiro/notificacoes"
            element={
              <PrivateRoute requiredType="barbeiro">
                <NotificarClientes />
              </PrivateRoute>
            }
          />

          <Route
            path="/barbeiro/produtos"
            element={
              <PrivateRoute requiredType="barbeiro">
                <ListarProdutos />
              </PrivateRoute>
            }
          />
          {/* Gerenciar Planos */}
          <Route
            path="/barbeiro/planos/gerenciar"
            element={
              <PrivateRoute requiredType="barbeiro_chefe">
                <GerenciarPlanos />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/barbeiro/reservas"
            element={
              <PrivateRoute requiredType="barbeiro">
                <ConsultarReservas />
              </PrivateRoute>
            }
          />



          {/* Rotas do Barbeiro Chefe */}
          <Route
            path="/barbeiro/produtos/novo"
            element={
              <PrivateRoute requiredType="barbeiro_chefe">
                <CadastrarProduto />
              </PrivateRoute>
            }
          />
          <Route
            path="/barbeiro/planos/novo"
            element={
              <PrivateRoute requiredType="barbeiro_chefe">
                <CadastrarPlano />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/barbeiro/cadastrar-barbeiro"
            element={
              <PrivateRoute requiredType="barbeiro_chefe">
                <CadastrarBarbeiro />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;