from rest_framework import viewsets, filters, status, generics
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q, Sum, Avg
from django.http import HttpResponse
import csv
import io
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from .models import (
    Cliente,
    Categoria,
    Producto,
    Venta,
    DetalleVenta,
    CustomUser,
    ProductoAgotado,
)
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from .serializers import (
    ClienteSerializer,
    CategoriaSerializer,
    ProductoSerializer,
    VentaSerializer,
    VentaCreateSerializer,
    DetalleVentaSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    DevolucionSerializer,
    LogoutSerializer,
    ReporteVentasSerializer,
    ProductoAgotadoSerializer,
)
from rest_framework.pagination import PageNumberPagination
from .permissions import IsAdminOrReadOnly, IsAdminUser, IsVendedorUser, IsGerenteUser


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [
        IsAuthenticated
    ]  # Temporalmente menos restrictivo para debugging
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["ci"]  # Cambiado para buscar solo por CI
    ordering_fields = ["nombre", "apellido", "created_at"]
    ordering = ["apellido", "nombre"]  # Orden por defecto: apellido, luego nombre
    pagination_class = StandardResultsSetPagination

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def check_uniqueness(self, request):
        ci = request.query_params.get("ci")
        telefono = request.query_params.get("telefono")
        client_id = request.query_params.get("client_id")  # Para exclusión en edición

        errors = {}

        if ci:
            queryset = Cliente.objects.filter(ci=ci)
            if client_id:
                queryset = queryset.exclude(id=client_id)
            if queryset.exists():
                errors["ci"] = ["Ya existe un cliente con esta cédula de identidad."]

        if telefono:
            queryset = Cliente.objects.filter(telefono=telefono)
            if client_id:
                queryset = queryset.exclude(id=client_id)
            if queryset.exists():
                errors["telefono"] = [
                    "Ya existe un cliente con este número de teléfono."
                ]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"message": "CI y Teléfono disponibles."}, status=status.HTTP_200_OK
        )


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Permite que usuarios autenticados puedan leer categorías,
        pero solo administradores pueden crear, actualizar o eliminar.
        """
        if self.action in ["list", "retrieve"]:
            # Para lectura (GET), permitir usuarios autenticados
            permission_classes = [IsAuthenticated]
        else:
            # Para escritura (POST, PUT, DELETE), solo administradores
            permission_classes = [IsAdminUser]

        return [permission() for permission in permission_classes]


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(estado=True, cantidad_disponible__gt=0)
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre", "descripcion"]
    ordering_fields = ["nombre", "precio", "cantidad_disponible"]
    ordering = ["nombre"]  # Orden por defecto


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().prefetch_related("detalles", "cliente", "vendedor")
    permission_classes = [IsAuthenticated, IsAdminUser | IsVendedorUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["fecha_venta", "total", "cliente"]
    ordering = ["-fecha_venta"]

    def get_serializer_class(self):
        if self.action == "create":
            return VentaCreateSerializer
        return VentaSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        queryset = Venta.objects.all().prefetch_related(
            "detalles", "cliente", "vendedor"
        )

        # Aplicar filtros de fecha si están presentes
        fecha_inicio = self.request.query_params.get("fecha_inicio")
        fecha_fin = self.request.query_params.get("fecha_fin")

        if fecha_inicio:
            try:
                from datetime import datetime

                fecha_inicio_obj = datetime.strptime(fecha_inicio, "%Y-%m-%d")
                queryset = queryset.filter(
                    fecha_venta__date__gte=fecha_inicio_obj.date()
                )
            except ValueError:
                pass  # Ignorar formato inválido

        if fecha_fin:
            try:
                from datetime import datetime

                fecha_fin_obj = datetime.strptime(fecha_fin, "%Y-%m-%d")
                queryset = queryset.filter(fecha_venta__date__lte=fecha_fin_obj.date())
            except ValueError:
                pass  # Ignorar formato inválido

        # Aplicar filtro por ID si está presente
        venta_id = self.request.query_params.get("venta_id")
        if venta_id:
            try:
                venta_id_int = int(venta_id)
                queryset = queryset.filter(id=venta_id_int)
            except ValueError:
                pass  # Ignorar ID inválido

        return queryset

    def list(self, request, *args, **kwargs):
        # Permitir GET para consultar ventas
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        # Usar el serializer específico para creación
        return super().create(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        # Permitir GET individual para consultar una venta específica
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # Bloquear PUT/PATCH - ventas inmutables
        return Response(
            {"detail": "Las ventas no se pueden modificar una vez creadas."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        # Bloquear PATCH - ventas inmutables
        return Response(
            {"detail": "Las ventas no se pueden modificar una vez creadas."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        # Bloquear DELETE - ventas inmutables
        return Response(
            {"detail": "Las ventas no se pueden eliminar."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsAdminUser | IsGerenteUser],
    )
    def devolver_productos(self, request, pk=None):
        """
        Acción personalizada para devolver productos de una venta específica.
        Solo accesible para administradores y gerentes.
        """
        try:
            venta = self.get_object()
        except Venta.DoesNotExist:
            return Response(
                {"detail": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND
            )

        # Validar datos de entrada
        serializer = DevolucionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        productos_a_devolver = serializer.validated_data["productos"]

        with transaction.atomic():
            productos_devueltos = []

            for item in productos_a_devolver:
                producto = item["producto"]
                cantidad_devolver = item["cantidad"]

                # Verificar que la cantidad a devolver no exceda la cantidad vendida
                try:
                    detalle_venta = venta.detalles.get(producto=producto)
                    if detalle_venta.cantidad < cantidad_devolver:
                        raise serializers.ValidationError(
                            f"No se pueden devolver {cantidad_devolver} unidades de {producto.nombre}. "
                            f"Solo se vendieron {detalle_venta.cantidad} unidades."
                        )
                except DetalleVenta.DoesNotExist:
                    raise serializers.ValidationError(
                        f"El producto {producto.nombre} no está en esta venta."
                    )

                # Incrementar inventario usando select_for_update para atomicidad
                producto_actualizado = Producto.objects.select_for_update().get(
                    id=producto.id
                )
                producto_actualizado.cantidad_disponible += cantidad_devolver

                # Si el producto vuelve a tener stock disponible, reactivarlo
                if producto_actualizado.cantidad_disponible > 0:
                    producto_actualizado.estado = True

                producto_actualizado.save()

                productos_devueltos.append(
                    {
                        "producto_id": producto.id,
                        "producto_nombre": producto.nombre,
                        "cantidad_devuelta": cantidad_devolver,
                    }
                )

            # Crear registro de auditoría (opcional)
            # Aquí podrías crear un modelo Devolucion si lo necesitas

            return Response(
                {
                    "message": "Devolución procesada exitosamente",
                    "venta_id": venta.id,
                    "productos_devueltos": productos_devueltos,
                    "total_productos_devueltos": len(productos_devueltos),
                },
                status=status.HTTP_200_OK,
            )


class DetalleVentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DetalleVenta.objects.all().select_related("venta", "producto")
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsVendedorUser]


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="fecha_inicio",
            type=str,
            description="Fecha de inicio (DD/MM/YYYY)",
            required=False,
        ),
        OpenApiParameter(
            name="fecha_fin",
            type=str,
            description="Fecha de fin (DD/MM/YYYY)",
            required=False,
        ),
        OpenApiParameter(
            name="formato",
            type=str,
            description="Formato del reporte (csv o pdf)",
            required=False,
            enum=["csv", "pdf"],
        ),
    ],
    responses={
        200: {
            "content": {
                "text/csv": {"schema": {"type": "string", "format": "binary"}},
                "application/pdf": {"schema": {"type": "string", "format": "binary"}},
            }
        }
    },
    summary="Generar reporte de ventas con filtros de fecha",
    description="Permite a administradores y gerentes generar reportes de ventas en formato CSV o PDF, filtrando por rango de fechas.",
)
class ReporteVentasView(APIView):
    """
    Endpoint para generar reportes de ventas con filtros de fecha.
    Solo accesible para administradores.
    """

    permission_classes = [IsAdminUser | IsGerenteUser]
    serializer_class = (
        ReporteVentasSerializer  # Añadir el serializador para la documentación
    )

    def get(self, request):
        # Obtener parámetros de consulta
        fecha_inicio = request.query_params.get("fecha_inicio")
        fecha_fin = request.query_params.get("fecha_fin")
        formato = request.query_params.get("formato", "csv")  # csv o pdf

        # Construir filtros de fecha
        filtros = Q()
        if fecha_inicio:
            try:
                fecha_inicio_obj = datetime.strptime(fecha_inicio, "%d/%m/%Y")
                filtros &= Q(fecha_venta__date__gte=fecha_inicio_obj.date())
            except ValueError:
                return Response(
                    {"error": "Formato de fecha_inicio inválido. Use DD/MM/YYYY"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if fecha_fin:
            try:
                fecha_fin_obj = datetime.strptime(fecha_fin, "%d/%m/%Y")
                filtros &= Q(fecha_venta__date__lte=fecha_fin_obj.date())
            except ValueError:
                return Response(
                    {"error": "Formato de fecha_fin inválido. Use DD/MM/YYYY"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Consultar ventas con filtros aplicados
        ventas = (
            Venta.objects.filter(filtros)
            .prefetch_related("detalles", "cliente", "vendedor")
            .order_by("fecha_venta")
        )

        if formato.lower() == "csv":
            return self.generar_csv(ventas)
        elif formato.lower() == "pdf":
            return self.generar_pdf(ventas)
        else:
            return Response(
                {"error": "Formato no soportado. Use 'csv' o 'pdf'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def generar_csv(self, ventas):
        """Genera archivo CSV con el reporte de ventas"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Encabezados
        writer.writerow(
            [
                "ID Venta",
                "Cliente",
                "Vendedor",
                "Fecha Venta",
                "Total",
                "Producto",
                "Cantidad",
                "Precio Unitario",
                "Subtotal",
            ]
        )

        # Datos de ventas
        for venta in ventas:
            for detalle in venta.detalles.all():
                writer.writerow(
                    [
                        venta.id,
                        f"{venta.cliente.nombre} {venta.cliente.apellido}",
                        venta.vendedor.username,
                        venta.fecha_venta.strftime("%Y-%m-%d %H:%M:%S"),
                        f"${venta.total}",
                        detalle.producto.nombre,
                        detalle.cantidad,
                        f"${detalle.precio_unitario}",
                        f"${detalle.subtotal}",
                    ]
                )

        # Crear response con archivo CSV
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


