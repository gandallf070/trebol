import React, { useEffect, useState } from 'react';
import api from '../services/api';

const SalesTrendChart = () => {
  const [data, setData] = useState({ data: [], labels: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesTrend();
  }, []);

  const fetchSalesTrend = async () => {
    try {
      const response = await api.get('reports/dashboard/sales-trend/');
      setData(response.data || { data: [], labels: [] });
    } catch (error) {
      console.error('Error fetching sales trend data:', error);
      setData({ data: [], labels: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        Cargando tendencia de ventas...
      </div>
    );
  }

  const { data: salesData, labels } = data;

  if (salesData.length === 0) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        color: '#6c757d'
      }}>
        No hay datos de ventas disponibles
      </div>
    );
  }

  // Crear gráfico de líneas simple sin Chart.js
  const maxValue = Math.max(...salesData);
  const colors = ['#28a745', '#007bff', '#ffc107'];

  return (
    <div style={{ height: '300px', width: '100%', padding: '20px' }}>
      <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#495057' }}>
        Tendencia de Ventas - 30 Días
      </h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '2px' }}>
        {salesData.map((value, index) => {
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  height: height + '%',
                  width: '100%',
                  backgroundColor: colors[index % colors.length],
                  borderRadius: '2px 2px 0 0',
                  minHeight: '2px',
                  position: 'relative'
                }}
                title={`${labels[index] || ''}: Bs ${value.toFixed(2)}`}
              />
              <div style={{
                fontSize: '10px',
                color: '#6c757d',
                marginTop: '5px',
                textAlign: 'center',
                transform: 'rotate(-45deg)',
                whiteSpace: 'nowrap'
              }}>
                {labels[index] || ''}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: '10px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        Total de días: {salesData.length}
      </div>
    </div>
  );
};

export default SalesTrendChart;
