import React from 'react';

const DashboardKPIs = ({ totalInventory, dailySales, lowStock, styles }) => {
  return (
    <div style={styles.kpiRow}>
      <div style={styles.kpiCard}>
        <h3 style={styles.kpiTitle}>Inventario Total</h3>
        <div style={styles.kpiValue}>
          {totalInventory && totalInventory.total !== undefined
            ? totalInventory.total
            : 'N/A'}
        </div>
        <div style={styles.kpiTrend}>
          {totalInventory && totalInventory.trend !== undefined
            ? `${totalInventory.trend >= 0 ? '↗' : '↘'} ${Math.abs(totalInventory.trend)}%`
            : 'Sin datos'}
        </div>
      </div>

      <div style={styles.kpiCard}>
        <h3 style={styles.kpiTitle}>Ventas del Día</h3>
        <div style={styles.kpiValue}>
          Bs{' '}
          {dailySales && dailySales.amount !== undefined
            ? dailySales.amount.toFixed(2)
            : '0.00'}
        </div>
        <div style={styles.kpiTrend}>
          {dailySales && dailySales.trend !== undefined
            ? `${dailySales.trend >= 0 ? '↗' : '↘'} ${Math.abs(dailySales.trend)}%`
            : 'Sin datos'}
        </div>
      </div>

      <div style={styles.kpiCard}>
        <h3 style={styles.kpiTitle}>Stock Crítico</h3>
        <div style={styles.kpiValue}>
          {lowStock && lowStock.count !== undefined ? lowStock.count : '0'}
        </div>
        <div style={styles.kpiTrend}>Productos bajos</div>
      </div>
    </div>
  );
};

export default DashboardKPIs;
