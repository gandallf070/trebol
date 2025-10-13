const menuConfig = [
  { name: 'Panel', path: '/', roles: ['admin', 'vendedor', 'gerente', 'guest'] },
  { name: 'Clientes', path: '/clientes', roles: ['admin', 'vendedor', 'gerente', 'guest'] },
  { name: 'Productos', path: '/inventario/productos', roles: ['admin', 'gerente'] },

  { name: 'Categorías', path: '/inventario/categorias', roles: ['admin'] },
  { name: 'Ventas', path: '/ventas', roles: ['admin', 'vendedor', 'gerente', 'guest'] },
  { name: 'Reportes', path: '/reportes', roles: ['admin', 'gerente', 'guest'] },
];

export default menuConfig;
