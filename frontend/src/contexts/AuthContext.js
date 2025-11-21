import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao fazer login' 
      };
    }
  };

  const cadastrarCliente = async (dados) => {
    try {
      const response = await api.post('/auth/cadastrar-e-logar/cliente', dados);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao cadastrar' 
      };
    }
  };

  const cadastrarBarbeiro = async (dados) => {
    try {
      const response = await api.post('/auth/cadastrar-e-logar/barbeiro', dados);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao cadastrar barbeiro' 
      };
    }
  };

  // Nova função adicionada
  const alterarSenha = async (senhaAtual, novaSenha) => {
    try {
      await api.post('/auth/alterar-senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      });
      return { success: true, message: 'Senha alterada com sucesso!' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao alterar senha' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isCliente = () => user?.tipo === 'cliente';
  const isBarbeiro = () => user?.tipo === 'barbeiro' || user?.tipo === 'barbeiro_chefe';
  const isBarbeiroChefe = () => user?.tipo === 'barbeiro_chefe';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        cadastrarCliente,
        cadastrarBarbeiro,
        alterarSenha, // Adicionado ao value
        isCliente,
        isBarbeiro,
        isBarbeiroChefe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};