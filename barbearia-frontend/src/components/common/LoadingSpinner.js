import React from 'react';
import '../../styles/components.css';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;