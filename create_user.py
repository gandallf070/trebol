import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'JoyeríaTrebol.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.filter(username='admin').first()
if user:
    user.delete()
print("Creating superuser...")

User.objects.create_superuser('admin', 'admin@test.com', 'password')
user = User.objects.get(username='admin')
print(f"Superuser created: active={user.is_active}, staff={user.is_staff}, super={user.is_superuser}, role={user.role}")
