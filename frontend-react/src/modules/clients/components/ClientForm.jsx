import React from 'react';

const ClientForm = ({
  newClient,
  editingClient,
  handleInputChange,
  handleSubmit,
  setEditingClient,
  styles,
  ciError,
  telefonoError,
  handleBlur,
}) => {
  return (
    <div style={styles.formCard}>
      <h2 style={styles.formTitle}>
        {editingClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
      </h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <input
            type="text"
            name="ci"
            placeholder="Cédula de Identidad"
            value={editingClient ? editingClient.ci : newClient.ci}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={{ ...styles.input, borderColor: ciError ? 'red' : '#ccc' }}
            required
          />
          {ciError && <p style={styles.errorText}>{ciError}</p>}
        </div>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={editingClient ? editingClient.nombre : newClient.nombre}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <input
          type="text"
          name="apellido"
          placeholder="Apellido"
          value={editingClient ? editingClient.apellido : newClient.apellido}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <div>
          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={editingClient ? editingClient.telefono : newClient.telefono}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={{
              ...styles.input,
              borderColor: telefonoError ? 'red' : '#ccc',
            }}
            required
          />
          {telefonoError && <p style={styles.errorText}>{telefonoError}</p>}
        </div>
        <button type="submit" style={styles.button}>
          {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
        </button>
        {editingClient && (
          <button
            type="button"
            onClick={() => setEditingClient(null)}
            style={{ ...styles.button, backgroundColor: '#6c757d' }}
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  );
};

export default ClientForm;