# ========== DASHBOARD ENDPOINTS ==========


class DashboardTotalInventoryView(APIView):
    """Vista para obtener el total de productos en inventario"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        from django.db.models import Sum

        total_inventory = (
            Producto.objects.aggregate(total=Sum("cantidad_disponible"))["total"] or 0
        )

        # Calcular tendencia (comparación con el día anterior)
        from datetime import date, timedelta

        yesterday = date.today() - timedelta(days=1)

        # Esta es una simplificación - en producción calcularías la tendencia real
        trend = 0  # Por ahora 0, implementar lógica de tendencia después

        return Response({"total": total_inventory, "trend": trend})


class DashboardLowStockView(APIView):
    """Vista para obtener productos con stock crítico"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        # Umbral de stock bajo (configurable)
        low_stock_threshold = 5

        low_stock_products = (
            Producto.objects.filter(
                cantidad_disponible__lte=low_stock_threshold, estado=True
            )
            .select_related("categoria")
            .order_by("cantidad_disponible")
        )

        products_data = []
        for producto in low_stock_products:
            products_data.append(
                {
                    "id": producto.id,
                    "nombre": producto.nombre,
                    "categoria": producto.categoria.nombre,
                    "cantidad_disponible": producto.cantidad_disponible,
                    "precio": str(producto.precio),
                }
            )

        return Response({"products": products_data, "count": len(products_data)})


