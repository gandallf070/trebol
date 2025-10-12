import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const ReportsPage = () => {
  const [productosAgotados, setProductosAgotados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar productos agotados al montar el componente
    cargarProductosAgotados();
  }, []);

  const cargarProductosAgotados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productos-agotados/');
      setProductosAgotados(response.data);
    } catch (error) {
      console.error('Error al cargar productos agotados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarReportePDF = async () => {
    try {
      setLoading(true);
      const response = await api.get('/productos-agotados/generar-reporte-pdf/', {
        responseType: 'blob' // Para manejar archivos binarios
      });

      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_productos_agotados.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar reporte PDF:', error);
      alert('Error al generar el reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reportes</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>Productos Agotados y Tendencias</h2>
        <p>Este informe muestra los productos que se han agotado completamente, incluyendo fechas de inicio y agotamiento, cantidad inicial y tiempo de vida.</p>

        <button
          onClick={generarReportePDF}
          disabled={loading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Generando...' : 'Generar Reporte PDF'}
        </button>

        <div style={{ marginTop: '20px' }}>
          <h3>Productos Agotados ({productosAgotados.length})</h3>
          {productosAgotados.length === 0 ? (
            <p>No hay productos agotados registrados.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '15px',
              marginTop: '10px'
            }}>
              {productosAgotados.map((productoAgotado) => (
                <div key={productoAgotado.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <h4>{productoAgotado.producto.nombre}</h4>
                  <p><strong>Categoría:</strong> {productoAgotado.categoria}</p>
                  <p><strong>Fecha Inicio:</strong> {productoAgotado.fecha_inicio}</p>
                  <p><strong>Fecha Agotado:</strong> {productoAgotado.fecha_agotado}</p>
                  <p><strong>Cantidad Inicial:</strong> {productoAgotado.cantidad_inicial}</p>
                  <p><strong>Cantidad Vendida:</strong> {productoAgotado.cantidad_vendida}</p>
                  <p><strong>Tiempo de Vida:</strong> {productoAgotado.tiempo_vida} días</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Otros Reportes</h2>
        <p>Aquí puedes agregar más tipos de reportes según necesites.</p>
      </div>
    </div>
  );
};

export default ReportsPage;
