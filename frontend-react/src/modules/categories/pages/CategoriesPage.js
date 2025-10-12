import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';

const CategoriesPage = () => {
  const { authTokens, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    nombre: '',
    descripcion: '',
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeCategorySection, setActiveCategorySection] =
    useState('category_list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user, currentPage]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
      };
      const response = await api.get('/inventario/categories/', { params });
      setCategories(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err) {
      setError('Error al cargar las categorías.');
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;

    if (editingCategory) {
      setEditingCategory({ ...editingCategory, [name]: value });
    } else {
      setNewCategory({ ...newCategory, [name]: value });
    }

    // Limpiar errores del campo actual
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const categoryToSave = editingCategory || newCategory;

    // Validaciones básicas
    const newErrors = {};
    if (!categoryToSave.nombre.trim())
      newErrors.nombre = 'El nombre es requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingCategory) {
        await api.put(
          `/inventario/categories/${editingCategory.id}/`,
          categoryToSave
        );
      } else {
        await api.post('/inventario/categories/', categoryToSave);
      }

      setNewCategory({
        nombre: '',
        descripcion: '',
      });
      setEditingCategory(null);
      fetchCategories();
      setActiveCategorySection('category_list');
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setError('Error al guardar la categoría.');
      }
      console.error('Error al guardar categoría:', err);
    }
  };

  const handleEdit = category => {
    setEditingCategory({ ...category });
    setActiveCategorySection('new_category');
    setErrors({});
  };

  const handleDelete = async categoryId => {
    if (
      window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')
    ) {
      setError(null);
      try {
        await api.delete(`/inventario/categories/${categoryId}/`);
        fetchCategories();
      } catch (err) {
        setError('Error al eliminar la categoría.');
        console.error('Error al eliminar categoría:', err);
      }
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
      const response = await api.get(
        `/inventario/categories/?search=${searchTerm}`
      );
      setSearchResults(response.data.results);
    } catch (err) {
      setError('Error al buscar categorías por nombre.');
      console.error('Error al buscar categorías:', err);
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
      fetchCategories();
    }
  };

  const handleSearchInputChange = e => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = page => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderCategorySection = () => {
    switch (activeCategorySection) {
      case 'new_category':
        return (
          <CategoryForm
            newCategory={newCategory}
            editingCategory={editingCategory}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            setEditingCategory={setEditingCategory}
            styles={styles}
            errors={errors}
            handleBlur={() => {}}
          />
        );
      case 'category_list':
        return (
          <div style={styles.listCard}>
            {/* Sección de búsqueda por nombre */}
            <div style={styles.searchSection}>
              <h3 style={styles.searchTitle}>Buscar Categoría por Nombre</h3>
              <div style={styles.searchControls}>
                <input
                  type="text"
                  placeholder="Ingrese el nombre de la categoría..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  style={styles.searchInput}
                  onKeyPress={e => e.key === 'Enter' && handleSearchByName()}
                />
                <button
                  onClick={handleSearchByName}
                  disabled={isSearching || !searchTerm.trim()}
                  style={{
                    ...styles.searchButton,
                    opacity: isSearching || !searchTerm.trim() ? 0.5 : 1,
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
                  Resultados de búsqueda ({searchResults.length} categoría
                  {searchResults.length !== 1 ? 's' : ''} encontrada
                  {searchResults.length !== 1 ? 's' : ''})
                </h3>
                <CategoryList
                  categories={searchResults}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  styles={styles}
                />
              </div>
            ) : (
              <CategoryList
                categories={categories}
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

  if (loading) return <p>Cargando categorías...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={styles.container}>
      <h1>Gestión de Categorías</h1>

      <div style={styles.buttonContainer}>
        <button
          style={
            activeCategorySection === 'new_category'
              ? styles.activeButton
              : styles.button
          }
          onClick={() => {
            setActiveCategorySection('new_category');
            setEditingCategory(null);
            setNewCategory({
              nombre: '',
              descripcion: '',
            });
            setErrors({});
          }}
        >
          Nueva Categoría
        </button>
        <button
          style={
            activeCategorySection === 'category_list'
              ? styles.activeButton
              : styles.button
          }
          onClick={() => setActiveCategorySection('category_list')}
        >
          Lista de Categorías
        </button>
      </div>

      {renderCategorySection()}
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
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
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
  actionButtonsContainer: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
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
  noDescription: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  submitButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s ease',
  },
};

export default CategoriesPage;
