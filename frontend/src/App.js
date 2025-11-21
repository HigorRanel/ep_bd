import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './styles/global.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import CadastroCliente from './pages/CadastroCliente';
import NotFound from './pages/NotFound';
import Perfil from './pages/Perfil';

// NOVOS IMPORTS (Crie esses arquivos na pasta pages)
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';

// Cliente Components
import DashboardCliente from './components/cliente/DashBoardCliente';
import AgendarServico from './components/cliente/AgendarServico';
import MeusAgendamentos from './components/cliente/MeusAgendamentos';
import MinhasReservas from './components/cliente/MinhasReservas';
import MeusPlanos from './components/cliente/MeusPlanos';

// Barbeiro Components
import DashboardBarbeiro from './components/barbeiro/DashBoardBarbeiro';
import AgendaBarbeiro from './components/barbeiro/AgendaBarbeiro';
import CadastrarServico from './components/barbeiro/CadastrarServico';
import CadastrarProduto from './components/barbeiro/CadastrarProduto';
import CadastrarPlano from './components/barbeiro/CadastrarPlano';
import CadastrarBarbeiro from './components/barbeiro/CadastrarBarbeiro';
import MinhasAvaliacoes from './components/barbeiro/MinhasAvaliacoes';
import ConsultarReservas from './components/barbeiro/ConsultarReservas';
import ListarProdutos from './components/barbeiro/ListarProdutos';

// Common
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroCliente />} />
          
          {/* Novas Rotas de Recuperação de Senha */}
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />

          {/* --- ROTA DE PERFIL (Para usuários logados) --- */}
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Perfil />
              </PrivateRoute>
            }
          />

          {/* --- ROTAS CLIENTE --- */}
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

          {/* --- ROTAS BARBEIRO --- */}
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
          <Route
            path="/barbeiro/reservas"
            element={
              <PrivateRoute requiredType="barbeiro">
                <ConsultarReservas />
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

          {/* --- ROTAS BARBEIRO CHEFE --- */}
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
          
          {/* 404 - Página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;