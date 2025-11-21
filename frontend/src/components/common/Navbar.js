import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isCliente, isBarbeiro, isBarbeiroChefe } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">✂️</span> Barbearia
        </Link>

        {/* Ícone Menu Mobile (Hambúrguer / X) */}
        <div className="mobile-menu-icon" onClick={toggleMenu}>
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </div>

        {/* Menu Links */}
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {!user ? (
            <>
              <NavLink to="/login" className="navbar-link" onClick={closeMenu}>Login</NavLink>
              <NavLink to="/cadastro" className="navbar-link btn-highlight" onClick={closeMenu}>Cadastrar</NavLink>
            </>
          ) : (
            <>
              {/* Perfil do Usuário */}
              <div className="user-info">
                <span className="user-greeting">Olá, <strong>{user.nome.split(' ')[0]}</strong></span>
                <NavLink to="/perfil" className="navbar-link" onClick={closeMenu}>Meu Perfil</NavLink>
              </div>

              {isCliente() && (
                <>
                  <NavLink to="/cliente/dashboard" className="navbar-link" onClick={closeMenu}>Dashboard</NavLink>
                  <NavLink to="/cliente/agendar" className="navbar-link" onClick={closeMenu}>Agendar</NavLink>
                  <NavLink to="/cliente/agendamentos" className="navbar-link" onClick={closeMenu}>Meus Horários</NavLink>
                </>
              )}

              {isBarbeiro() && (
                <>
                  <NavLink to="/barbeiro/dashboard" className="navbar-link" onClick={closeMenu}>Painel</NavLink>
                  <NavLink to="/barbeiro/agenda" className="navbar-link" onClick={closeMenu}>Minha Agenda</NavLink>
                  
                  {isBarbeiroChefe() && (
                    <NavLink to="/barbeiro/produtos" className="navbar-link" onClick={closeMenu}>Estoque</NavLink>
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