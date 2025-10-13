import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import menuConfig from '../config/menu';
import '../styles/responsiveNav.css';

const ResponsiveNav = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(() => window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // On wider screens keep sidebar open by default
      if (window.innerWidth > 768) setIsOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => setIsOpen(prev => !prev);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (!user) return [];
    return menuConfig.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();

  // Debug logging
  console.log('ResponsiveNav Debug:', {
    user: user,
    userRole: user?.role,
    menuItemsCount: menuItems.length,
    menuItems: menuItems
  });

  return (
    <div className="rn-wrapper">
      <header className="rn-navbar">
        <button className="rn-burger" onClick={toggle} aria-label="Toggle menu">
          <FaBars />
        </button>
        <div className="rn-title">Joyería Trebol</div>
      </header>

      <aside className={`rn-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : 'desktop'}`}>
        <nav>
          <ul>
            {menuItems.map(item => (
              <li key={item.name}>
                <Link to={item.path} onClick={() => isMobile && setIsOpen(false)}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rn-footer">
          {user ? (
            <>
              <div className="rn-user">Usuario: <strong>{user.username}</strong></div>
              <div className="rn-role">Rol: ({user.role})</div>
              <button className="rn-logout" onClick={handleLogout}>Cerrar Sesión</button>
            </>
          ) : (
            <Link className="rn-login" to="/login">Iniciar Sesión</Link>
          )}
        </div>
      </aside>

      <main className={`rn-main ${isOpen && !isMobile ? 'with-sidebar' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default ResponsiveNav;
