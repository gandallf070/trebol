import React from 'react';

const SaleList = ({
  sales,
  handleViewDetail,
  styles,
  isSearchResult = false,
}) => {
  if (!sales || sales.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <p style={styles.noDataText}>
          {isSearchResult
            ? 'No se encontraron ventas con el ID especificado.'
            : 'No hay ventas registradas.'}
        </p>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Cliente</th>
            <th style={styles.th}>Vendedor</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Productos</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id}>
              <td style={styles.td}>{sale.id}</td>
              <td style={styles.td}>
                {sale.cliente?.nombre || 'Cliente no encontrado'}{' '}
                {sale.cliente?.apellido || ''}
              </td>
              <td style={styles.td}>
                {sale.vendedor || 'Vendedor no encontrado'}
              </td>
              <td style={styles.td}>
                {(() => {
                  const fecha = new Date(sale.fecha_venta);
                  const dia = fecha.getDate().toString().padStart(2, '0');
                  const mes = (fecha.getMonth() + 1)
                    .toString()
                    .padStart(2, '0');
                  const anio = fecha.getFullYear();
                  const hora = fecha.getHours().toString().padStart(2, '0');
                  const minuto = fecha.getMinutes().toString().padStart(2, '0');
                  return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
                })()}
              </td>
              <td style={styles.td}>${sale.total}</td>
              <td style={styles.td}>
                {sale.detalles ? sale.detalles.length : 0} producto
                {sale.detalles && sale.detalles.length !== 1 ? 's' : ''}
              </td>
              <td style={styles.td}>
                <button
                  onClick={() => handleViewDetail(sale.id)}
                  style={styles.detailButton}
                >
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SaleList;
