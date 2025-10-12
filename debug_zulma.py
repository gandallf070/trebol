import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "JoyeríaTrebol.settings")
django.setup()

from administracion.models import CustomUser

# Verificar estado completo del usuario zulma
user = CustomUser.objects.filter(username="zulma").first()

if user:
    print("=== DETALLES COMPLETOS DEL USUARIO ZULMA ===")
    print(f"ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Rol: {user.role}")
    print(f"is_active: {user.is_active}")
    print(f"is_staff: {user.is_staff}")
    print(f"is_superuser: {user.is_superuser}")
    print(f"is_admin (propiedad): {user.is_admin}")
    print(f"is_vendedor (propiedad): {user.is_vendedor}")
    print(f"is_gerente (propiedad): {user.is_gerente}")
    print(f"Fecha creación: {user.fecha_creacion}")
    print(f"Última actualización: {user.fecha_actualizacion}")

    # Verificar contraseña
    from django.contrib.auth.hashers import check_password

    password_check = check_password("admin123", user.password)
    print(f"Contraseña 'admin123' válida: {password_check}")

    # Verificar si puede autenticarse
    print(
        f"Usuario autenticable: {user.is_active and (user.is_staff or user.is_superuser)}"
    )
else:
    print("Usuario zulma no encontrado")
