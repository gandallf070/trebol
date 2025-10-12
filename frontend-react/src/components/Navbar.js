import React from 'react';
import { FaBars } from 'react-icons/fa'; // Asegúrate de instalar react-icons si no lo has hecho

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav style={styles.navbar}>
      <button onClick={toggleSidebar} style={styles.toggleButton}>
        <FaBars />
      </button>
      <h1 style={styles.title}>Joyería Trebol</h1>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1001,
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    marginRight: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
};

export default Navbar;
