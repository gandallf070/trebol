import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    const authTokens = localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens'))
      : null;
    if (authTokens?.access) {
      config.headers.Authorization = `Bearer ${authTokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Función helper para peticiones API según tus especificaciones
export const fetchAPI = async (endpoint, method = 'GET', body = null) => {
  try {
    const config = {
      method,
      url: endpoint,
    };

    if (body) {
      config.data = body;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error('Error en la petición API:', error);
    throw error;
  }
};

export default api;
