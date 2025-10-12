import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a las peticiones
api.interceptors.request.use(
  config => {
    const authTokens = localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens'))
      : null;
    if (authTokens?.access) {
      config.headers.Authorization = `Bearer ${authTokens.access}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Evitar bucles infinitos si el refresh token también falla
    if (
      error.response.status === 401 &&
      originalRequest.url.includes('token/refresh')
    ) {
      // Redirigir a login si el refresh falla
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authTokens = JSON.parse(localStorage.getItem('authTokens'));
      const refreshToken = authTokens?.refresh;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken,
          });

          const newAuthTokens = response.data;
          localStorage.setItem('authTokens', JSON.stringify(newAuthTokens));

          // Actualizar el header de la petición original y reintentarla
          originalRequest.headers['Authorization'] =
            `Bearer ${newAuthTokens.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token inválido o expirado.', refreshError);
          // Limpiar tokens y redirigir a login
          localStorage.removeItem('authTokens');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    // Si es un error 403 (Forbidden), no mostrar en consola como error crítico
    if (error.response?.status === 403) {
      console.warn(
        'Acceso denegado a recurso protegido (esto es normal según el rol del usuario)'
      );
      return Promise.reject(error);
    }

    // Para otros errores, mantener el comportamiento normal
    return Promise.reject(error);
  }
);

export default api;
