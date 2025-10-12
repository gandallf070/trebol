import React from 'react';
import { Route } from 'react-router-dom';
import ProductosAgotadosPage from './pages/ProductosAgotadosPage';

const productosAgotadosRoutes = (
  <Route path="productos-agotados" element={<ProductosAgotadosPage />} />
);

export default productosAgotadosRoutes;
