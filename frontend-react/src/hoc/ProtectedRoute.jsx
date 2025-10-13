import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { authTokens, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#28a745',
          textAlign: 'center'
        }}>
          <div>Cargando...</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            Verificando autenticación
          </div>
        </div>
      </div>
    );
  }

  return authTokens ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
