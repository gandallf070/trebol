import React from 'react';

const SaleDetail = ({ sale, onClose, styles }) => {
  if (!sale) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Detalle de Venta #{sale.id}</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.modalBody}>
          {/* Información general de la venta */}
          <div style={styles.saleInfo}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Cliente:</span>
              <span style={styles.value}>{sale.cliente?.nombre || 'Cliente no encontrado'} {sale.cliente?.apellido || ''}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Vendedor:</span>
              <span style={styles.value}>{sale.vendedor || 'Vendedor no encontrado'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Fecha:</span>
              <span style={styles.value}>
                {new Date(sale.fecha_venta).toLocaleDateString('es-ES')} {new Date(sale.fecha_venta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Total:</span>
              <span style={styles.totalValue}>${sale.total}</span>
            </div>
          </div>

          {/* Detalle de productos */}
          <div style={styles.productsDetail}>
            <h3 style={styles.sectionTitle}>Productos Vendidos</h3>
            <div style={styles.tableContainer}>
              <table style={styles.detailTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Cantidad</th>
                    <th style={styles.th}>Precio Unit.</th>
                    <th style={styles.th}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.detalles && sale.detalles.map((detail, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{detail.producto?.nombre || detail.producto_nombre}</td>
                      <td style={styles.td}>{detail.cantidad}</td>
                      <td style={styles.td}>${detail.precio_unitario}</td>
                      <td style={styles.td}>${detail.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información adicional */}
          <div style={styles.saleMetadata}>
            <div style={styles.infoRow}>
              <span style={styles.label}>ID de Venta:</span>
              <span style={styles.value}>{sale.id}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.label}>Estado:</span>
              <span style={styles.value}>Completada</span>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.closeModalButton}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
