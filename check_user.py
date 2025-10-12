import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'JoyeríaTrebol.settings')
django.setup()

from administracion.models import CustomUser

# Buscar usuario zulma
user = CustomUser.objects.filter(username='zulma').first()

if user:
    print(f"Usuario encontrado:")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Rol actual: {user.role}")
    print(f"  ID: {user.id}")
    print(f"  Activo: {user.is_active}")
    print(f"  Staff: {user.is_staff}")
    print(f"  Superuser: {user.is_superuser}")
else:
    print("Usuario 'zulma' no encontrado")

# Listar todos los usuarios para referencia
print("\nUsuarios existentes:")
for u in CustomUser.objects.all().order_by('username'):
    print(f"  {u.username} - {u.role} - {u.email}")
