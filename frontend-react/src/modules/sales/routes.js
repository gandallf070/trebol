import React from 'react';
import { Route } from 'react-router-dom';
import SalesPage from './pages/SalesPage';

const salesRoutes = (
  <Route path="ventas" element={<SalesPage />} />
);

export default salesRoutes;
