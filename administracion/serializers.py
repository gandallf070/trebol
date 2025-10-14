from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Cliente, Categoria, Producto, Venta, DetalleVenta, CustomUser, ProductoAgotado

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField()

    class Meta:
        model = DetalleVenta
        fields = ['producto', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['precio_unitario', 'subtotal']

class DetalleVentaCreateSerializer(serializers.ModelSerializer):
    producto_id = serializers.IntegerField()

    class Meta:
        model = DetalleVenta
        fields = ['producto_id', 'cantidad']

class VentaCreateSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaCreateSerializer(many=True)
    cliente_id = serializers.IntegerField()

    class Meta:
        model = Venta
        fields = ['cliente_id', 'detalles']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        cliente_id = validated_data.pop('cliente_id')

        with transaction.atomic():
            # Verificar que el cliente existe
            try:
                cliente = Cliente.objects.get(id=cliente_id)
            except Cliente.DoesNotExist:
                raise serializers.ValidationError({"cliente_id": "Cliente no encontrado."})

            # Crear la venta
            venta = Venta.objects.create(
                cliente=cliente,
                vendedor=self.context['request'].user
            )

            total = 0

            # Crear los detalles y actualizar inventario
            for detalle_data in detalles_data:
                try:
                    producto = Producto.objects.select_for_update().get(
                        id=detalle_data['producto_id']
                    )
                except Producto.DoesNotExist:
                    raise serializers.ValidationError(
                        {"detalles": [f"Producto con ID {detalle_data['producto_id']} no encontrado."]}
                    )

                cantidad = detalle_data['cantidad']

                # Validar stock disponible
                if producto.cantidad_disponible < cantidad:
                    raise serializers.ValidationError(
                        f"No hay suficiente stock para {producto.nombre}. "
                        f"Disponible: {producto.cantidad_disponible}, Solicitado: {cantidad}"
                    )

                # Crear detalle de venta con precio actual
                detalle = DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=producto.precio,
                    subtotal=producto.precio * cantidad
                )

                # Reducir inventario
                producto.cantidad_disponible -= cantidad

                # Si el producto llega a cero, cambiar estado y crear registro de agotado
                if producto.cantidad_disponible == 0:
                    producto.estado = False

                    # Crear registro de producto agotado
                    ProductoAgotado.objects.create(
                        producto=producto,
                        cantidad_inicial=producto.cantidad_disponible + cantidad,  # Cantidad antes de esta venta
                        cantidad_vendida=cantidad,
                        fecha_inicio=producto.created_at
                    )

                producto.save()

                total += detalle.subtotal

            # Actualizar total y monto_total de la venta
            venta.total = total
            venta.monto_total = total
            venta.save()

            return venta

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    cliente = ClienteSerializer(read_only=True)
    vendedor = serializers.StringRelatedField(read_only=True)
    monto_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Venta
        fields = ['id', 'cliente', 'vendedor', 'fecha_venta', 'total', 'monto_total', 'detalles']
        read_only_fields = ['fecha_venta', 'total', 'monto_total']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        cliente_id = validated_data.pop('cliente_id')

        with transaction.atomic():
            # Verificar que el cliente existe
            try:
                cliente = Cliente.objects.get(id=cliente_id)
            except Cliente.DoesNotExist:
                raise serializers.ValidationError({"cliente_id": "Cliente no encontrado."})

            # Crear la venta
            venta = Venta.objects.create(
                cliente=cliente,
                vendedor=self.context['request'].user,
                **validated_data
            )

            total = 0

            # Crear los detalles y actualizar inventario
            for detalle_data in detalles_data:
                try:
                    producto = Producto.objects.select_for_update().get(
                        id=detalle_data['producto_id']
                    )
                except Producto.DoesNotExist:
                    raise serializers.ValidationError(
                        {"detalles": [f"Producto con ID {detalle_data['producto_id']} no encontrado."]}
                    )

                cantidad = detalle_data['cantidad']

                # Validar stock disponible
                if producto.cantidad_disponible < cantidad:
                    raise serializers.ValidationError(
                        f"No hay suficiente stock para {producto.nombre}. "
                        f"Disponible: {producto.cantidad_disponible}, Solicitado: {cantidad}"
                    )

                # Crear detalle de venta con precio actual
                detalle = DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=producto.precio,
                    subtotal=producto.precio * cantidad
                )

                # Reducir inventario
                producto.cantidad_disponible -= cantidad

                # Si el producto llega a cero, cambiar estado y crear registro de agotado
                if producto.cantidad_disponible == 0:
                    producto.estado = False

                    # Crear registro de producto agotado
                    ProductoAgotado.objects.create(
                        producto=producto,
                        cantidad_inicial=producto.cantidad_disponible + cantidad,  # Cantidad antes de esta venta
                        cantidad_vendida=cantidad,
                        fecha_inicio=producto.created_at
                    )

                producto.save()

                total += detalle.subtotal

            # Actualizar total y monto_total de la venta
            venta.total = total
            venta.monto_total = total  # Asignar el mismo valor al monto_total
            venta.save()

            return venta


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializador para el registro de usuarios"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'telefono'
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializador para el perfil de usuario"""
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telefono', 'fecha_creacion', 'fecha_actualizacion'
        )
        read_only_fields = ('role', 'fecha_creacion', 'fecha_actualizacion')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializador para el cambio de contraseña"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Las contraseñas no coinciden."})
        return data


class LogoutSerializer(serializers.Serializer):
    """Serializador para el logout de usuarios"""
    refresh = serializers.CharField(required=True, help_text="Token de refresco JWT")


class ProductoAgotadoSerializer(serializers.ModelSerializer):
    """Serializador para productos agotados"""
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField(write_only=True)
    categoria = serializers.CharField(source='producto.categoria.nombre', read_only=True)

    class Meta:
        model = ProductoAgotado
        fields = [
            'id', 'producto', 'producto_id', 'categoria', 'fecha_inicio', 'fecha_agotado',
            'cantidad_inicial', 'cantidad_vendida', 'tiempo_vida'
        ]
        read_only_fields = ['fecha_agotado', 'tiempo_vida']

    def create(self, validated_data):
        producto_id = validated_data.pop('producto_id')
        producto = Producto.objects.get(id=producto_id)

        # Crear el registro de producto agotado
        producto_agotado = ProductoAgotado.objects.create(
            producto=producto,
            **validated_data
        )

        return producto_agotado


class ReporteVentasSerializer(serializers.Serializer):
    """Serializador para los parámetros de consulta del reporte de ventas"""
    fecha_inicio = serializers.DateField(required=False, help_text="Fecha de inicio (YYYY-MM-DD)")
    fecha_fin = serializers.DateField(required=False, help_text="Fecha de fin (YYYY-MM-DD)")
    formato = serializers.ChoiceField(choices=['csv', 'pdf'], default='csv', required=False, help_text="Formato del reporte (csv o pdf)")

class DevolucionSerializer(serializers.Serializer):
    """Serializador para la devolución de productos"""
    productos = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            allow_empty=False
        ),
        allow_empty=False,
        help_text="Lista de productos a devolver con formato: [{'producto_id': 1, 'cantidad': 2}]"
    )

    def validate_productos(self, value):
        """Validar que los productos existen y las cantidades son válidas"""
        for item in value:
            producto_id = item.get('producto_id')
            cantidad = item.get('cantidad')

            if not producto_id or not cantidad:
                raise serializers.ValidationError("Cada producto debe tener producto_id y cantidad")

            if cantidad <= 0:
                raise serializers.ValidationError("La cantidad debe ser mayor a 0")

            # Verificar que el producto existe
            try:
                producto = Producto.objects.get(id=producto_id)
                item['producto'] = producto  # Agregar referencia para usar después
            except Producto.DoesNotExist:
                raise serializers.ValidationError(f"Producto con ID {producto_id} no encontrado")

        return value


class AdminPasswordSerializer(serializers.Serializer):
    """Serializador para verificar contraseña de administrador"""
    admin_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Contraseña del administrador para autorizar la acción"
    )


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializador para gestión completa de usuarios por admin"""
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={'input_type': 'password'},
        help_text="Contraseña del usuario (opcional en actualizaciones)"
    )

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telefono', 'is_active', 'fecha_creacion',
            'fecha_actualizacion', 'password'
        )
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password or not password.strip():
            raise serializers.ValidationError({'password': ['La contraseña es requerida para crear un nuevo usuario.']})
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and password.strip():  # Solo actualizar si hay contraseña no vacía
            # Aplicar validaciones solo si se proporciona contraseña
            try:
                validate_password(password)
            except ValidationError as e:
                raise serializers.ValidationError({'password': e.messages})
            instance.set_password(password)
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """Serializador para listar usuarios en el módulo admin"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'telefono', 'is_active',
            'fecha_creacion', 'fecha_actualizacion'
        )
