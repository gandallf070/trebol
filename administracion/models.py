from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class AbstractBaseModel(models.Model):
    """Modelo base abstracto que proporciona campos de auditoría"""

    created_at = models.DateTimeField(_('fecha creación'), auto_now_add=True)
    updated_at = models.DateTimeField(_('fecha actualización'), auto_now=True)

    class Meta:
        abstract = True


class CustomUserManager(BaseUserManager):
    """Manager personalizado para el modelo de usuario"""

    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('El email es requerido'))
        if not username:
            raise ValueError(_('El username es requerido'))

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser debe tener is_staff=True'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser debe tener is_superuser=True'))

        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    """Modelo de usuario personalizado"""

    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
        ('gerente', 'Gerente'),
    ]

    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default='vendedor')
    telefono = models.CharField(_('telefono'), max_length=20, blank=True, null=True)
    fecha_creacion = models.DateTimeField(_('fecha creacion'), auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(_('fecha actualizacion'), auto_now=True)
    is_active = models.BooleanField(_('active'), default=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    class Meta:
        verbose_name = _('usuario')
        verbose_name_plural = _('usuarios')
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_vendedor(self):
        return self.role == 'vendedor'

    @property
    def is_gerente(self):
        return self.role == 'gerente'


class Cliente(AbstractBaseModel):
    ci = models.CharField(_('cédula de identidad'), max_length=20, unique=True)
    nombre = models.CharField(_('nombre'), max_length=100)
    apellido = models.CharField(_('apellido'), max_length=100)
    telefono = models.CharField(_('teléfono'), max_length=20)

    class Meta:
        verbose_name = _('cliente')
        verbose_name_plural = _('clientes')
        ordering = ['apellido', 'nombre']

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class Categoria(AbstractBaseModel):
    nombre = models.CharField(_('nombre'), max_length=100, unique=True)
    descripcion = models.TextField(_('descripción'), blank=True, null=True)

    class Meta:
        verbose_name = _('categoría')
        verbose_name_plural = _('categorías')
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(AbstractBaseModel):
    nombre = models.CharField(_('nombre'), max_length=200)
    descripcion = models.TextField(_('descripción'))
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, verbose_name=_('categoría'))
    precio = models.DecimalField(_('precio'), max_digits=10, decimal_places=2)
    cantidad_disponible = models.IntegerField(_('cantidad disponible'))
    estado = models.BooleanField(_('estado'), default=True)

    class Meta:
        verbose_name = _('producto')
        verbose_name_plural = _('productos')
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Venta(AbstractBaseModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, verbose_name=_('cliente'))
    vendedor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name=_('vendedor'))
    fecha_venta = models.DateTimeField(_('fecha venta'), auto_now_add=True)
    total = models.DecimalField(_('total'), max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(_('monto total'), max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = _('venta')
        verbose_name_plural = _('ventas')
        ordering = ['-fecha_venta']

    def __str__(self):
        return f"Venta #{self.id} - {self.cliente} - {self.fecha_venta}"

class DetalleVenta(AbstractBaseModel):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles', verbose_name=_('venta'))
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, verbose_name=_('producto'))
    cantidad = models.IntegerField(_('cantidad'))
    precio_unitario = models.DecimalField(_('precio unitario'), max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(_('subtotal'), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _('detalle venta')
        verbose_name_plural = _('detalles venta')
        ordering = ['venta', 'producto']

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} - ${self.subtotal}"


class ProductoAgotado(AbstractBaseModel):
    """Modelo para registrar productos que se agotaron"""

    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, verbose_name=_('producto'))
    fecha_inicio = models.DateTimeField(_('fecha inicio'), help_text=_('Fecha cuando el producto comenzó a venderse'))
    fecha_agotado = models.DateTimeField(_('fecha agotado'), default=timezone.now, help_text=_('Fecha cuando se agotó completamente'))
    cantidad_inicial = models.IntegerField(_('cantidad inicial'), help_text=_('Cantidad inicial cuando comenzó a venderse'))
    cantidad_vendida = models.IntegerField(_('cantidad vendida'), help_text=_('Cantidad total vendida hasta agotarse'))
    tiempo_vida = models.IntegerField(_('tiempo vida (días)'), help_text=_('Días que tardó en agotarse'))

    class Meta:
        verbose_name = _('producto agotado')
        verbose_name_plural = _('productos agotados')
        ordering = ['-fecha_agotado']
        unique_together = ['producto']  # Un producto solo puede registrarse una vez como agotado

    def __str__(self):
        return f"{self.producto.nombre} - Agotado: {self.fecha_agotado.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        # Calcular tiempo de vida si no está establecido
        if not self.tiempo_vida and self.fecha_inicio:
            delta = self.fecha_agotado - self.fecha_inicio
            self.tiempo_vida = delta.days
        super().save(*args, **kwargs)
