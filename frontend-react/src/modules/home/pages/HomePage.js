import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import DashboardKPIs from '../../../components/DashboardKPIs';
import DashboardMonthlyReport from '../../../components/DashboardMonthlyReport';
import DashboardDistribution from '../../../components/DashboardDistribution';
import DashboardProductsSales from '../../../components/DashboardProductsSales';

const HomePage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalInventory: { total: 0, trend: 0 },
    dailySales: { amount: 0, count: 0, trend: 0 },
    lowStock: { products: [], count: 0 },
    salesTrend: { data: [], labels: [] },
    categoryDistribution: [],
    topProducts: { products: [], quantities: [] },
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general_report'); // Cambiado a 'general_report'

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Si es administrador/gerente, cargar todos los datos
      if (user && (user.is_admin || user.is_gerente)) {
        const [
          totalInventoryRes,
          dailySalesRes,
          lowStockRes,
          salesTrendRes,
          categoryDistributionRes,
          topProductsRes,
          recentSalesRes,
        ] = await Promise.all([
          api.get('reports/dashboard/total-inventory/'),
          api.get('reports/dashboard/daily-sales/'),
          api.get('reports/dashboard/low-stock/'),
          api.get('reports/dashboard/sales-trend/'),
          api.get('reports/dashboard/category-distribution/'),
          api.get('reports/dashboard/top-products/'),
          api.get('reports/dashboard/recent-sales/'),
        ]);

        setDashboardData({
          totalInventory: totalInventoryRes.data,
          dailySales: dailySalesRes.data,
          lowStock: lowStockRes.data,
          salesTrend: salesTrendRes.data,
          categoryDistribution: categoryDistributionRes.data,
          topProducts: topProductsRes.data,
          recentSales: recentSalesRes.data,
        });
      } else {
        // Si es vendedor, solo cargar datos accesibles
        try {
          const recentSalesRes = await api.get(
            'reports/dashboard/recent-sales/'
          );
          setDashboardData({
            totalInventory: { total: 0, trend: 0 },
            dailySales: { amount: 0, count: 0, trend: 0 },
            lowStock: { products: [], count: 0 },
            salesTrend: { data: [], labels: [] },
            categoryDistribution: [],
            topProducts: { products: [], quantities: [] },
            recentSales: recentSalesRes.data,
          });
        } catch (error) {
          console.log('Error al cargar ventas recientes para vendedor:', error);
          // En caso de error, mostrar datos vacíos pero no bloquear la UI
          setDashboardData({
            totalInventory: { total: 0, trend: 0 },
            dailySales: { amount: 0, count: 0, trend: 0 },
            lowStock: { products: [], count: 0 },
            salesTrend: { data: [], labels: [] },
            categoryDistribution: [],
            topProducts: { products: [], quantities: [] },
            recentSales: [],
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // En caso de error, establecer datos por defecto
      setDashboardData({
        totalInventory: { total: 0, trend: 0 },
        dailySales: { amount: 0, count: 0, trend: 0 },
        lowStock: { products: [], count: 0 },
        salesTrend: { data: [], labels: [] },
        categoryDistribution: [],
        topProducts: { products: [], quantities: [] },
        recentSales: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general_report':
        if (user && (user.is_admin || user.is_gerente)) {
          return (
            <DashboardKPIs
              totalInventory={dashboardData.totalInventory}
              dailySales={dashboardData.dailySales}
              lowStock={dashboardData.lowStock}
              styles={styles}
            />
          );
        } else {
          // Dashboard específico para vendedores
          return (
            <div style={styles.kpiRow}>
              <div style={styles.kpiCard}>
                <h3 style={styles.kpiTitle}>Ventas del Día</h3>
                <div style={styles.kpiValue}>Bs 0.00</div>
                <div style={styles.kpiTrend}>Sin datos</div>
              </div>
              <div style={styles.kpiCard}>
                <h3 style={styles.kpiTitle}>Mis Ventas Recientes</h3>
                <div style={styles.kpiValue}>
                  {dashboardData.recentSales.length}
                </div>
                <div style={styles.kpiTrend}>Últimas ventas</div>
              </div>
              <div style={styles.kpiCard}>
                <h3 style={styles.kpiTitle}>Clientes Atendidos</h3>
                <div style={styles.kpiValue}>0</div>
                <div style={styles.kpiTrend}>Este mes</div>
              </div>
            </div>
          );
        }
      case 'monthly_report':
        return <DashboardMonthlyReport styles={styles} />;
      case 'distribution':
        return <DashboardDistribution styles={styles} />;
      case 'products_sales':
        return (
          <DashboardProductsSales
            dashboardData={dashboardData}
            styles={styles}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 60px)',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            color: '#28a745',
            textAlign: 'center',
          }}
        >
          <div>Cargando dashboard...</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>
            Obteniendo datos del usuario
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        minHeight: 'calc(100vh - 60px)',
        margin: 0,
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#28a745',
          marginBottom: '30px',
          fontSize: '32px',
          fontWeight: 'bold',
        }}
      >
        Panel de Administración - Joyería Trébol
      </h1>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          style={
            activeSection === 'general_report'
              ? {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  border: '1px solid #28a745',
                  borderRadius: '5px',
                  color: '#fff',
                  transition: 'background-color 0.3s ease',
                }
              : {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  color: '#495057',
                  transition: 'background-color 0.3s ease',
                }
          }
          onClick={() => setActiveSection('general_report')}
        >
          Informe General
        </button>
        <button
          style={
            activeSection === 'monthly_report'
              ? {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  border: '1px solid #28a745',
                  borderRadius: '5px',
                  color: '#fff',
                  transition: 'background-color 0.3s ease',
                }
              : {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  color: '#495057',
                  transition: 'background-color 0.3s ease',
                }
          }
          onClick={() => setActiveSection('monthly_report')}
        >
          Reporte Mensual
        </button>
        <button
          style={
            activeSection === 'distribution'
              ? {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  border: '1px solid #28a745',
                  borderRadius: '5px',
                  color: '#fff',
                  transition: 'background-color 0.3s ease',
                }
              : {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  color: '#495057',
                  transition: 'background-color 0.3s ease',
                }
          }
          onClick={() => setActiveSection('distribution')}
        >
          Distribución
        </button>
        <button
          style={
            activeSection === 'products_sales'
              ? {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  border: '1px solid #28a745',
                  borderRadius: '5px',
                  color: '#fff',
                  transition: 'background-color 0.3s ease',
                }
              : {
                  padding: '10px 20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  color: '#495057',
                  transition: 'background-color 0.3s ease',
                }
          }
          onClick={() => setActiveSection('products_sales')}
        >
          Productos y Ventas
        </button>
      </div>

      {renderSection()}
    </div>
  );
};

