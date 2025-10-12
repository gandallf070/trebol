import React from 'react';

const CategoryList = ({ categories, handleEdit, handleDelete, styles }) => {
  if (!categories || categories.length === 0) {
    return (
      <div style={styles.noDataContainer}>
        <p style={styles.noDataText}>No hay categorías registradas.</p>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Descripción</th>
            <th style={styles.th}>Fecha Creación</th>
            <th style={styles.th}>Fecha Actualización</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id}>
              <td style={styles.td}>{category.id}</td>
              <td style={styles.td}>{category.nombre}</td>
              <td style={styles.td}>
                {category.descripcion ? (
                  <span title={category.descripcion}>
                    {category.descripcion.length > 50
                      ? `${category.descripcion.substring(0, 50)}...`
                      : category.descripcion}
                  </span>
                ) : (
                  <span style={styles.noDescription}>Sin descripción</span>
                )}
              </td>
              <td style={styles.td}>
                {new Date(category.created_at).toLocaleDateString('es-ES')}
              </td>
              <td style={styles.td}>
                {new Date(category.updated_at).toLocaleDateString('es-ES')}
              </td>
              <td style={styles.td}>
                <div style={styles.actionButtonsContainer}>
                  <button
                    onClick={() => handleEdit(category)}
                    style={styles.editButton}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    style={styles.deleteButton}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryList;
