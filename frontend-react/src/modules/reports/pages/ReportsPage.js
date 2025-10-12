import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ReportsPage = () => {
  const [productosAgotados, setProductosAgotados] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeReportSection, setActiveReportSection] = useState('productos_agotados');

  useEffect(() => {
    if (activeReportSection === 'productos_agotados') {
      cargarProductosAgotados();
    }
  }, [activeReportSection]);

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
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
  };

  // Función para obtener clasificación de rendimiento
  const obtenerClasificacionRendimiento = (tiempoVida, cantidadVendida) => {
    if (tiempoVida <= 7) return { texto: 'Muy Rápido', color: '#28a745', bgColor: '#d4edda' };
    if (tiempoVida <= 15) return { texto: 'Rápido', color: '#17a2b8', bgColor: '#d1ecf1' };
    if (tiempoVida <= 30) return { texto: 'Normal', color: '#ffc107', bgColor: '#fff3cd' };
    return { texto: 'Lento', color: '#dc3545', bgColor: '#f8d7da' };
  };

  const renderReportSection = () => {
    switch (activeReportSection) {
      case 'productos_agotados':
        return (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#333', marginBottom: '30px', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
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
                    <strong>Categoría más agotada:</strong> {tendencias.categoriaMasFrecuente}
                  </div>
                  <div>
                    <strong>Productos agotados esta semana:</strong> {tendencias.productosRecientes}
                  </div>
                  <div>
                    <strong>Última actualización:</strong> {new Date().toLocaleString('es-ES')}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'informe_mensual':
        return (
          <InformeMensual
            styles={styles}
            tendencias={tendencias}
          />
        );

      case 'informe_diario':
        return (
          <InformeDiario
            styles={styles}
            tendencias={tendencias}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <h1>Sistema de Reportes</h1>

      <div style={styles.buttonContainer}>
        <button
          style={activeReportSection === 'productos_agotados' ? styles.activeButton : styles.button}
          onClick={() => setActiveReportSection('productos_agotados')}
        >
          📦 Productos Agotados
        </button>
        <button
          style={activeReportSection === 'informe_mensual' ? styles.activeButton : styles.button}
          onClick={() => setActiveReportSection('informe_mensual')}
        >
          📊 Informes Mensuales
        </button>
        <button
          style={activeReportSection === 'informe_diario' ? styles.activeButton : styles.button}
          onClick={() => setActiveReportSection('informe_diario')}
        >
          📈 Informe Diario
        </button>
      </div>

      {renderReportSection()}
    </div>
  );
};

// Componente para Informe Diario
const InformeDiario = ({ styles, tendencias }) => {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' o 'usuario'
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');

  useEffect(() => {
    cargarUsuarios();
    cargarVentasDelDia();
  }, [filtroTipo, usuarioSeleccionado]);

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/users/');
      setUsuarios(response.data.results || response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuarios([]);
    }
  };

  const cargarVentasDelDia = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener fecha actual en formato YYYY-MM-DD
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];

      const params = {};

      if (filtroTipo === 'usuario' && usuarioSeleccionado) {
        params.usuario_id = usuarioSeleccionado;
      }

      const response = await api.get(`/ventas-del-dia/?fecha=${fechaHoy}`, { params });
      setVentas(response.data.results || response.data);
    } catch (error) {
      setError('Error al cargar las ventas del día');
      setVentas([]);
      console.error('Error al cargar ventas del día:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
  };

  const calcularTotalVentas = () => {
    return ventas.reduce((total, venta) => total + (parseFloat(venta.total) || 0), 0);
  };

  const calcularTotalProductos = () => {
    return ventas.reduce((total, venta) => {
      return total + (venta.detalles ? venta.detalles.reduce((subtotal, detalle) =>
        subtotal + (parseInt(detalle.cantidad) || 0), 0) : 0);
    }, 0);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
        📊 Informe Diario
      </h1>

      {/* Controles de Filtro */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📅 Filtros del Día</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Tipo de Informe:
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="todos">Todas las ventas del día</option>
              <option value="usuario">Ventas por usuario específico</option>
            </select>
          </div>

          {filtroTipo === 'usuario' && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
                Seleccionar Usuario:
              </label>
              <select
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.username} ({usuario.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Fecha del Informe:
            </label>
            <div style={{
              padding: '10px',
              backgroundColor: '#e9ecef',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#495057'
            }}>
              {new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
          {filtroTipo === 'todos' ? (
            <span>📊 Mostrando todas las ventas realizadas en el día de hoy</span>
          ) : (
            <span>👤 Mostrando ventas del usuario seleccionado en el día de hoy</span>
          )}
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>📈 Resumen del Día</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{ventas.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Total de Ventas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>${calcularTotalVentas().toFixed(2)}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Monto Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{calcularTotalProductos()}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Productos Vendidos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
              {ventas.length > 0 ? (calcularTotalVentas() / ventas.length).toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Promedio por Venta</div>
          </div>
        </div>
      </div>

      {/* Tabla de Ventas del Día */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>
            📋 Ventas del Día {filtroTipo === 'usuario' && usuarioSeleccionado ?
              `(${usuarios.find(u => u.id.toString() === usuarioSeleccionado)?.username || 'Usuario'})` :
              '(Todos los usuarios)'} ({ventas.length} registros)
          </h3>

          {error ? (
            <div style={{
              color: '#721c24',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0' }}>❌ {error}</p>
              <button
                onClick={cargarVentasDelDia}
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
          ) : ventas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <p style={{ fontSize: '18px', color: '#6c757d', margin: '0' }}>
                📋 No hay ventas registradas en el día
              </p>
              <p style={{ fontSize: '14px', color: '#adb5bd', margin: '10px 0 0 0' }}>
                {filtroTipo === 'usuario' && usuarioSeleccionado ?
                  `El usuario seleccionado no ha realizado ventas en el día de hoy` :
                  'Las ventas realizadas en el día aparecerán automáticamente en esta tabla'
                }
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                      🆔 Venta
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                      👤 Cliente
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                      👨‍💼 Vendedor
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      📅 Fecha Venta
                    </th>
                    <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                      💰 Total
                    </th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      📦 Productos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta, index) => (
                    <tr
                      key={venta.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#e3f2fd'}
                      onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                    >
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#495057' }}>
                        #{venta.id}
                      </td>
                      <td style={{ padding: '15px', color: '#6c757d' }}>
                        {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido}` : 'N/A'}
                      </td>
                      <td style={{ padding: '15px', color: '#6c757d' }}>
                        {venta.vendedor || 'N/A'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                        {formatearFecha(venta.fecha_venta)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                        ${venta.total ? Number(venta.total).toFixed(2) : '0.00'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {venta.detalles && venta.detalles.map((detalle, idx) => (
                            <div key={idx} style={{
                              backgroundColor: '#e9ecef',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              textAlign: 'left'
                            }}>
                              <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                {detalle.producto.nombre}
                              </div>
                              <div style={{ color: '#6c757d' }}>
                                Cant: {detalle.cantidad} x ${Number(detalle.precio_unitario || 0).toFixed(2)} = ${Number(detalle.subtotal || 0).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Totales Filtrados */}
      {filtroAplicado && ventas.length > 0 && (
        <div style={{
          backgroundColor: '#e9ecef',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>💰 Resumen de Ventas Filtradas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{ventas.length}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Ventas Totales</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>${calcularTotalVentas().toFixed(2)}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Monto Total</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{calcularTotalProductos()}</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Productos Vendidos</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {ventas.length > 0 ? (calcularTotalVentas() / ventas.length).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Promedio por Venta</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para Informe Mensual
const InformeMensual = ({ styles, tendencias }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fechaInicio, setFechaInicio] = useState('2000-01-14');
  const [fechaFin, setFechaFin] = useState('2000-12-25');
  const [filtroAplicado, setFiltroAplicado] = useState(true);

  useEffect(() => {
    cargarVentas();
  }, [currentPage]);

  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
      };

      // Agregar filtros de fecha si están aplicados
      if (filtroAplicado && fechaInicio && fechaFin) {
        params.fecha_inicio = fechaInicio;
        params.fecha_fin = fechaFin;
      }

      const response = await api.get('/sales/', { params });
      setVentas(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (error) {
      setError('Error al cargar las ventas');
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    if (fechaInicio && fechaFin) {
      setFiltroAplicado(true);
      setCurrentPage(1);
      cargarVentas(fechaInicio, fechaFin);
    } else {
      alert('Por favor selecciona ambas fechas (inicio y fin)');
    }
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setFiltroAplicado(false);
    setCurrentPage(1);
    cargarVentas();
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
  };

  const formatearFechaInput = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    return fecha.toISOString().split('T')[0];
  };

  // Función para formatear fecha de yyyy-mm-dd a dd/mm/yyyy para el backend
  const formatearFechaParaBackend = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const calcularTotalVentas = () => {
    return ventas.reduce((total, venta) => total + (parseFloat(venta.total) || 0), 0);
  };

  const calcularTotalProductos = () => {
    return ventas.reduce((total, venta) => {
      return total + (venta.detalles ? venta.detalles.reduce((subtotal, detalle) =>
        subtotal + (parseInt(detalle.cantidad) || 0), 0) : 0);
    }, 0);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
        📊 Informes Mensuales
      </h1>

      {/* Resumen Ejecutivo */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>📈 Resumen del Período</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{ventas.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Total de Ventas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>${calcularTotalVentas().toFixed(2)}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Monto Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{calcularTotalProductos()}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Productos Vendidos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
              {ventas.length > 0 ? (calcularTotalVentas() / ventas.length).toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Promedio por Venta</div>
          </div>
        </div>
      </div>

      {/* Controles de Fecha */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📅 Filtros de Fecha</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Fecha Inicio:
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Fecha Fin:
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={aplicarFiltros}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔍 Aplicar Filtros
            </button>
            <button
              onClick={limpiarFiltros}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🧹 Limpiar
            </button>
          </div>
        </div>
        {filtroAplicado && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
            Filtros aplicados: {formatearFechaParaBackend(fechaInicio)} hasta {formatearFechaParaBackend(fechaFin)}
          </div>
        )}
      </div>

      {/* Tabla de Ventas */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>
            📋 Ventas {filtroAplicado ? 'Filtradas' : 'Completas'} ({ventas.length} registros)
          </h3>

          {error ? (
            <div style={{
              color: '#721c24',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0' }}>❌ {error}</p>
              <button
                onClick={cargarVentas}
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
          ) : ventas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <p style={{ fontSize: '18px', color: '#6c757d', margin: '0' }}>
                📋 No hay ventas registradas
              </p>
              <p style={{ fontSize: '14px', color: '#adb5bd', margin: '10px 0 0 0' }}>
                {filtroAplicado
                  ? 'No se encontraron ventas en el período seleccionado'
                  : 'Las ventas aparecerán automáticamente cuando se realicen'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Tabla de Ventas */}
              <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                        🆔 Venta
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                        👤 Cliente
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '16px' }}>
                        👨‍💼 Vendedor
                      </th>
                      <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                        📅 Fecha Venta
                      </th>
                      <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                        💰 Total
                      </th>
                      <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                        📦 Productos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta, index) => (
                      <tr
                        key={venta.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#e3f2fd'}
                        onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                      >
                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#495057' }}>
                          #{venta.id}
                        </td>
                        <td style={{ padding: '15px', color: '#6c757d' }}>
                          {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido}` : 'N/A'}
                        </td>
                        <td style={{ padding: '15px', color: '#6c757d' }}>
                          {venta.vendedor || 'N/A'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                          {formatearFecha(venta.fecha_venta)}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                          ${venta.total ? Number(venta.total).toFixed(2) : '0.00'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {venta.detalles && venta.detalles.map((detalle, idx) => (
                              <div key={idx} style={{
                                backgroundColor: '#e9ecef',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                textAlign: 'left'
                              }}>
                                <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                  {detalle.producto.nombre}
                                </div>
                                <div style={{ color: '#6c757d' }}>
                                  Cant: {detalle.cantidad} x ${Number(detalle.precio_unitario || 0).toFixed(2)} = ${Number(detalle.subtotal || 0).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  style={{
                    backgroundColor: currentPage === 1 ? '#e9ecef' : '#28a745',
                    color: currentPage === 1 ? '#6c757d' : 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ⬅️ Anterior
                </button>

                <span style={{
                  padding: '8px 12px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#495057'
                }}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  style={{
                    backgroundColor: currentPage === totalPages ? '#e9ecef' : '#28a745',
                    color: currentPage === totalPages ? '#6c757d' : 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Siguiente ➡️
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f4f7f6',
    minHeight: 'calc(100vh - 40px)',
  },
  button: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    padding: '10px 15px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  activeButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '4px',
    border: '1px solid #28a745',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
};

export default ReportsPage;
