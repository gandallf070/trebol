import React from 'react';
import { Route } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';

const productsRoutes = (
  <Route path="inventario/productos" element={<ProductsPage />} />
);

export default productsRoutes;
