# Entities and Services Summary

This document provides a summary of the entities and services defined in the `JoyeriaTrebol_API_Collection.postman_collection.json` file.

## Entities

- **Clientes (Clients):**
  - `ci` (string)
  - `nombre` (string)
  - `apellido` (string)
  - `telefono` (string)

- **Categorías (Categories):**
  - `nombre` (string)
  - `descripcion` (string)

- **Productos (Products):**
  - `nombre` (string)
  - `descripcion` (string)
  - `categoria` (integer, foreign key to Categories)
  - `precio` (number)
  - `cantidad_disponible` (integer)

- **Ventas (Sales):**
  - `cliente_id` (integer, foreign key to Clients)
  - `detalles` (array of objects):
    - `producto_id` (integer, foreign key to Products)
    - `cantidad` (integer)

## Services (API Endpoints)

- **Autenticación JWT (JWT Authentication):**
  - `POST /api/token/`: Obtain admin and seller tokens.
  - `POST /api/token/refresh/`: Refresh an expired token.

- **Gestión de Clientes (Client Management):**
  - `GET /api/clients/`: List all clients.
  - `POST /api/clients/`: Create a new client.
  - `GET /api/clients/?search={ci}`: Search for a client by their CI.

- **Gestión de Categorías (Category Management - Admin Only):**
  - `GET /api/inventario/categories/`: List all categories.
  - `POST /api/inventario/categories/`: Create a new category.

- **Gestión de Productos (Product Management):**
  - `GET /api/inventario/products/`: List all products (accessible to all users).
  - `POST /api/inventario/products/`: Create a new product (admin only).

- **Sistema de Ventas (Sales System):**
  - `POST /api/sales/`: Create a new sale.
  - `GET /api/sales/`: List all sales.
  - `GET /api/sales/{id}/`: View the details of a specific sale.

- **Reportes (Reports - Admin Only):**
  - `GET /api/reports/sales/?formato=csv`: Generate a sales report in CSV format.
  - `GET /api/reports/sales/?formato=pdf`: Generate a sales report in PDF format.
  - `GET /api/reports/sales/?formato=csv&fecha_inicio={date}&fecha_fin={date}`: Generate a filtered sales report by date.

- **Pruebas de Seguridad y Excepciones (Security and Exception Tests):**
  - Includes tests for unauthorized access, handling of non-existent clients/products, insufficient stock, and attempts to modify/delete sales.
