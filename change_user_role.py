import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "JoyeríaTrebol.settings")
django.setup()

from administracion.models import CustomUser
from django.contrib.auth.hashers import make_password

# Buscar y modificar usuario zulma
user = CustomUser.objects.filter(username="zulma").first()

if user:
    print(f"Usuario encontrado: {user.username}")
    print(f"Rol actual: {user.role}")

    # Cambiar rol a vendedor
    user.role = "vendedor"
    # Quitar permisos de admin
    user.is_staff = False
    user.is_superuser = False
    # Establecer contraseña admin123
    user.password = make_password("admin123")
    user.save()

    print(f"Usuario modificado exitosamente:")
    print(f"  Nuevo rol: {user.role}")
    print(f"  Staff: {user.is_staff}")
    print(f"  Superuser: {user.is_superuser}")
    print(f"  Contraseña cambiada a: admin123")
else:
    print("Usuario 'zulma' no encontrado")
