import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // 1. Verifica se está logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se requiredType NÃO for passado (ex: rota /perfil), permite acesso a qualquer logado
  if (!requiredType) {
    return children;
  }

  // 3. Verificações específicas de tipo
  if (requiredType === 'cliente' && user.tipo !== 'cliente') {
    return <Navigate to="/barbeiro/dashboard" replace />;
  }

  if (requiredType === 'barbeiro' && !['barbeiro', 'barbeiro_chefe'].includes(user.tipo)) {
    return <Navigate to="/cliente/dashboard" replace />;
  }

  if (requiredType === 'barbeiro_chefe' && user.tipo !== 'barbeiro_chefe') {
    return <Navigate to="/barbeiro/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;