import React, { useEffect, useState } from 'react';
import api from '../services/api';

const TopProductsChart = () => {
  const [data, setData] = useState({ products: [], quantities: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      const response = await api.get('reports/dashboard/top-products/');
      setData(response.data || { products: [], quantities: [] });
    } catch (error) {
      console.error('Error fetching top products data:', error);
      setData({ products: [], quantities: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        Cargando productos más vendidos...
      </div>
    );
  }

  const { products, quantities } = data;
  const totalVentas = quantities.reduce((sum, qty) => sum + qty, 0);

  if (totalVentas === 0) {
    return (
      <div style={{
        height: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        color: '#6c757d'
      }}>
        No se encontraron ventas para mostrar
      </div>
    );
  }

  // Crear gráfico de barras simple sin Chart.js
  const maxQuantity = Math.max(...quantities);
  const colors = ['#28a745', '#20c997', '#17a2b8', '#007bff', '#6f42c1'];

  return (
    <div style={{ height: '250px', width: '100%', padding: '20px' }}>
      <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#495057' }}>
        Top Productos Más Vendidos (Total: {totalVentas})
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '180px', overflowY: 'auto' }}>
        {products.map((product, index) => {
          const quantity = quantities[index] || 0;
          const percentage = totalVentas > 0 ? ((quantity / totalVentas) * 100).toFixed(1) : 0;
          const barWidth = maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0;

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '120px', textAlign: 'left', fontSize: '12px', color: '#495057' }}>
                {product.length > 15 ? product.substring(0, 15) + '...' : product}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    height: '20px',
                    width: barWidth + '%',
                    backgroundColor: colors[index % colors.length],
                    borderRadius: '4px',
                    minWidth: '20px'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#495057', minWidth: '60px' }}>
                  {quantity} ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopProductsChart;
