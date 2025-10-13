import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import SaleList from '../components/SaleList';
import SaleForm from '../components/SaleForm';
import SaleDetail from '../components/SaleDetail';

const SalesPage = () => {
  const { authTokens, user } = useAuth();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeSaleSection, setActiveSaleSection] = useState('sale_list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchClients();
      fetchProducts();
    }
  }, [user, currentPage]);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
      };
      const response = await api.get('/sales/', { params });
      setSales(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError('Error al cargar las ventas.');
      // Error al cargar ventas
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/');
      setClients(response.data.results || response.data);
    } catch (err) {
      // Error al cargar clientes
      setClients([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/inventario/products/');
      setProducts(response.data.results || response.data);
    } catch (err) {
      // Error al cargar productos
      setProducts([]);
    }
  };

  const handleCreateSale = async (saleData) => {
    setError(null);
    setErrors({});

    try {
      const response = await api.post('/sales/', saleData);

      // Registrar productos agotados después de una venta exitosa
      await registerOutOfStockProducts(saleData.detalles);

      alert('Venta creada exitosamente');
      fetchSales(); // Recargar lista de ventas
      setActiveSaleSection('sale_list');
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);

        // Mostrar errores específicos del backend
        const errorMessages = [];
        for (const [field, messages] of Object.entries(err.response.data)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        }

        if (errorMessages.length > 0) {
          alert(`Errores de validación:\n${errorMessages.join('\n')}`);
        } else {
          alert('Error al crear la venta. Revisa los datos.');
        }
      } else {
        setError('Error al crear la venta.');
        alert('Error al crear la venta.');
      }
    }
  };

  const registerOutOfStockProducts = async (saleDetails) => {
    try {
      // Obtener productos actuales para verificar stock
      const productsResponse = await api.get('/inventario/products/');
      const currentProducts = productsResponse.data.results || productsResponse.data;

      // Verificar cada producto vendido
      for (const detail of saleDetails) {
        const product = currentProducts.find(p => p.id === detail.producto_id);

        if (product && product.cantidad_disponible <= 0) {
          // Producto agotado, intentar registrarlo
          try {
            await api.post('/productos-agotados/', {
              producto_id: product.id,
              cantidad_inicial: product.cantidad_disponible + detail.cantidad, // Cantidad inicial estimada
              cantidad_vendida: detail.cantidad
            });
            // Producto registrado como agotado
          } catch (agotadoError) {
            // Si ya existe el registro (400) o es un error de restricción unique, continuar silenciosamente
            if (agotadoError.response?.status === 400) {
            // Producto ya estaba registrado como agotado
            } else {
              // Error al registrar producto agotado
            }
          }
        }
      }
    } catch (error) {
      // Error al verificar productos agotados
      // No mostrar error al usuario ya que la venta fue exitosa
    }
  };

  const handleViewSaleDetail = async (saleId) => {
    setError(null);
    try {
      const response = await api.get(`/sales/${saleId}/`);
      setSelectedSale(response.data);
    } catch (err) {
      setError('Error al cargar el detalle de la venta.');
      // Error al cargar detalle de venta
    }
  };

  const handleCloseDetail = () => {
    setSelectedSale(null);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset a primera página cuando se busca
  };

  const handleSearchById = async () => {
    // Limpiar errores anteriores
    setError(null);

    if (!searchTerm.trim()) {
      setError('Debe ingresar un ID de venta para buscar.');
      setSearchResults([]);
      return;
    }

    // Validar que sea un número
    const saleId = parseInt(searchTerm.trim());
    if (isNaN(saleId) || saleId <= 0) {
      setError('Debe ingresar un ID de venta válido (número positivo).');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await api.get('/sales/', {
        params: { venta_id: saleId }
      });
      setSearchResults(response.data.results || []);
      if (response.data.results && response.data.results.length === 0) {
        setError(`No se encontró ninguna venta con el ID #${saleId}.`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No se encontró ninguna venta con el ID #${saleId}.`);
        setSearchResults([]);
      } else {
        setError('Error al buscar la venta por ID.');
        console.error('Error al buscar venta:', err);
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    // Recargar la lista completa solo si no estamos ya en la vista de lista completa
    if (searchResults.length > 0) {
      fetchSales();
    }
  };

  const handleSearchInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchById();
    }
  };

  const renderSaleSection = () => {
    switch (activeSaleSection) {
      case 'new_sale':
        return (
          <SaleForm
            clients={clients}
            products={products}
            handleSubmit={handleCreateSale}
            styles={styles}
            errors={errors}
          />
        );
      case 'sale_list':
        return (
          <div style={styles.listCard}>
            {/* Sección de búsqueda por ID */}
            <div style={styles.searchSection}>
              <h3 style={styles.searchTitle}>🔍 Buscar Venta por ID</h3>
              <div style={styles.searchControls}>
                <input
                  type="text"
                  placeholder="Ingrese el ID de la venta (ej: 25)..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyPress={handleSearchInputKeyPress}
                  style={styles.searchInput}
                  disabled={isSearching}
                />
                <button
                  onClick={handleSearchById}
                  disabled={isSearching || !searchTerm.trim()}
                  style={{
                    ...styles.searchButton,
                    opacity: isSearching || !searchTerm.trim() ? 0.5 : 1
                  }}
                >
                  {isSearching ? '🔄 Buscando...' : '🔍 Buscar'}
                </button>
                <button
                  onClick={clearSearch}
                  disabled={isSearching}
                  style={styles.clearButton}
                >
                  🧹 Limpiar
                </button>
              </div>
              {error && (
                <div style={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>

            {/* Resultados de búsqueda o lista completa */}
            {searchResults.length > 0 ? (
              <div>
                <h3 style={styles.resultsTitle}>
                  🔍 Resultado de búsqueda (1 venta encontrada)
                </h3>
                <SaleList
                  sales={searchResults}
                  handleViewDetail={handleViewSaleDetail}
                  styles={styles}
                  isSearchResult={true}
                />
              </div>
            ) : (
              <div>
                <h3 style={styles.listTitle}>📋 Lista de Ventas Completas</h3>
                <SaleList
                  sales={sales}
                  handleViewDetail={handleViewSaleDetail}
                  styles={styles}
                  isSearchResult={false}
                />
                {/* Paginación - solo mostrar si no hay búsqueda activa */}
                <div style={styles.paginationContainer}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    style={styles.paginationButton}
                  >
                    ⬅️ Anterior
                  </button>
                  <span style={styles.paginationText}>Página {currentPage} de {totalPages}</span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    style={styles.paginationButton}
                  >
                    Siguiente ➡️
                  </button>
                </div>
              </div>
            )}

            {/* Mensaje de error cuando no se encuentra venta */}
            {error && searchResults.length === 0 && (
              <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>{error}</p>
                <p style={styles.errorSuggestion}>
                  Verifica que el ID de venta sea correcto o intenta con otro ID.
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <p>Cargando ventas...</p>;

  return (
    <div style={styles.container}>
      <h1>Sistema de Ventas</h1>

      <div style={styles.buttonContainer}>
        <button
          style={activeSaleSection === 'new_sale' ? styles.activeButton : styles.button}
          onClick={() => setActiveSaleSection('new_sale')}
        >
          Nueva Venta
        </button>
        <button
          style={activeSaleSection === 'sale_list' ? styles.activeButton : styles.button}
          onClick={() => setActiveSaleSection('sale_list')}
        >
          Lista de Ventas
        </button>
      </div>

      {renderSaleSection()}

      {/* Modal de detalle de venta */}
      {selectedSale && (
        <SaleDetail
          sale={selectedSale}
          onClose={handleCloseDetail}
          styles={styles}
        />
      )}
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
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#495057',
  },
  select: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
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
  tableContainer: {
    overflowX: 'auto',
    marginTop: '20px',
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
  detailButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
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
  paginationText: {
    fontSize: '16px',
    color: '#495057',
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d',
  },
  noDataText: {
    fontSize: '18px',
    margin: 0,
  },
  // Estilos para el formulario de ventas
  productSelection: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  sectionTitle: {
    color: '#495057',
    marginBottom: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  productControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  quantityInput: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100px',
    boxSizing: 'border-box',
  },
  addButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  saleItems: {
    backgroundColor: '#fff',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  itemsList: {
    marginBottom: '15px',
  },
  saleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #e9ecef',
    gap: '15px',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    color: '#495057',
  },
  itemPrice: {
    color: '#6c757d',
    marginLeft: '10px',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  itemSubtotal: {
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: '10px',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  totalContainer: {
    textAlign: 'right',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #28a745',
  },
  totalText: {
    fontSize: '20px',
    color: '#28a745',
  },
  submitButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '12px 30px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  // Estilos para el modal de detalle
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90%',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e9ecef',
  },
  modalTitle: {
    margin: 0,
    color: '#495057',
    fontSize: '24px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
  },
  modalBody: {
    padding: '20px',
  },
  saleInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '10px',
    alignItems: 'center',
  },
  value: {
    marginLeft: '10px',
    fontWeight: '500',
  },
  totalValue: {
    marginLeft: '10px',
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#28a745',
  },
  productsDetail: {
    marginBottom: '20px',
  },
  detailTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  saleMetadata: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
  },
  modalFooter: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    textAlign: 'right',
  },
  closeModalButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
  // Estilos para el autocompletado
  autocompleteContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  autocompleteWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: '300px',
  },
  autocompleteInput: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  suggestionItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  suggestionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  suggestionName: {
    fontWeight: 'bold',
    color: '#495057',
  },
  suggestionPrice: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  suggestionStock: {
    fontSize: '12px',
    color: '#6c757d',
  },
  // Nuevos estilos para la funcionalidad mejorada
  quantityDisplay: {
    backgroundColor: '#e9ecef',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    padding: '8px 12px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#495057',
    minWidth: '60px',
    display: 'inline-block'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  reduceButton: {
    backgroundColor: '#ffc107',
    border: 'none',
    color: '#212529',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    minWidth: '40px'
  },
  reduceButtonDisabled: {
    backgroundColor: '#e9ecef',
    border: 'none',
    color: '#6c757d',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '16px',
    fontWeight: 'bold',
    minWidth: '40px'
  },
  // Estilos para el buscador de ventas
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
  resultsTitle: {
    color: '#28a745',
    marginBottom: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  listTitle: {
    color: '#28a745',
    marginBottom: '20px',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  errorMessage: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    fontSize: '14px',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    marginTop: '20px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  errorSuggestion: {
    color: '#856404',
    fontSize: '14px',
    marginTop: '10px',
    fontStyle: 'italic',
  },
};

export default SalesPage;
