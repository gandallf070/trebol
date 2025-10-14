import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Table, Badge } from 'react-bootstrap';
import { FaUserPlus, FaUserEdit, FaUserTimes, FaKey, FaUsers } from 'react-icons/fa';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para modales
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados para formularios
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'vendedor',
    telefono: '',
    password: ''
  });

  // Estados de carga para acciones
  const [authLoading, setAuthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log('[FRONTEND] AdminPage - Component mounted, loading users...');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('[FRONTEND] AdminPage - Starting to load users...');
      setLoading(true);

      // Log current auth state
      const authTokens = localStorage.getItem('authTokens');
      console.log('[FRONTEND] AdminPage - Auth tokens in localStorage:', authTokens ? 'Present' : 'Not found');

      if (authTokens) {
        const parsedTokens = JSON.parse(authTokens);
        console.log('[FRONTEND] AdminPage - Access token present:', !!parsedTokens.access);
        console.log('[FRONTEND] AdminPage - Refresh token present:', !!parsedTokens.refresh);
        
        // Decodificar el token para ver qué usuario está autenticado
        try {
          const tokenPayload = JSON.parse(atob(parsedTokens.access.split('.')[1]));
          console.log('[FRONTEND] AdminPage - Token payload:', tokenPayload);
          console.log('[FRONTEND] AdminPage - Authenticated user ID:', tokenPayload.user_id);
          console.log('[FRONTEND] AdminPage - Token username:', tokenPayload.username);
        } catch (e) {
          console.log('[FRONTEND] AdminPage - Could not decode token:', e);
        }
      }

      console.log('[FRONTEND] AdminPage - Making API call to /admin/users/');
      const response = await api.get('/admin/users/');
      console.log('[FRONTEND] AdminPage - API response received:', response);
      console.log('[FRONTEND] AdminPage - Response status:', response.status);
      console.log('[FRONTEND] AdminPage - Response data:', response.data);
      console.log('[FRONTEND] AdminPage - Response data type:', typeof response.data);
      console.log('[FRONTEND] AdminPage - Response data is array:', Array.isArray(response.data));

      // Manejar respuesta paginada
      const usersData = response.data.results || response.data;
      console.log('[FRONTEND] AdminPage - Users data extracted:', usersData);
      console.log('[FRONTEND] AdminPage - Users data is array:', Array.isArray(usersData));
      
      setUsers(usersData);
      console.log('[FRONTEND] AdminPage - Users state updated successfully');
    } catch (error) {
      console.error('[FRONTEND] AdminPage - Error loading users:', error);
      console.error('[FRONTEND] AdminPage - Error response:', error.response);
      console.error('[FRONTEND] AdminPage - Error status:', error.response?.status);
      console.error('[FRONTEND] AdminPage - Error data:', error.response?.data);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
      console.log('[FRONTEND] AdminPage - Loading state set to false');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await api.post('/admin/auth/', { admin_password: adminPassword });
      setShowAuthModal(false);
      setAdminPassword('');
      setSuccess('Autenticación exitosa');
      // Aquí puedes proceder con la acción que requería autenticación
    } catch (error) {
      setError('Contraseña de administrador incorrecta');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const userData = { ...userForm, admin_password: adminPassword };
      await api.post('/admin/users/', userData);
      setShowCreateModal(false);
      setUserForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'vendedor',
        telefono: '',
        password: ''
      });
      setAdminPassword('');
      setSuccess('Usuario creado exitosamente');
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Verificar qué usuario está autenticado antes de hacer la petición
      const authTokens = localStorage.getItem('authTokens');
      if (authTokens) {
        const parsedTokens = JSON.parse(authTokens);
        try {
          const tokenPayload = JSON.parse(atob(parsedTokens.access.split('.')[1]));
          console.log('[FRONTEND] AdminPage - Update - Token payload:', tokenPayload);
          console.log('[FRONTEND] AdminPage - Update - Authenticated user ID:', tokenPayload.user_id);
          console.log('[FRONTEND] AdminPage - Update - Token username:', tokenPayload.username);
        } catch (e) {
          console.log('[FRONTEND] AdminPage - Update - Could not decode token:', e);
        }
      }
      
      const userData = { ...userForm, admin_password: adminPassword };
      console.log('[FRONTEND] AdminPage - Update user data:', userData);
      console.log('[FRONTEND] AdminPage - Selected user ID:', selectedUser.id);
      console.log('[FRONTEND] AdminPage - Admin password provided:', !!adminPassword);
      console.log('[FRONTEND] AdminPage - Admin password value:', adminPassword);
      console.log('[FRONTEND] AdminPage - Admin password length:', adminPassword?.length);
      console.log('[FRONTEND] AdminPage - User password value:', userForm.password);
      console.log('[FRONTEND] AdminPage - User password length:', userForm.password?.length);
      
      const response = await api.patch(`/admin/users/${selectedUser.id}/`, userData);
      console.log('[FRONTEND] AdminPage - Update response:', response);
      
      setShowEditModal(false);
      setSelectedUser(null);
      setUserForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'vendedor',
        telefono: '',
        password: ''
      });
      setAdminPassword('');
      setSuccess('Usuario actualizado exitosamente');
      loadUsers();
    } catch (error) {
      console.error('[FRONTEND] AdminPage - Update error:', error);
      console.error('[FRONTEND] AdminPage - Update error response:', error.response);
      console.error('[FRONTEND] AdminPage - Update error status:', error.response?.status);
      console.error('[FRONTEND] AdminPage - Update error data:', error.response?.data);
      setError(error.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}/`, {
        data: { admin_password: adminPassword }
      });
      setShowDeleteModal(false);
      setSelectedUser(null);
      setAdminPassword('');
      setSuccess('Usuario eliminado exitosamente');
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      telefono: user.telefono || '',
      password: '' // No mostrar contraseña existente
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'gerente': return 'warning';
      case 'vendedor': return 'success';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'vendedor': return 'Vendedor';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2><FaUsers className="me-2" />Panel de Administración de Usuarios</h2>
          <p className="text-muted">Gestiona usuarios del sistema con permisos de administrador</p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-3">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Usuarios del Sistema</h5>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaUserPlus className="me-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <strong>{user.username}</strong>
                            <br />
                            <small className="text-muted">
                              {user.first_name} {user.last_name}
                            </small>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={getRoleBadgeVariant(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td>
                          {new Date(user.fecha_creacion).toLocaleDateString('es-ES')}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => openEditModal(user)}
                          >
                            <FaUserEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            disabled={user.id === selectedUser?.id}
                          >
                            <FaUserTimes />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        {loading ? 'Cargando usuarios...' : 'No hay usuarios disponibles'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Autenticación de Admin */}
      <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Verificación de Administrador</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAuthSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña de Administrador</Form.Label>
              <Form.Control
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Ingrese su contraseña de administrador"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAuthModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Verificando...' : 'Verificar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Crear Usuario */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usuario *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.telefono}
                    onChange={(e) => setUserForm({...userForm, telefono: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña *</Form.Label>
              <Form.Control
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña de Administrador *</Form.Label>
              <Form.Control
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Confirme su identidad de administrador"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usuario *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.telefono}
                    onChange={(e) => setUserForm({...userForm, telefono: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Nueva Contraseña (opcional)</Form.Label>
              <Form.Control
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="Dejar vacío para mantener la contraseña actual"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña de Administrador *</Form.Label>
              <Form.Control
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Ingrese la contraseña del usuario admin (password)"
                required
              />
              <Form.Text className="text-muted">
                La contraseña del usuario administrador es: <strong>password</strong>
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Actualizando...' : 'Actualizar Usuario'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Eliminar Usuario */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Está seguro de que desea eliminar al usuario <strong>{selectedUser?.username}</strong>?</p>
          <p className="text-danger">Esta acción no se puede deshacer.</p>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña de Administrador *</Form.Label>
            <Form.Control
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Confirme su identidad de administrador"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser} disabled={actionLoading}>
            {actionLoading ? 'Eliminando...' : 'Eliminar Usuario'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPage;
