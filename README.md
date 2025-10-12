# Proyecto Joyería Trebol - Sistema de Gestión

## Estructura del Proyecto

```
trebol/
├── JoyeríaTrebol/          # Proyecto Django principal
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── administracion/         # App Django para administración
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── migrations/
├── frontend-react/         # Frontend React
│   ├── src/
│   ├── public/
│   └── package.json
├── trebol/                 # Virtual environment
└── manage.py
```

## Tecnologías

- **Backend**: Django (Python)
- **Frontend**: React.js
- **Base de datos**: SQLite
- **Autenticación**: Django Auth
- **API**: Django REST Framework

## Instalación y Configuración

### 1. Entorno Virtual
```bash
# Activar el entorno virtual
trebol\Scripts\activate  # Windows
# source trebol/bin/activate  # Linux/Mac
```

### 2. Dependencias
```bash
pip install -r requirements.txt
```

### 3. Base de Datos
```bash
python manage.py migrate
```

### 4. Servidor de Desarrollo
```bash
python manage.py runserver
```

### 5. Frontend (en otra terminal)
```bash
cd frontend-react
npm install
npm start
```

## Características

- Gestión de productos y ventas
- Sistema de reportes
- Panel de administración
- API REST completa
- Interfaz responsiva

## Uso

1. Acceder al admin: `http://localhost:8000/admin/`
2. API: `http://localhost:8000/api/`
3. Frontend: `http://localhost:3000/`

## Desarrollo

### Formateo de Código
```bash
# Backend Python
black . --exclude=trebol/
isort .

# Frontend JavaScript/React
cd frontend-react
npm run format
```

### Testing
```bash
# Backend
python manage.py test

# Frontend
cd frontend-react
npm test
```
