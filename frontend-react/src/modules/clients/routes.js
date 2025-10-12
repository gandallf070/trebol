import React from 'react';
import { Route } from 'react-router-dom';
import ClientsPage from './pages/ClientsPage';

const clientsRoutes = (
  <Route path="clientes" element={<ClientsPage />} />
);

export default clientsRoutes;
