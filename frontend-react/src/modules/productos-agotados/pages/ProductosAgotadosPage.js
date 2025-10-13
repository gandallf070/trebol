import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ProductosAgotadosPage = () => {
  const [productosAgotados, setProductosAgotados] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar productos agotados al montar el componente
    cargarProductosAgotados();
  }, []);

  const cargarProductosAgotados = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/productos-agotados/');
      const data = response.data;

      // Verificar que data tenga la estructura correcta (paginada)
      if (data && data.results && Array.isArray(data.results)) {
        setProductosAgotados(data.results);
      } else if (Array.isArray(data)) {
        setProductosAgotados(data);
      } else {
        // La respuesta de la API no tiene la estructura esperada
        setProductosAgotados([]);
      }
    } catch (error) {
      // Error al cargar productos agotados
      setProductosAgotados([]);
      setError(error.message || 'Error desconocido al cargar productos agotados');
    } finally {
      setLoading(false);
    }
  };

  const generarReportePDF = async () => {
    try {
      setLoading(true);
      // Usar la URL correcta según la configuración de Django
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
      // Error al generar reporte PDF
      if (error.response && error.response.status === 404) {
        alert('El endpoint para generar el reporte PDF no está disponible. Verifica la configuración del servidor.');
      } else {
        alert('Error al generar el reporte PDF: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular métricas de tendencias
  const calcularTendencias = () => {
    if (productosAgotados.length === 0) return null;

    const totalProductos = productosAgotados.length;
    const tiemposVida = productosAgotados.map(p => p.tiempo_vida || 0).filter(t => t > 0);
    const promedioTiempoVida = tiemposVida.length > 0
      ? tiemposVida.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposVida.length
      : 0;

    const cantidadesVendidas = productosAgotados.map(p => p.cantidad_vendida || 0);
    const promedioCantidadVendida = cantidadesVendidas.length > 0
      ? cantidadesVendidas.reduce((sum, cantidad) => sum + cantidad, 0) / cantidadesVendidas.length
      : 0;

    // Categorías más frecuentes
    const categorias = {};
    productosAgotados.forEach(p => {
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
    });
    const categoriaMasFrecuente = Object.keys(categorias).length > 0
      ? Object.keys(categorias).reduce((a, b) => categorias[a] > categorias[b] ? a : b)
      : 'N/A';

    return {
      totalProductos,
      promedioTiempoVida: Math.round(promedioTiempoVida * 10) / 10,
      promedioCantidadVendida: Math.round(promedioCantidadVendida * 10) / 10,
      categoriaMasFrecuente,
      productosRecientes: productosAgotados.filter(p => {
        const fechaAgotado = new Date(p.fecha_agotado);
        const unaSemanaAtras = new Date();
        unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
        return fechaAgotado >= unaSemanaAtras;
      }).length
    };
  };

  const tendencias = calcularTendencias();

  // Función para formatear fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener clasificación de rendimiento
  const obtenerClasificacionRendimiento = (tiempoVida, cantidadVendida) => {
    if (tiempoVida <= 7) return { texto: 'Muy Rápido', color: '#28a745', bgColor: '#d4edda' };
    if (tiempoVida <= 15) return { texto: 'Rápido', color: '#17a2b8', bgColor: '#d1ecf1' };
    if (tiempoVida <= 30) return { texto: 'Normal', color: '#ffc107', bgColor: '#fff3cd' };
    return { texto: 'Lento', color: '#dc3545', bgColor: '#f8d7da' };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
        📊 Productos Agotados y Tendencias
      </h1>

      {/* Resumen Ejecutivo */}
      {tendencias && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>📈 Resumen Ejecutivo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{tendencias.totalProductos}</div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>Total Productos Agotados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{tendencias.promedioTiempoVida}</div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>Días Promedio de Vida</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{tendencias.promedioCantidadVendida}</div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>Unidades Promedio Vendidas</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{tendencias.productosRecientes}</div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>Agotados esta Semana</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0', color: '#333' }}>🗂️ Productos Agotados y Tendencias</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Este informe muestra los productos que se han agotado completamente, incluyendo métricas de rendimiento y tendencias de venta.
            </p>
          </div>
          <button
            onClick={generarReportePDF}
            disabled={loading}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '12px 25px',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(220,53,69,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#c82333')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#dc3545')}
          >
            {loading ? '⏳ Generando...' : '📄 Generar PDF'}
          </button>
        </div>

        {error ? (
          <div style={{
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '20px'
          }}>
            <p style={{ margin: '0' }}>❌ Error al cargar productos agotados: {error}</p>
            <button
              onClick={cargarProductosAgotados}
              style={{
                marginTop: '10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              🔄 Reintentar
            </button>
          </div>
        ) : productosAgotados.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <p style={{ fontSize: '18px', color: '#6c757d', margin: '0' }}>
              📦 No hay productos agotados registrados
            </p>
            <p style={{ fontSize: '14px', color: '#adb5bd', margin: '10px 0 0 0' }}>
              Los productos que se agoten aparecerán automáticamente en esta tabla
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Tabla de productos agotados */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                      📦 Producto
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                      🏷️ Categoría
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      📊 Cantidad Inicial
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      🛒 Cantidad Vendida
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      ⏱️ Tiempo de Vida
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      📈 Rendimiento
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      📅 Fecha Agotado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productosAgotados.map((productoAgotado, index) => {
                    const rendimiento = obtenerClasificacionRendimiento(
                      productoAgotado.tiempo_vida || 0,
                      productoAgotado.cantidad_vendida || 0
                    );

                    return (
                      <tr
                        key={productoAgotado.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#e3f2fd'}
                        onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                      >
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#495057' }}>
                          {productoAgotado.producto.nombre}
                        </td>
                        <td style={{ padding: '15px', color: '#6c757d' }}>
                          {productoAgotado.categoria}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                          {productoAgotado.cantidad_inicial}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                          {productoAgotado.cantidad_vendida}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {productoAgotado.tiempo_vida ? `${productoAgotado.tiempo_vida} días` : 'N/A'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: rendimiento.bgColor,
                            color: rendimiento.color,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {rendimiento.texto}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                          {formatearFecha(productoAgotado.fecha_agotado)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      {productosAgotados.length > 0 && tendencias && (
        <div style={{
          backgroundColor: '#e9ecef',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Información Adicional</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Fecha<br/>Inicio</strong><br/>{tendencias.productosRecientes}
            </div>
            <div>
              <strong>Última actualización:</strong> {new Date().toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosAgotadosPage;
