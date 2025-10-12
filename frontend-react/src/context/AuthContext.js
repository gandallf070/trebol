import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de instalar 'jwt-decode'
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens'))
      : null
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Inicialmente true para indicar que estamos verificando el token

  const navigate = useNavigate();

  // Función para obtener detalles reales del usuario desde el backend
  const getUserDetails = async token => {
    try {
      const response = await api.get('auth/profile/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        const userData = response.data;
        return {
          username: userData.username,
          role: userData.role,
          is_admin: userData.role === 'admin',
          is_vendedor: userData.role === 'vendedor',
          is_gerente: userData.role === 'gerente',
        };
      }
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      // Si hay error obteniendo datos del usuario, devolver datos básicos del token
      try {
        const decodedToken = jwtDecode(token);
        return {
          username: decodedToken.username || 'Usuario',
          role: 'vendedor', // Rol por defecto
          is_admin: false,
          is_vendedor: true,
          is_gerente: false,
        };
      } catch (decodeError) {
        console.error('Error decodificando token:', decodeError);
        return null;
      }
    }
    return null;
  };

  const loginUser = async (username, password) => {
    try {
      const response = await api.post('token/', {
        username,
        password,
      });

      if (response.status === 200) {
        const data = response.data;
        setAuthTokens(data);

        // Obtener detalles reales del usuario desde el backend
        const userDetails = await getUserDetails(data.access);
        if (userDetails) {
          setUser(userDetails);
        }

        localStorage.setItem('authTokens', JSON.stringify(data));
        navigate('/');
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('¡Usuario o contraseña incorrectos!');
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    navigate('/login');
  };

  const updateToken = async () => {
    try {
      const response = await api.post('token/refresh/', {
        refresh: authTokens?.refresh,
      });

      if (response.status === 200) {
        const data = response.data;
        setAuthTokens(data);

        // Obtener detalles reales del usuario desde el backend
        const userDetails = await getUserDetails(data.access);
        if (userDetails) {
          setUser(userDetails);
        }

        localStorage.setItem('authTokens', JSON.stringify(data));
      } else {
        logoutUser(); // Si el refresh falla, cerrar sesión
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logoutUser(); // Cerrar sesión si hay un error en el refresh
    } finally {
      setLoading(false); // Siempre establecer loading a false después de intentar actualizar
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (authTokens) {
        // Obtener detalles reales del usuario desde el backend
        const userDetails = await getUserDetails(authTokens.access);
        if (userDetails) {
          setUser(userDetails);
        }
        await updateToken(); // Intentar actualizar el token si existe
      } else {
        setLoading(false); // Si no hay tokens, no hay necesidad de cargar, establecer loading a false
      }
    };

    checkAuth(); // Ejecutar la verificación al montar el componente

    const fourMinutes = 1000 * 60 * 4;
    const interval = setInterval(() => {
      if (authTokens) {
        updateToken();
      }
    }, fourMinutes);
    return () => clearInterval(interval);
  }, []); // Ejecutar solo una vez al montar, y el intervalo se maneja internamente

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    loading, // Exponer el estado de carga
  };

  return (
    <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