class DashboardDailySalesView(APIView):
    """Vista para obtener ventas del día actual"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        from django.db.models import Sum, Count
        from datetime import date, timedelta

        today = date.today()

        daily_sales = Venta.objects.filter(fecha_venta__date=today).aggregate(
            total_amount=Sum("total"), total_count=Count("id")
        )

        # Calcular tendencia comparando con el día anterior
        yesterday = today - timedelta(days=1)
        yesterday_sales = (
            Venta.objects.filter(fecha_venta__date=yesterday).aggregate(
                total=Sum("total")
            )["total"]
            or 0
        )

        current_amount = daily_sales["total_amount"] or 0
        trend = 0
        if yesterday_sales > 0:
            trend = ((current_amount - yesterday_sales) / yesterday_sales) * 100

        return Response(
            {
                "amount": current_amount,
                "count": daily_sales["total_count"] or 0,
                "trend": round(trend, 2),
            }
        )


class DashboardSalesTrendView(APIView):
    """Vista para obtener tendencia de ventas de los últimos 30 días"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        from datetime import date, timedelta
        from django.db.models import Sum

        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        # Crear datos para los últimos 30 días
        data = []
        labels = []

        for i in range(30):
            current_date = start_date + timedelta(days=i)
            next_date = current_date + timedelta(days=1)

            day_sales = (
                Venta.objects.filter(
                    fecha_venta__date__gte=current_date, fecha_venta__date__lt=next_date
                ).aggregate(total=Sum("total"))["total"]
                or 0
            )

            data.append(float(day_sales))
            labels.append(current_date.strftime("%d/%m"))

        return Response({"data": data, "labels": labels})


