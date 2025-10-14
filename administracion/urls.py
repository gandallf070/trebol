from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet, CategoriaViewSet, ProductoViewSet,
    VentaViewSet, DetalleVentaViewSet, ReporteVentasView,
    UserRegistrationView, UserProfileView, ChangePasswordView,
    LogoutView, ProductoAgotadoViewSet, ProductoAgotadoReportePDFView,
    VentasDelDiaView, UserViewSet,
    # Dashboard views
    DashboardTotalInventoryView, DashboardLowStockView, DashboardDailySalesView,
    DashboardSalesTrendView, DashboardCategoryDistributionView,
    DashboardTopProductsView, DashboardRecentSalesView, TestAuthView,
    # PDF views
    InformeDiarioPDFView, InformeMensualPDFView,
    # Admin views
    AdminAuthView, UserManagementViewSet
)

router = DefaultRouter()
router.register(r'clients', ClienteViewSet)
router.register(r'inventario/categories', CategoriaViewSet)
router.register(r'inventario/products', ProductoViewSet)
router.register(r'sales', VentaViewSet)
router.register(r'sales-details', DetalleVentaViewSet)
router.register(r'productos-agotados', ProductoAgotadoViewSet)
router.register(r'users', UserViewSet)
router.register(r'admin/users', UserManagementViewSet, basename='admin-users')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/sales/', ReporteVentasView.as_view(), name='reporte-ventas'),
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('admin/auth/', AdminAuthView.as_view(), name='admin-auth'),

    # Dashboard endpoints
    path('reports/dashboard/total-inventory/', DashboardTotalInventoryView.as_view(), name='dashboard-total-inventory'),
    path('reports/dashboard/low-stock/', DashboardLowStockView.as_view(), name='dashboard-low-stock'),
    path('reports/dashboard/daily-sales/', DashboardDailySalesView.as_view(), name='dashboard-daily-sales'),
    path('reports/dashboard/sales-trend/', DashboardSalesTrendView.as_view(), name='dashboard-sales-trend'),
    path('reports/dashboard/category-distribution/', DashboardCategoryDistributionView.as_view(), name='dashboard-category-distribution'),
    path('reports/dashboard/top-products/', DashboardTopProductsView.as_view(), name='dashboard-top-products'),
    path('reports/dashboard/recent-sales/', DashboardRecentSalesView.as_view(), name='dashboard-recent-sales'),
    path('productos-agotados-pdf/', ProductoAgotadoReportePDFView.as_view(), name='productos-agotados-pdf'),
    path('informe-diario-pdf/', InformeDiarioPDFView.as_view(), name='informe-diario-pdf'),
    path('informe-mensual-pdf/', InformeMensualPDFView.as_view(), name='informe-mensual-pdf'),
    path('ventas-del-dia/', VentasDelDiaView.as_view(), name='ventas-del-dia'),
    path('test-auth/', TestAuthView.as_view(), name='test-auth'),
]
