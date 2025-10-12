import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardPage = () => {
  return (
    <div style={styles.dashboardContainer}>
      <main style={styles.mainContent}>
        <Outlet /> {/* Aquí se renderizarán las páginas de los módulos */}
      </main>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f4f7f6',
  },
  mainContent: {
    flexGrow: 1,
    padding: '20px',
    overflowY: 'auto', // Permitir desplazamiento vertical si el contenido es largo
  },
};

export default DashboardPage;
