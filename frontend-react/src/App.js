import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './hoc/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './modules/home/pages/HomePage';
import ClientsPage from './modules/clients/pages/ClientsPage';
import ProductsPage from './modules/products/pages/ProductsPage';
import CategoriesPage from './modules/categories/pages/CategoriesPage';
import SalesPage from './modules/sales/pages/SalesPage';
import ReportsPage from './modules/reports/pages/ReportsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <RootLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="inventario/productos" element={<ProductsPage />} />
            <Route path="inventario/categorias" element={<CategoriesPage />} />
            <Route path="ventas" element={<SalesPage />} />
            <Route path="reportes" element={<ReportsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
