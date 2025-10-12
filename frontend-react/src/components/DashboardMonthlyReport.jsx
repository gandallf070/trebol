import React from 'react';
import SalesTrendChart from './SalesTrendChart';

const DashboardMonthlyReport = ({ styles }) => {
  return (
    <div style={styles.chartsRow}>
      <div style={styles.chartCard}>
        <div style={styles.chartContainer}>
          <SalesTrendChart />
        </div>
      </div>
    </div>
  );
};

export default DashboardMonthlyReport;
