import React from 'react';
import TopProductsChart from './TopProductsChart';

const DashboardProductsSales = ({ dashboardData, styles }) => {
  return (
    <div style={styles.bottomRow}>
      <div style={styles.tableCard}>
        <div style={styles.barChartContainer}>
          <TopProductsChart />
        </div>
      </div>

      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>Últimas Ventas</h3>
        <div style={styles.tablePlaceholder}>
          <div style={styles.salesList}>
            {dashboardData.recentSales.slice(0, 5).map(sale => (
              <div key={sale.id} style={styles.saleItem}>
                <div style={styles.saleInfo}>
                  <strong>Venta #{sale.id}</strong> - {sale.cliente}
                </div>
                <div style={styles.saleTotal}>Bs {sale.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProductsSales;
