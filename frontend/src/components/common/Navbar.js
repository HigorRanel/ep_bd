import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isCliente, isBarbeiro, isBarbeiroChefe } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          ✂️ Barbearia
        </Link>

        <div className="navbar-menu">
          {!user ? (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/cadastro" className="navbar-link btn-primary">Cadastrar</Link>
            </>
          ) : (
            <>
              <span className="navbar-user">Olá, {user.nome}</span>
              
              {isCliente() && (
                <>
                  <Link to="/cliente/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/cliente/agendar" className="navbar-link">Agendar</Link>
                  <Link to="/cliente/agendamentos" className="navbar-link">Agendamentos</Link>
                  <Link to="/cliente/reservas" className="navbar-link">Reservas</Link>
                  <Link to="/cliente/planos" className="navbar-link">Planos</Link>
                </>
              )}
              
              {isBarbeiro() && (
                <>
                  <Link to="/barbeiro/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/barbeiro/agenda" className="navbar-link">Agenda</Link>
                  <Link to="/barbeiro/servicos/novo" className="navbar-link">Novo Serviço</Link>
                  <Link to="/barbeiro/avaliacoes" className="navbar-link">Avaliações</Link>
                  {/* NOVO LINK - Consultar Reservas */}
                  <Link to="/barbeiro/reservas" className="navbar-link">Reservas</Link>
                  
                  {isBarbeiroChefe() && (
                    <>
                      <Link to="/barbeiro/produtos/novo" className="navbar-link">Novo Produto</Link>
                      <Link to="/barbeiro/planos/novo" className="navbar-link">Novo Plano</Link>
                      <Link to="/barbeiro/cadastrar-barbeiro" className="navbar-link">Cadastrar Barbeiro</Link>
                    </>
                  )}
                </>
              )}
              
              <button onClick={handleLogout} className="navbar-link btn-logout">
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;