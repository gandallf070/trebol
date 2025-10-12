import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';

const ClientsPage = () => {
  const { authTokens, user } = useAuth();
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({
    ci: '',
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ciError, setCiError] = useState(null);
  const [telefonoError, setTelefonoError] = useState(null);
  const [activeClientSection, setActiveClientSection] = useState('client_list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchCI, setSearchCI] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, currentPage]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
      };
      const response = await api.get('/clients/', { params });
      setClients(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError('Error al cargar los clientes.');
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateClientUniqueness = async (field, value) => {
    if (!value) return;

    const params = { [field]: value };
    if (editingClient) {
      params.client_id = editingClient.id;
    }

    try {
      await api.get('/clients/check_uniqueness/', { params });
      if (field === 'ci') setCiError(null);
      if (field === 'telefono') setTelefonoError(null);
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && errorData[field]) {
        if (field === 'ci') setCiError(errorData[field][0]);
        if (field === 'telefono') setTelefonoError(errorData[field][0]);
      } else {
        console.error(`Error al verificar unicidad de ${field}:`, err);
      }
      return false;
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (editingClient) {
      setEditingClient({ ...editingClient, [name]: value });
    } else {
      setNewClient({ ...newClient, [name]: value });
    }
    if (name === 'ci') setCiError(null);
    if (name === 'telefono') setTelefonoError(null);
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    validateClientUniqueness(name, value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setCiError(null);
    setTelefonoError(null);

    const clientToSave = editingClient || newClient;

    const isCiUnique = await validateClientUniqueness('ci', clientToSave.ci);
    const isTelefonoUnique = await validateClientUniqueness(
      'telefono',
      clientToSave.telefono
    );

    if (!isCiUnique || !isTelefonoUnique) {
      return;
    }

    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}/`, editingClient);
      } else {
        await api.post('/clients/', newClient);
      }
      setNewClient({ ci: '', nombre: '', apellido: '', telefono: '' });
      setEditingClient(null);
      fetchClients();
      setActiveClientSection('client_list');
    } catch (err) {
      setError('Error al guardar el cliente.');
      console.error('Error al guardar cliente:', err);
    }
  };

  const handleEdit = client => {
    setEditingClient({ ...client });
    setActiveClientSection('new_client');
    setCiError(null);
    setTelefonoError(null);
  };

  const handleDelete = async clientId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setError(null);
      try {
        await api.delete(`/clients/${clientId}/`);
        fetchClients();
      } catch (err) {
        setError('Error al eliminar el cliente.');
        console.error('Error al eliminar cliente:', err);
      }
    }
  };

  const handleSearchByCI = async () => {
    if (searchCI.length < 3) {
      setError('Debe ingresar al menos 3 dígitos para buscar por CI.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.get(`/clients/?search=${searchCI}`);
      setSearchResults(response.data.results);
    } catch (err) {
      setError('Error al buscar clientes por CI.');
      console.error('Error al buscar clientes:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchCI('');
    setSearchResults([]);
    setError(null);
    // Recargar la lista completa solo si no estamos ya en la vista de lista completa
    if (searchResults.length > 0) {
      fetchClients();
    }
  };

  const handleSearchInputChange = e => {
    setSearchCI(e.target.value);
    if (e.target.value.length < 3) {
      setSearchResults([]);
    }
  };

  const handlePageChange = page => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderClientSection = () => {
    switch (activeClientSection) {
      case 'new_client':
        return (
          <ClientForm
            newClient={newClient}
            editingClient={editingClient}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            setEditingClient={setEditingClient}
            styles={styles}
            ciError={ciError}
            telefonoError={telefonoError}
            handleBlur={handleBlur}
          />
        );
      case 'client_list':
        return (
          <div style={styles.listCard}>
            {/* Sección de búsqueda por CI */}
            <div style={styles.searchSection}>
              <h3 style={styles.searchTitle}>Buscar Cliente por CI</h3>
              <div style={styles.searchControls}>
                <input
                  type="text"
                  placeholder="Ingrese al menos 3 dígitos del CI..."
                  value={searchCI}
                  onChange={handleSearchInputChange}
                  style={styles.searchInput}
                  maxLength="20"
                />
                <button
                  onClick={handleSearchByCI}
                  disabled={isSearching || searchCI.length < 3}
                  style={{
                    ...styles.searchButton,
                    opacity: isSearching || searchCI.length < 3 ? 0.5 : 1,
                  }}
                >
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
                <button
                  onClick={clearSearch}
                  disabled={isSearching}
                  style={styles.clearButton}
                >
                  Limpiar
                </button>
              </div>
              {searchCI.length > 0 && searchCI.length < 3 && (
                <p style={styles.searchWarning}>
                  Ingrese al menos 3 dígitos para realizar la búsqueda
                </p>
              )}
            </div>

            {/* Resultados de búsqueda o lista completa */}
            {searchResults.length > 0 ? (
              <div>
                <h3 style={styles.resultsTitle}>
                  Resultados de búsqueda ({searchResults.length} cliente
                  {searchResults.length !== 1 ? 's' : ''} encontrado
                  {searchResults.length !== 1 ? 's' : ''})
                </h3>
                <ClientList
                  clients={searchResults}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  styles={styles}
                />
              </div>
            ) : (
              <ClientList
                clients={clients}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                styles={styles}
              />
            )}

            {/* Paginación - solo mostrar si no hay búsqueda activa */}
            {searchResults.length === 0 && (
              <div style={styles.paginationContainer}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={styles.paginationButton}
                >
                  Anterior
                </button>
                <span style={styles.paginationText}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={styles.paginationButton}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <p>Cargando clientes...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h1>Gestión de Clientes</h1>

      <div style={styles.buttonContainer}>
        <button
          style={
            activeClientSection === 'new_client'
              ? styles.activeButton
              : styles.button
          }
          onClick={() => {
            setActiveClientSection('new_client');
            setEditingClient(null);
            setNewClient({ ci: '', nombre: '', apellido: '', telefono: '' });
            setCiError(null);
            setTelefonoError(null);
          }}
        >
          Nuevo Cliente
        </button>
        <button
          style={
            activeClientSection === 'client_list'
              ? styles.activeButton
              : styles.button
          }
          onClick={() => setActiveClientSection('client_list')}
        >
          Lista de Clientes
        </button>
      </div>

      {renderClientSection()}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f4f7f6',
    minHeight: 'calc(100vh - 40px)',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  formTitle: {
    color: '#28a745',
    marginBottom: '20px',
    fontSize: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
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
  listCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  listTitle: {
    color: '#28a745',
    marginBottom: '20px',
    fontSize: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
  },
  actionButton: {
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px',
    transition: 'background-color 0.3s ease',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px',
  },
  searchSection: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e9ecef',
  },
  searchTitle: {
    color: '#495057',
    marginBottom: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  searchControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '300px',
    boxSizing: 'border-box',
  },
  searchButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  clearButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  searchWarning: {
    color: '#856404',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    marginTop: '10px',
  },
  resultsTitle: {
    color: '#28a745',
    marginBottom: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
    gap: '10px',
  },
  paginationButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '8px 15px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  paginationButtonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  paginationText: {
    fontSize: '16px',
    color: '#495057',
  },
};

export default ClientsPage;
