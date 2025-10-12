import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import menuConfig from '../config/menu';

const Sidebar = ({ isSidebarOpen, sidebarWidth }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (!user) return [];
    return menuConfig.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();

  return (
    <div
      style={{
        ...styles.sidebar,
        width: sidebarWidth,
        transform: isSidebarOpen
          ? 'translateX(0)'
          : `translateX(-${sidebarWidth})`,
      }}
    >
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {menuItems.map(item => (
            <li key={item.name} style={styles.navItem}>
              <Link to={item.path} style={styles.navLink}>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div style={styles.footer}>
        {user ? (
          <div style={styles.userInfo}>
            <span style={styles.username}>Usuario: {user.username}</span>{' '}
            {/* Añadir username para depuración */}
            {user.role && (
              <span style={styles.userRole}>Rol: ({user.role})</span>
            )}{' '}
            {/* Mostrar rol para depuración */}
            <button onClick={handleLogout} style={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link to="/login" style={styles.loginLink}>
            Iniciar Sesión
          </Link>
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    backgroundColor: '#343a40',
    color: '#fff',
    height: 'calc(100vh - 60px)', // Ajustar la altura para el Navbar
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: '60px', // Posicionar debajo del Navbar
    zIndex: 1000,
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease-in-out',
    overflowY: 'auto', // Permitir desplazamiento si el contenido es largo
  },
  nav: {
    flex: 1,
    padding: '10px 0', // Reducir el padding vertical
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  navItem: {
    marginBottom: '8px', // Ajustar el margen inferior para separar los botones
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '16px',
    display: 'block',
    padding: '10px 15px', // Ajustar padding
    margin: '0 15px', // Ajustar margen
    borderRadius: '4px',
    backgroundColor: '#28a745' /* Verde oscuro para los botones de ruta */,
    textAlign: 'center',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  navLinkHover: {
    backgroundColor: '#218838' /* Verde más oscuro al pasar el ratón */,
    transform: 'translateY(-2px)',
  },
  footer: {
    padding: '15px 0', // Ajustar padding para el footer
    borderTop: '1px solid #495057',
    backgroundColor: '#2c3034',
    textAlign: 'center', // Centrar el contenido del footer
    flexShrink: 0, // Evitar que el footer se encoja
  },
  userInfo: {
    marginBottom: '8px', // Añadir margen inferior para separar del botón de logout
  },
  username: {
    // Nuevo estilo para el username
    display: 'block',
    fontSize: '14px',
    color: '#fff', // Color blanco para mayor visibilidad
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  userRole: {
    display: 'block',
    fontSize: '12px',
    color: '#adb5bd',
    marginBottom: '8px', // Reducir margen inferior
  },
  logoutButton: {
    backgroundColor: '#dc3545' /* Rojo para el botón de cerrar sesión */,
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    width: 'calc(100% - 30px)' /* Ajustar ancho con más margen */,
    margin: '0 15px', // Centrar el botón y darle más margen
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  loginLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '16px',
    textAlign: 'center',
    display: 'block',
    padding: '10px 16px',
    width: 'calc(100% - 30px)' /* Ajustar ancho con más margen */,
    margin: '0 15px', // Centrar el botón y darle más margen
    borderRadius: '4px',
    backgroundColor:
      '#28a745' /* Verde oscuro para el botón de iniciar sesión */,
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
};

export default Sidebar;
