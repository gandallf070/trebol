import React, { useState, useEffect } from 'react';

const SaleForm = ({ clients, products, handleSubmit, styles, errors }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  // Efecto para recalcular el total cuando cambian los productos en la venta
  useEffect(() => {
    const total = saleItems.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal);
      return sum + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
    setTotalAmount(total);
  }, [saleItems]);

  // Función para filtrar productos basado en el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products
      .filter(
        product =>
          product.cantidad_disponible > 0 &&
          (product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toString().includes(searchTerm))
      )
      .slice(0, 10); // Limitar a 10 sugerencias

    setFilteredProducts(filtered);
    setShowSuggestions(true);
  }, [searchTerm, products]);

  const handleProductSelect = product => {
    setSearchTerm(product.nombre);
    setSelectedProduct(product);
    setShowSuggestions(false);
  };

  const handleAddProduct = () => {
    let product = selectedProduct;
    if (!product) {
      product = products.find(
        p =>
          p.nombre.toLowerCase() === searchTerm.toLowerCase().trim() ||
          p.id.toString() === searchTerm.trim()
      );
    }

    if (!product) {
      alert(
        'Producto no encontrado. Selecciona un producto de la lista de sugerencias.'
      );
      return;
    }

    if (currentQuantity <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    const existingItem = saleItems.find(item => item.product.id === product.id);
    const currentQuantityInSale = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentQuantityInSale + currentQuantity;

    if (totalQuantity > product.cantidad_disponible) {
      alert(
        `No hay suficiente stock. Disponible: ${product.cantidad_disponible}`
      );
      return;
    }

    if (existingItem) {
      setSaleItems(prevItems =>
        prevItems.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: totalQuantity,
                subtotal: parseFloat(product.precio) * totalQuantity,
              }
            : item
        )
      );
    } else {
      const newSubtotal = parseFloat(product.precio) * currentQuantity;
      setSaleItems(prevItems => [
        ...prevItems,
        {
          product,
          quantity: currentQuantity,
          unitPrice: parseFloat(product.precio),
          subtotal: newSubtotal,
        },
      ]);
    }

    setSearchTerm('');
    setSelectedProduct(null);
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = productId => {
    setSaleItems(prevItems =>
      prevItems.filter(item => item.product.id !== productId)
    );
  };

  const handleQuantityChange = (productId, change) => {
    setSaleItems(prevItems => {
      // Crear una copia profunda del array anterior para asegurar la inmutabilidad
      const updatedItems = prevItems
        .map(item => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + change;

            // Validar stock antes de actualizar
            if (newQuantity > item.product.cantidad_disponible) {
              alert(
                `No hay suficiente stock. Disponible: ${item.product.cantidad_disponible}`
              );
              return { ...item };
            }

            if (newQuantity <= 0) {
              // Producto agotado, no se incluye en la lista
              return null;
            }

            // Devolver un objeto nuevo con la cantidad y el subtotal actualizados
            return {
              ...item,
              quantity: newQuantity,
              subtotal: parseFloat(item.unitPrice) * newQuantity,
            };
          }
          return { ...item };
        })
        .filter(item => item !== null && item.quantity > 0); // Eliminar productos con cantidad cero o null

      // Devolver el nuevo estado. Esto asegura que React detecte el cambio y re-renderice.
      return [...updatedItems];
    });
  };

  const handleFormSubmit = e => {
    e.preventDefault();

    if (!selectedClient) {
      alert('Debe seleccionar un cliente');
      return;
    }

    if (saleItems.length === 0) {
      alert('Debe agregar al menos un producto a la venta');
      return;
    }

    const saleData = {
      cliente_id: parseInt(selectedClient),
      detalles: saleItems.map(item => ({
        producto_id: item.product.id,
        cantidad: item.quantity,
        precio_unitario: parseFloat(item.unitPrice),
        subtotal: parseFloat(item.subtotal),
      })),
      total: parseFloat(totalAmount),
    };

    // Verificar autenticación antes de enviar
    const authTokens = localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens'))
      : null;

    if (!authTokens?.access) {
      alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    handleSubmit(saleData);
  };

  return (
    <div style={styles.formCard}>
      <h2 style={styles.formTitle}>Crear Nueva Venta</h2>
      <form onSubmit={handleFormSubmit} style={styles.form}>
        <div>
          <label htmlFor="cliente" style={styles.label}>
            Cliente *
          </label>
          <select
            id="cliente"
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            style={{
              ...styles.select,
              borderColor: errors.cliente ? 'red' : '#ccc',
            }}
            required
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.nombre} {client.apellido} (CI: {client.ci})
              </option>
            ))}
          </select>
          {errors.cliente && (
            <span style={styles.errorText}>{errors.cliente}</span>
          )}
        </div>

        <div style={styles.productSelection}>
          <h3 style={styles.sectionTitle}>Agregar Productos</h3>
          <div style={styles.autocompleteContainer}>
            <div style={styles.autocompleteWrapper}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (
                    selectedProduct &&
                    e.target.value !== selectedProduct.nombre
                  ) {
                    setSelectedProduct(null);
                  }
                }}
                onFocus={() => searchTerm && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Buscar producto por nombre o ID..."
                style={styles.autocompleteInput}
              />
              {showSuggestions && filteredProducts.length > 0 && (
                <div style={styles.suggestionsList}>
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      style={styles.suggestionItem}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div style={styles.suggestionInfo}>
                        <span style={styles.suggestionName}>
                          {product.nombre}
                        </span>
                        <span style={styles.suggestionPrice}>
                          ${parseFloat(product.precio).toFixed(2)}
                        </span>
                      </div>
                      <div style={styles.suggestionStock}>
                        Stock: {product.cantidad_disponible}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={currentQuantity}
              onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)}
              style={styles.quantityInput}
              placeholder="Cantidad"
            />
            <button
              type="button"
              onClick={handleAddProduct}
              style={styles.addButton}
              disabled={!searchTerm.trim() || currentQuantity <= 0}
            >
              Agregar
            </button>
          </div>
        </div>

        <div
          style={styles.saleItems}
          key={saleItems.map(i => i.product.id).join('-') + '-' + totalAmount}
        >
          <h3 style={styles.sectionTitle}>Productos en la Venta</h3>
          <div style={styles.itemsList}>
            {saleItems.length === 0 ? (
              <div style={styles.emptyCart}>No hay productos agregados.</div>
            ) : (
              saleItems.map(item => (
                <div key={item.product.id} style={styles.saleItem}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{item.product.nombre}</span>
                    <span style={styles.itemPrice}>
                      ${parseFloat(item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                  <div style={styles.itemControls}>
                    <div style={styles.buttonGroup}>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item.product.id, -1)
                        }
                        style={styles.reduceButton}
                        title="Reducir cantidad en 1"
                      >
                        -
                      </button>
                      <div style={styles.quantityDisplay}>{item.quantity}</div>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.product.id, 1)}
                        style={styles.addButton}
                        title="Aumentar cantidad en 1"
                      >
                        +
                      </button>
                    </div>
                    <span style={styles.itemSubtotal}>
                      Subtotal: ${parseFloat(item.subtotal).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(item.product.id)}
                      style={styles.removeButton}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={styles.totalContainer}>
            <strong style={styles.totalText}>
              Total: ${parseFloat(totalAmount).toFixed(2)}
            </strong>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.submitButton}>
            Crear Venta
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
