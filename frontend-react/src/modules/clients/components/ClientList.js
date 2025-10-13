import React from 'react';

const ClientList = ({ clients, handleEdit, handleDelete, styles }) => {
  return (
    <div>
      <h2 style={styles.listTitle}>Lista de Clientes</h2>
      {clients.length === 0 ? (
        <p>No hay clientes registrados.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>CI</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Apellido</th>
              <th style={styles.th}>Teléfono</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={styles.td}>{client.ci}</td>
                <td style={styles.td}>{client.nombre}</td>
                <td style={styles.td}>{client.apellido}</td>
                <td style={styles.td}>{client.telefono}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEdit(client)}
                    style={{ ...styles.actionButton, backgroundColor: '#007bff' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    style={{ ...styles.actionButton, backgroundColor: '#dc3545' }}
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

export default ClientList;
