import React from 'react';

const ProductForm = ({
  newProduct,
  editingProduct,
  categories = [],
  handleInputChange,
  handleSubmit,
  setEditingProduct,
  styles,
  errors,
}) => {
  return (
    <div style={styles.formCard}>
      <h2 style={styles.formTitle}>
        {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
      </h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre del producto"
            value={editingProduct ? editingProduct.nombre : newProduct.nombre}
            onChange={handleInputChange}
            style={{
              ...styles.input,
              borderColor: errors.nombre ? 'red' : '#ccc',
            }}
            required
          />
          {errors.nombre && <p style={styles.errorText}>{errors.nombre}</p>}
        </div>

        <div>
          <textarea
            name="descripcion"
            placeholder="Descripción del producto"
            value={
              editingProduct
                ? editingProduct.descripcion
                : newProduct.descripcion
            }
            onChange={handleInputChange}
            style={{
              ...styles.input,
              minHeight: '80px',
              resize: 'vertical',
              borderColor: errors.descripcion ? 'red' : '#ccc',
            }}
            required
          />
          {errors.descripcion && (
            <p style={styles.errorText}>{errors.descripcion}</p>
          )}
        </div>

        <div>
          <select
            name="categoria"
            value={
              editingProduct ? editingProduct.categoria : newProduct.categoria
            }
            onChange={handleInputChange}
            style={{
              ...styles.input,
              borderColor: errors.categoria ? 'red' : '#ccc',
            }}
            required
            disabled={!Array.isArray(categories) || categories.length === 0}
          >
            <option value="">
              {Array.isArray(categories) && categories.length > 0
                ? 'Seleccionar categoría'
                : 'Cargando categorías...'}
            </option>
            {Array.isArray(categories) &&
              categories.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
          </select>
          {errors.categoria && (
            <p style={styles.errorText}>{errors.categoria}</p>
          )}
        </div>

        <div>
          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={editingProduct ? editingProduct.precio : newProduct.precio}
            onChange={handleInputChange}
            style={{
              ...styles.input,
              borderColor: errors.precio ? 'red' : '#ccc',
            }}
            step="0.01"
            min="0"
            required
          />
          {errors.precio && <p style={styles.errorText}>{errors.precio}</p>}
        </div>

        <div>
          <input
            type="number"
            name="cantidad_disponible"
            placeholder="Cantidad disponible"
            value={
              editingProduct
                ? editingProduct.cantidad_disponible
                : newProduct.cantidad_disponible
            }
            onChange={handleInputChange}
            style={{
              ...styles.input,
              borderColor: errors.cantidad_disponible ? 'red' : '#ccc',
            }}
            min="0"
            required
          />
          {errors.cantidad_disponible && (
            <p style={styles.errorText}>{errors.cantidad_disponible}</p>
          )}
        </div>

        <div style={styles.checkboxContainer}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="estado"
              checked={
                editingProduct ? editingProduct.estado : newProduct.estado
              }
              onChange={handleInputChange}
            />
            Producto activo
          </label>
        </div>

        <button type="submit" style={styles.button}>
          {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
        </button>
        {editingProduct && (
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            style={{ ...styles.button, backgroundColor: '#6c757d' }}
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
};

export default ProductForm;
