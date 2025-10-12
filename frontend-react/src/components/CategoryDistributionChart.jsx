import React, { useEffect, useState } from 'react';
import api from '../services/api';

const CategoryDistributionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryDistribution();
  }, []);

  const fetchCategoryDistribution = async () => {
    try {
      const response = await api.get(
        'reports/dashboard/category-distribution/'
      );
      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching category distribution data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
        }}
      >
        Cargando distribución por categoría...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          color: '#6c757d',
        }}
      >
        No hay datos disponibles para mostrar
      </div>
    );
  }

  // Crear gráfico simple sin Chart.js para evitar errores de hooks
  const total = data.reduce((sum, item) => sum + (item.total || 0), 0);
  const colors = ['#28a745', '#007bff', '#ffc107', '#dc3545', '#6f42c1'];

  return (
    <div style={{ height: '300px', width: '100%', padding: '20px' }}>
      <h4
        style={{ textAlign: 'center', marginBottom: '20px', color: '#495057' }}
      >
        Distribución por Categoría (Total: {total})
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((item, index) => {
          const percentage =
            total > 0 ? (((item.total || 0) / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={index}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: colors[index % colors.length],
                  borderRadius: '4px',
                }}
              />
              <span style={{ flex: 1, color: '#495057' }}>
                {item.categoria || 'Sin categoría'}: {item.total || 0} productos
                ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
