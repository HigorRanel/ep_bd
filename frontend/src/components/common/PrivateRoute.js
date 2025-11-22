import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!requiredType) {
    return children;
  }

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