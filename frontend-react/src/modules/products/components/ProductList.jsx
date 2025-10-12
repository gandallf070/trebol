import React from 'react';

const ProductList = ({
  products,
  categories = [],
  handleEdit,
  handleDelete,
  styles,
}) => {
  // Función para obtener el nombre de la categoría
  const getCategoriaNombre = categoriaId => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return 'Cargando...';
    }
    const categoria = categories.find(cat => cat.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  };

  return (
    <div>
      <h2 style={styles.listTitle}>Lista de Productos</h2>
      {products.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Categoría</th>
              <th style={styles.th}>Precio</th>
              <th style={styles.th}>Cantidad</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td style={styles.td}>
                  <div>
                    <strong>{product.nombre}</strong>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                      }}
                    >
                      {product.descripcion.length > 50
                        ? `${product.descripcion.substring(0, 50)}...`
                        : product.descripcion}
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  {getCategoriaNombre(product.categoria)}
                </td>
                <td style={styles.td}>
                  Bs {parseFloat(product.precio).toFixed(2)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      color:
                        product.cantidad_disponible > 5
                          ? '#28a745'
                          : product.cantidad_disponible > 0
                            ? '#ffc107'
                            : '#dc3545',
                    }}
                  >
                    {product.cantidad_disponible}
                  </span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: product.estado ? '#d4edda' : '#f8d7da',
                      color: product.estado ? '#155724' : '#721c24',
                    }}
                  >
                    {product.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#007bff',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#dc3545',
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductList;
