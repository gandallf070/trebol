import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';

const ProductsPage = () => {
  const { authTokens, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: '',
    cantidad_disponible: '',
    estado: true
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeProductSection, setActiveProductSection] = useState('product_list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
      };
      const response = await api.get('/inventario/products/', { params });
      setProducts(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError('Error al cargar los productos.');
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      console.log('Intentando cargar categorías...');
      const response = await api.get('/inventario/categories/');
      console.log('Respuesta de categorías:', response.data);
      setCategories(response.data.results || response.data); // Manejar ambos formatos de respuesta
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      console.error('Detalles del error:', err.response?.data);
      setCategories([]); // Asegurar que categories sea un array vacío
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
    }
  }, [user, currentPage, fetchProducts]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [name]: inputValue });
    } else {
      setNewProduct({ ...newProduct, [name]: inputValue });
    }

    // Limpiar errores del campo actual
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const productToSave = editingProduct || newProduct;

    // Validaciones básicas
    const newErrors = {};
    if (!productToSave.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!productToSave.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!productToSave.categoria) newErrors.categoria = 'La categoría es requerida';
    if (!productToSave.precio || productToSave.precio <= 0) newErrors.precio = 'El precio debe ser mayor a 0';
    if (!productToSave.cantidad_disponible || productToSave.cantidad_disponible < 0) {
      newErrors.cantidad_disponible = 'La cantidad debe ser mayor o igual a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingProduct) {
        await api.put(`/inventario/products/${editingProduct.id}/`, productToSave);
      } else {
        await api.post('/inventario/products/', productToSave);
      }

      setNewProduct({
        nombre: '',
        descripcion: '',
        categoria: '',
        precio: '',
        cantidad_disponible: '',
        estado: true
      });
      setEditingProduct(null);
      fetchProducts();
      setActiveProductSection('product_list');
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setError('Error al guardar el producto.');
      }
      console.error('Error al guardar producto:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
    setActiveProductSection('new_product');
    setErrors({});
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setError(null);
      try {
        await api.delete(`/inventario/products/${productId}/`);
        fetchProducts();
      } catch (err) {
        setError('Error al eliminar el producto.');
        console.error('Error al eliminar producto:', err);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset a primera página cuando se busca
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchByName = async () => {
    if (!searchTerm.trim()) {
      setError('Debe ingresar un término de búsqueda.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await api.get(`/inventario/products/?search=${searchTerm}`);
      setSearchResults(response.data.results);
    } catch (err) {
      setError('Error al buscar productos por nombre.');
      console.error('Error al buscar productos:', err);
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
      fetchProducts();
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const renderProductSection = () => {
    switch (activeProductSection) {
      case 'new_product':
        return (
          <ProductForm
            newProduct={newProduct}
            editingProduct={editingProduct}
            categories={categories}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            setEditingProduct={setEditingProduct}
            styles={styles}
            errors={errors}
            handleBlur={() => {}}
          />
        );
      case 'product_list':
        return (
          <div style={styles.listCard}>
            {/* Sección de búsqueda por nombre */}
            <div style={styles.searchSection}>
              <h3 style={styles.searchTitle}>Buscar Producto por Nombre</h3>
              <div style={styles.searchControls}>
                <input
                  type="text"
                  placeholder="Ingrese el nombre del producto..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  style={styles.searchInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchByName()}
                />
                <button
                  onClick={handleSearchByName}
                  disabled={isSearching || !searchTerm.trim()}
                  style={{
                    ...styles.searchButton,
                    opacity: isSearching || !searchTerm.trim() ? 0.5 : 1
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
            </div>

            {/* Resultados de búsqueda o lista completa */}
            {searchResults.length > 0 ? (
              <div>
                <h3 style={styles.resultsTitle}>
                  Resultados de búsqueda ({searchResults.length} producto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''})
                </h3>
                <ProductList products={searchResults} categories={categories} handleEdit={handleEdit} handleDelete={handleDelete} styles={styles} />
              </div>
            ) : (
              <ProductList products={products} categories={categories} handleEdit={handleEdit} handleDelete={handleDelete} styles={styles} />
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
                <span style={styles.paginationText}>Página {currentPage} de {totalPages}</span>
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

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h1>Gestión de Productos</h1>

      <div style={styles.buttonContainer}>
        <button
          style={activeProductSection === 'new_product' ? styles.activeButton : styles.button}
          onClick={() => {
            setActiveProductSection('new_product');
            setEditingProduct(null);
            setNewProduct({
              nombre: '',
              descripcion: '',
              categoria: '',
              precio: '',
              cantidad_disponible: '',
              estado: true
            });
            setErrors({});
          }}
        >
          Nuevo Producto
        </button>
        <button
          style={activeProductSection === 'product_list' ? styles.activeButton : styles.button}
          onClick={() => setActiveProductSection('product_list')}
        >
          Lista de Productos
        </button>
      </div>

      {renderProductSection()}
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
  searchContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
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
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  checkboxLabel: {
    fontSize: '16px',
    color: '#495057',
  },
};

export default ProductsPage;
