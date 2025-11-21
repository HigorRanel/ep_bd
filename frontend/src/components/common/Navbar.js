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
              {/* Link para o Perfil usando o nome do usuário */}
              <Link to="/perfil" className="navbar-link" style={{ fontWeight: 'bold' }}>
                👤 {user.nome.split(' ')[0]} {/* Mostra apenas o primeiro nome para economizar espaço */}
              </Link>
              
              {isCliente() && (
                <>
                  <Link to="/cliente/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/cliente/agendar" className="navbar-link">Agendar</Link>
                  <Link to="/cliente/agendamentos" className="navbar-link">Agendamentos</Link>
                  {/* Removido alguns links menos usados se quiser limpar a barra, ou mantenha todos */}
                  <Link to="/cliente/reservas" className="navbar-link">Reservas</Link>
                  <Link to="/cliente/planos" className="navbar-link">Planos</Link>
                </>
              )}
              
              {isBarbeiro() && (
                <>
                  <Link to="/barbeiro/dashboard" className="navbar-link">Dashboard</Link>
                  <Link to="/barbeiro/agenda" className="navbar-link">Agenda</Link>
                  {/* Links agrupados ou mantidos conforme sua preferência */}
                  <Link to="/barbeiro/servicos/novo" className="navbar-link">Serviços</Link>
                  <Link to="/barbeiro/reservas" className="navbar-link">Reservas</Link>
                  
                  {isBarbeiroChefe() && (
                    <>
                       {/* Se ficar muito cheio, considere um Dropdown ou página de Admin */}
                       <Link to="/barbeiro/produtos" className="navbar-link">Estoque</Link>
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