const styles = {
  dashboard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    marginTop: '0',
    marginLeft: '0',
  },
  title: {
    textAlign: 'center',
    color: '#28a745',
    marginBottom: '30px',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  loadingSpinner: {
    fontSize: '18px',
    color: '#28a745',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#e9ecef',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    color: '#495057',
    transition: 'background-color 0.3s ease',
  },
  activeButton: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    border: '1px solid #28a745',
    borderRadius: '5px',
    color: '#fff',
    transition: 'background-color 0.3s ease',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #e9ecef',
  },
  kpiTitle: {
    color: '#6c757d',
    fontSize: '14px',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  kpiValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '5px',
  },
  kpiTrend: {
    fontSize: '14px',
    color: '#28a745',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
  },
  chartContainer: {
    height: '300px',
    width: '100%',
  },
  barChartContainer: {
    height: '250px',
    width: '100%',
  },
  chartPlaceholder: {
    height: '200px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #dee2e6',
  },
  chartContent: {
    color: '#6c757d',
    fontSize: '16px',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  tableCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
  },
  tableTitle: {
    color: '#495057',
    marginBottom: '15px',
    fontSize: '18px',
  },
  tablePlaceholder: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  salesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  saleItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e9ecef',
  },
  saleInfo: {
    color: '#495057',
  },
  saleTotal: {
    fontWeight: 'bold',
    color: '#28a745',
  },
};

export default HomePage;
