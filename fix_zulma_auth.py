import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'JoyeríaTrebol.settings')
django.setup()

from administracion.models import CustomUser

# Buscar y arreglar usuario zulma
user = CustomUser.objects.filter(username='zulma').first()

if user:
    print(f"Usuario encontrado: {user.username}")
    print(f"Estado actual:")
    print(f"  Rol: {user.role}")
    print(f"  is_staff: {user.is_staff}")
    print(f"  is_superuser: {user.is_superuser}")
    print(f"  is_active: {user.is_active}")

    # Arreglar permisos para vendedor
    user.is_staff = True  # Necesario para autenticación
    user.is_superuser = False  # No es administrador
    user.save()

    print(f"\nUsuario arreglado exitosamente:")
    print(f"  Nuevo is_staff: {user.is_staff}")
    print(f"  Nuevo is_superuser: {user.is_superuser}")
    print(f"  Usuario autenticable: {user.is_active and user.is_staff}")
else:
    print("Usuario 'zulma' no encontrado")
