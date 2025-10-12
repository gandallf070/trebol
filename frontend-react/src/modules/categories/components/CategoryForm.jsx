import React from 'react';

const CategoryForm = ({
  newCategory,
  editingCategory,
  handleInputChange,
  handleSubmit,
  setEditingCategory,
  styles,
  errors,
  handleBlur,
}) => {
  const categoryToEdit = editingCategory || newCategory;

  return (
    <div style={styles.formCard}>
      <h2 style={styles.formTitle}>
        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      </h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <label htmlFor="nombre" style={styles.label}>
            Nombre de la Categoría *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={categoryToEdit.nombre}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={{
              ...styles.input,
              borderColor: errors.nombre ? 'red' : '#ccc',
            }}
            placeholder="Ingrese el nombre de la categoría"
            required
          />
          {errors.nombre && (
            <span style={styles.errorText}>{errors.nombre}</span>
          )}
        </div>

        <div>
          <label htmlFor="descripcion" style={styles.label}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={categoryToEdit.descripcion || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={{
              ...styles.textarea,
              borderColor: errors.descripcion ? 'red' : '#ccc',
            }}
            placeholder="Ingrese una descripción (opcional)"
            rows="3"
          />
          {errors.descripcion && (
            <span style={styles.errorText}>{errors.descripcion}</span>
          )}
        </div>

        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.submitButton}>
            {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
          </button>
          {editingCategory && (
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              style={styles.cancelButton}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
