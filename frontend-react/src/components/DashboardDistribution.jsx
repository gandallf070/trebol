import React from 'react';
import CategoryDistributionChart from './CategoryDistributionChart';

const DashboardDistribution = ({ styles }) => {
  return (
    <div style={styles.chartsRow}>
      <div style={styles.chartCard}>
        <div style={styles.chartContainer}>
          <CategoryDistributionChart />
        </div>
      </div>
    </div>
  );
};

export default DashboardDistribution;