class DashboardCategoryDistributionView(APIView):
    """Vista para obtener distribución de inventario por categoría"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        from django.db.models import Sum

        categories_data = []

        # Obtener todas las categorías con su conteo de productos
        categories = Categoria.objects.annotate(
            total_products=Sum("producto__cantidad_disponible")
        ).filter(total_products__gt=0)

        for categoria in categories:
            categories_data.append(
                {"categoria": categoria.nombre, "total": categoria.total_products or 0}
            )

        return Response(categories_data)


class DashboardTopProductsView(APIView):
    """Vista para obtener top 5 productos más vendidos"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        from django.db.models import Sum

        # Obtener productos ordenados por cantidad vendida
        top_products = (
            Producto.objects.annotate(total_vendido=Sum("detalleventa__cantidad"))
            .filter(total_vendido__gt=0)
            .order_by("-total_vendido")[:5]
        )

        products_data = []
        quantities_data = []

        for producto in top_products:
            products_data.append(producto.nombre)
            quantities_data.append(producto.total_vendido or 0)

        return Response({"products": products_data, "quantities": quantities_data})


class DashboardRecentSalesView(APIView):
    """Vista para obtener las últimas 10 ventas"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsVendedorUser]

    def get(self, request):
        recent_sales = (
            Venta.objects.select_related("cliente", "vendedor")
            .prefetch_related("detalles")
            .order_by("-fecha_venta")[:10]
        )

        sales_data = []

        for venta in recent_sales:
            productos = []
            for detalle in venta.detalles.all():
                productos.append(
                    {
                        "nombre": detalle.producto.nombre,
                        "cantidad": detalle.cantidad,
                        "precio_unitario": str(detalle.precio_unitario),
                    }
                )

            sales_data.append(
                {
                    "id": venta.id,
                    "cliente": f"{venta.cliente.nombre} {venta.cliente.apellido}",
                    "vendedor": venta.vendedor.username,
                    "fecha_venta": venta.fecha_venta.strftime("%Y-%m-%d %H:%M:%S"),
                    "total": str(venta.total),
                    "productos": productos,
                }
            )

        return Response(sales_data)


class VentasDelDiaView(APIView):
    """Vista para obtener ventas del día actual con filtros opcionales"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsVendedorUser]

    def get(self, request):
        # Obtener fecha del día actual
        fecha_hoy = request.query_params.get("fecha")
        if not fecha_hoy:
            from datetime import date

            fecha_hoy = date.today().isoformat()

        # Obtener filtros opcionales
        usuario_id = request.query_params.get("usuario_id")

        try:
            from datetime import datetime, date

            fecha_actual = datetime.fromisoformat(fecha_hoy).date()
            fecha_siguiente = fecha_actual + timedelta(days=1)

            # Construir queryset base
            queryset = (
                Venta.objects.filter(
                    fecha_venta__date__gte=fecha_actual,
                    fecha_venta__date__lt=fecha_siguiente,
                )
                .select_related("cliente", "vendedor")
                .prefetch_related("detalles")
            )

            # Aplicar filtro por usuario si está presente
            if usuario_id:
                queryset = queryset.filter(vendedor_id=usuario_id)

            # Ejecutar consulta
            ventas = queryset.order_by("-fecha_venta")

            # Serializar datos
            ventas_data = []
            for venta in ventas:
                productos = []
                for detalle in venta.detalles.all():
                    productos.append(
                        {
                            "producto": {
                                "id": detalle.producto.id,
                                "nombre": detalle.producto.nombre,
                            },
                            "cantidad": detalle.cantidad,
                            "precio_unitario": str(detalle.precio_unitario),
                            "subtotal": str(detalle.subtotal),
                        }
                    )

                ventas_data.append(
                    {
                        "id": venta.id,
                        "cliente": (
                            {
                                "id": venta.cliente.id,
                                "nombre": venta.cliente.nombre,
                                "apellido": venta.cliente.apellido,
                            }
                            if venta.cliente
                            else None
                        ),
                        "vendedor": (
                            venta.vendedor.username if venta.vendedor else "N/A"
                        ),
                        "fecha_venta": venta.fecha_venta.isoformat(),
                        "total": str(venta.total),
                        "detalles": productos,
                    }
                )

            return Response(
                {"results": ventas_data, "count": len(ventas_data), "fecha": fecha_hoy}
            )

        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProductoAgotadoViewSet(viewsets.ModelViewSet):
    """ViewSet para productos agotados"""

    queryset = ProductoAgotado.objects.all().select_related(
        "producto", "producto__categoria"
    )
    serializer_class = ProductoAgotadoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["fecha_agotado", "tiempo_vida", "cantidad_vendida"]
    ordering = ["-fecha_agotado"]

    def perform_create(self, serializer):
        """Crear registro de producto agotado con fecha automática"""
        serializer.save()


