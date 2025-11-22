import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isCliente, isBarbeiro, isBarbeiroChefe } = useAuth();
  const navigate = useNavigate();
  const [gestaoOpen, setGestaoOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setGestaoOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              {/* Link para o Perfil */}
              <Link to="/perfil" className="navbar-user navbar-link">
                Meu Perfil
              </Link>
              
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
                  <Link to="/barbeiro/clientes" className="navbar-link">Clientes</Link>
                  <Link to="/barbeiro/servicos/novo" className="navbar-link">Serviços</Link>
                  <Link to="/barbeiro/avaliacoes" className="navbar-link">Avaliações</Link>
                  <Link to="/barbeiro/produtos" className="navbar-link">Produtos</Link>
                  <Link to="/barbeiro/reservas" className="navbar-link">Reservas</Link>
                  
                  {isBarbeiroChefe() && (
                    <div className="navbar-dropdown" ref={dropdownRef}>
                      <button 
                        className="navbar-link dropdown-trigger"
                        onClick={() => setGestaoOpen(!gestaoOpen)}
                      >
                        Gestão ⭐ {gestaoOpen ? '▲' : '▼'}
                      </button>
                      
                      {gestaoOpen && (
                        <div className="dropdown-menu">
                          <Link 
                            to="/barbeiro/produtos/novo" 
                            className="dropdown-item"
                            onClick={() => setGestaoOpen(false)}
                          >
                            📦 Cadastrar Produto
                          </Link>
                          
                          <Link 
                            to="/barbeiro/planos/gerenciar" 
                            className="dropdown-item"
                            onClick={() => setGestaoOpen(false)}
                          >
                            💼 Gerenciar Planos
                          </Link>
                          
                          <Link 
                            to="/barbeiro/planos/novo" 
                            className="dropdown-item"
                            onClick={() => setGestaoOpen(false)}
                          >
                            ➕ Criar Plano
                          </Link>
                          
                          <Link 
                            to="/barbeiro/cadastrar-barbeiro" 
                            className="dropdown-item"
                            onClick={() => setGestaoOpen(false)}
                          >
                            👤 Cadastrar Barbeiro
                          </Link>
                        </div>
                      )}
                    </div>
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