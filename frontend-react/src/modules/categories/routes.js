import React from 'react';
import { Route } from 'react-router-dom';
import CategoriesPage from './pages/CategoriesPage';

const categoriesRoutes = (
  <Route path="inventario/categorias" element={<CategoriesPage />} />
);

export default categoriesRoutes;