class ProductoAgotadoReportePDFView(APIView):
    """Vista para generar reporte PDF de productos agotados"""

    permission_classes = [IsAuthenticated, IsAdminUser | IsGerenteUser]

    def get(self, request):
        """Genera reporte PDF de productos agotados y tendencias"""
        productos_agotados = ProductoAgotado.objects.all().select_related(
            "producto", "producto__categoria"
        )

        if not productos_agotados.exists():
            return Response(
                {"error": "No hay productos agotados registrados"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Crear buffer para el PDF
        buffer = io.BytesIO()

        # Crear documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        # Título
        titulo = Paragraph(
            "Reporte de Productos Agotados y Tendencias - Joyería Trebol",
            styles["Title"],
        )
        elements.append(titulo)
        elements.append(Spacer(1, 20))

        # Resumen estadístico
        total_productos = productos_agotados.count()
        tiempo_promedio = (
            productos_agotados.aggregate(avg=Avg("tiempo_vida"))["avg"] or 0
        )

        resumen_data = [
            ["Total de Productos Agotados:", str(total_productos)],
            ["Tiempo Promedio de Vida (días):", f"{tiempo_promedio:.1f}"],
            ["Fecha de Generación:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ]

        resumen_table = Table(resumen_data)
        resumen_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.grey),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 14),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (1, 0), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(resumen_table)
        elements.append(Spacer(1, 20))

        # Datos de productos agotados
        headers = [
            "Producto",
            "Categoría",
            "Fecha Inicio",
            "Fecha Agotado",
            "Cantidad Inicial",
            "Cantidad Vendida",
            "Tiempo de Vida (días)",
        ]

        data = [headers]

        for producto_agotado in productos_agotados:
            data.append(
                [
                    producto_agotado.producto.nombre,
                    producto_agotado.producto.categoria.nombre,
                    producto_agotado.fecha_inicio.strftime("%Y-%m-%d"),
                    producto_agotado.fecha_agotado.strftime("%Y-%m-%d"),
                    str(producto_agotado.cantidad_inicial),
                    str(producto_agotado.cantidad_vendida),
                    str(producto_agotado.tiempo_vida or 0),
                ]
            )

        # Crear tabla
        table = Table(data)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(table)

        # Construir PDF
        doc.build(elements)

        # Crear response con archivo PDF
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        filename = (
            f"reporte_productos_agotados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


class TestAuthView(APIView):
    """Vista de prueba para verificar autenticación"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "message": "Autenticación exitosa",
                "user": request.user.username,
                "user_id": request.user.id,
                "is_authenticated": request.user.is_authenticated,
            }
        )


class UserRegistrationView(generics.CreateAPIView):
    """Vista para el registro de nuevos usuarios"""

    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Vista para ver y actualizar el perfil del usuario"""

    queryset = CustomUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para usuarios - solo lectura para el selector de informes"""

    queryset = CustomUser.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsVendedorUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["username", "first_name", "last_name", "role"]
    ordering = ["username"]


class ChangePasswordView(generics.UpdateAPIView):
    """Vista para cambiar la contraseña"""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verificar contraseña antigua
        if not user.check_password(serializer.data.get("old_password")):
            return Response(
                {"old_password": ["La contraseña actual es incorrecta."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Establecer nueva contraseña
        user.set_password(serializer.data.get("new_password"))
        user.save()

        return Response(
            {"status": "contraseña actualizada con éxito"}, status=status.HTTP_200_OK
        )


@extend_schema(
    request=LogoutSerializer,
    responses={205: None, 400: None},
    summary="Cerrar sesión de usuario",
    description="Invalida el token de refresco JWT, cerrando la sesión del usuario.",
)
class LogoutView(APIView):
    """Vista para el logout de usuarios"""

    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer  # Añadir el serializador para la documentación

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def generar_pdf(self, ventas):
        """Genera archivo PDF con el reporte de ventas"""

        # Crear buffer para el PDF
        buffer = io.BytesIO()

        # Crear documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        # Título
        titulo = Paragraph("Reporte de Ventas - Joyería Trebol", styles["Title"])
        elements.append(titulo)
        elements.append(Spacer(1, 20))

        # Resumen
        total_ventas = ventas.count()
        total_monto = ventas.aggregate(total=Sum("total"))["total"] or 0

        resumen_data = [
            ["Total de Ventas:", str(total_ventas)],
            ["Monto Total:", f"${total_monto:.2f}"],
            ["Fecha de Generación:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ]

        resumen_table = Table(resumen_data)
        resumen_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.grey),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 14),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (1, 0), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )

        elements.append(resumen_table)
        elements.append(Spacer(1, 20))

        # Datos de ventas
        if ventas.exists():
            # Encabezados de tabla
            headers = ["ID", "Cliente", "Vendedor", "Fecha", "Total", "Productos"]

            # Datos de las ventas
            data = [headers]

            for venta in ventas:
                productos = ", ".join(
                    [
                        f"{detalle.producto.nombre}({detalle.cantidad})"
                        for detalle in venta.detalles.all()
                    ]
                )

                data.append(
                    [
                        str(venta.id),
                        f"{venta.cliente.nombre} {venta.cliente.apellido}",
                        venta.vendedor.username,
                        venta.fecha_venta.strftime("%Y-%m-%d %H:%M"),
                        f"${venta.total:.2f}",
                        productos[:50] + "..." if len(productos) > 50 else productos,
                    ]
                )

            # Crear tabla
            table = Table(data)
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 12),
                        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                        ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ]
                )
            )

            elements.append(table)

        # Construir PDF
        doc.build(elements)

        # Crear response con archivo PDF
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        filename = f"reporte_ventas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response
