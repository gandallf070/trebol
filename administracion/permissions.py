from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con el rol de Administrador.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

class IsVendedorUser(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con el rol de Vendedor.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_vendedor

class IsGerenteUser(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con el rol de Gerente.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_gerente

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite operaciones CRUD al Administrador y solo lectura a otros usuarios autenticados.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.is_admin
