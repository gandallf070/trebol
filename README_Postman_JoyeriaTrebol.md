# 📋 Colección de Postman - Proyecto JoyeríaTrebol

## 🎯 Descripción
Colección completa de Postman para probar todas las funcionalidades del proyecto **JoyeríaTrebol**, incluyendo autenticación JWT, gestión de entidades, lógica de ventas atómica, reportes y pruebas de seguridad.

## 📁 Archivos Incluidos

### 1. **JoyeriaTrebol_API_Collection.postman_collection.json**
Archivo principal de la colección con todas las peticiones organizadas.

### 2. **JoyeriaTrebol_Environment.postman_environment.json**
Variables de entorno para facilitar el uso de la colección.

## 🚀 Instalación y Configuración

### Paso 1: Importar la Colección
1. Abre **Postman**
2. Haz clic en **"Import"** (arriba a la izquierda)
3. Selecciona **"Upload Files"**
4. Importa el archivo `JoyeriaTrebol_API_Collection.postman_collection.json`

### Paso 2: Importar Variables de Entorno
1. En Postman, ve a **"Environments"** (arriba a la derecha)
2. Haz clic en **"Import"**
3. Selecciona el archivo `JoyeriaTrebol_Environment.postman_environment.json`
4. Activa el entorno **"JoyeríaTrebol Environment"**

### Paso 3: Configurar Servidor Django
Asegúrate de que el servidor Django esté corriendo:
```bash
python3 manage.py runserver
```

### Paso 4: Datos de Prueba Incluidos
El proyecto incluye datos de prueba creados durante las verificaciones:

#### Entidades Creadas:
- **Cliente**: Juan Perez (CI: 1234567, Tel: 555-1234)
- **Categoría**: Anillos (Descripción: Anillos de oro y plata)
- **Producto 1**: Anillo de Oro (Precio: $150.00, Stock: 8 unidades restantes)
- **Producto 2**: Collar de Plata (Precio: $80.00, Stock: 4 unidades restantes)

#### Venta de Prueba:
- **Venta #1**: Cliente Juan Perez, 2 Anillos de Oro + 1 Collar de Plata = $380.00

## 🔐 Credenciales de Prueba

### Usuario Administrador (Recomendado para pruebas)
- **Username**: `admin_test`
- **Password**: `admin123456`

### Usuario Vendedor
- **Username**: `testuser2`
- **Password**: `newpass123` (actualizada durante las pruebas)

### Usuarios Adicionales Disponibles
- **testadmin** (usuario administrador con permisos staff)
- **admin2** (usuario administrador alternativo)
- **admin** (usuario inicial creado)
- **testuser** (usuario de prueba inicial)

## 📂 Estructura de la Colección

### 🔐 Autenticación JWT
- **Obtener Token Admin**: Autenticación como administrador
- **Obtener Token Vendedor**: Autenticación como vendedor
- **Refrescar Token**: Renovar token JWT expirado

### 📋 Gestión de Clientes
- **Listar Clientes**: GET `/api/clients/`
- **Crear Cliente**: POST `/api/clients/`
- **Buscar por CI**: GET `/api/clients/?search=1234567`

### 📂 Gestión de Categorías (Solo Admin)
- **Listar Categorías**: GET `/api/inventario/categories/`
- **Crear Categoría**: POST `/api/inventario/categories/`

### 📦 Gestión de Productos
- **Listar Productos**: GET `/api/inventario/products/` (todos los usuarios)
- **Crear Producto**: POST `/api/inventario/products/` (solo admin)

### 💰 Sistema de Ventas
- **Crear Venta**: POST `/api/sales/` (lógica atómica)
- **Listar Ventas**: GET `/api/sales/`
- **Ver Detalle**: GET `/api/sales/{id}/`

### 📊 Reportes (Solo Admin)
- **Reporte CSV**: GET `/api/reports/sales/?formato=csv`
- **Reporte PDF**: GET `/api/reports/sales/?formato=pdf`
- **Con Filtros**: GET `/api/reports/sales/?fecha_inicio=2025-09-30&fecha_fin=2025-09-30`

### 🛡️ Pruebas de Seguridad
- **Sin autenticación** (debe fallar con 401)
- **Permisos insuficientes** (debe fallar con 403)
- **Operaciones no permitidas** (debe fallar con 405)

## 🧪 Cómo Usar la Colección

### Paso 1: Obtener Tokens
1. Ejecuta **"Obtener Token Admin"**
2. El token se guardará automáticamente en la variable `admin_token`
3. Ejecuta **"Obtener Token Vendedor"**
4. El token se guardará automáticamente en la variable `vendedor_token`

### Paso 2: Probar Funcionalidades
1. **Crear datos de prueba**:
   - Crear cliente
   - Crear categoría
   - Crear producto

2. **Probar ventas**:
   - Crear una venta válida
   - Verificar que el stock se reduzca
   - Verificar que la venta sea inmutable

3. **Probar reportes**:
   - Generar reporte CSV
   - Generar reporte PDF
   - Probar filtros de fecha

4. **Probar seguridad**:
   - Intentar acceder sin token
   - Usuario vendedor intenta acceder a reportes
   - Intentar modificar/eliminar ventas

## ✅ Características Verificadas

### 🔒 Sistema de Seguridad
- ✅ **Autenticación JWT** funcionando
- ✅ **Permisos por roles** aplicados correctamente
- ✅ **Ventas inmutables** (no se pueden modificar)
- ✅ **Control de acceso** a reportes (solo admin)

### 💰 Lógica de Ventas Atómica
- ✅ **Transacciones atómicas** (todo o nada)
- ✅ **Validación de stock** antes de vender
- ✅ **Reducción automática** del inventario
- ✅ **Captura de precio_unitario** al momento de venta
- ✅ **Cálculo automático** del total

### 📊 Manejo de Excepciones
- ✅ **Cliente no encontrado**: `400 Bad Request`
- ✅ **Producto no encontrado**: `400 Bad Request`
- ✅ **Stock insuficiente**: `400 Bad Request`
- ✅ **Ventas inmutables**: `405 Method Not Allowed`
- ✅ **Permisos insuficientes**: `403 Forbidden`

### 🗃️ Base de Datos
- ✅ **PostgreSQL 16** instalado y configurado
- ✅ **Migraciones aplicadas** correctamente
- ✅ **Relaciones de datos** funcionando
- ✅ **Integridad referencial** mantenida

## 🎉 Estado del Proyecto

**El proyecto JoyeríaTrebol está 100% completo y operativo con:**

| Característica | Estado | Descripción |
|---------------|--------|-------------|
| ✅ Autenticación JWT | Completo | Tokens de acceso y refresco |
| ✅ Gestión de Entidades | Completo | Clientes, Categorías, Productos |
| ✅ Lógica de Ventas | Completo | Transacciones atómicas e inmutables |
| ✅ Control de Inventario | Completo | Stock automático y validación |
| ✅ Sistema de Reportes | Completo | CSV y PDF con filtros de fecha |
| ✅ Seguridad | Completo | Permisos por roles y ventas inmutables |
| ✅ Base de Datos | Completo | PostgreSQL 16 con relaciones |
| ✅ Manejo de Excepciones | Completo | Códigos HTTP apropiados |

## 🚀 Próximos Pasos Sugeridos

1. **Crear más datos de prueba** para testing completo
2. **Implementar paginación** para listas grandes
3. **Agregar filtros avanzados** en las consultas
4. **Implementar caché** para mejorar rendimiento
5. **Agregar logs de auditoría** para ventas
6. **Crear interfaz web** para gestión visual

## 🔧 Solución de Problemas (Troubleshooting)

### ❌ Error 401 Unauthorized al obtener token

**Síntomas:**
- La petición de token devuelve 401 Unauthorized
- Mensaje: "Authentication credentials were not provided"

**Causas comunes:**
1. **Formato del JSON incorrecto** en el body
2. **Content-Type header** no configurado como "application/json"
3. **Usuario/contraseña incorrectos**
4. **Usuario no existe** en la base de datos

**Soluciones:**

1. **Verificar el body JSON:**
   ```json
   {
     "username": "admin2",
     "password": "admin123456"
   }
   ```

2. **Configurar headers correctamente:**
   - Content-Type: `application/json`

3. **Verificar credenciales:**
   - Username: `admin2`
   - Password: `admin123456`

4. **Verificar que el usuario existe:**
   ```bash
   python manage.py shell -c "from administracion.models import CustomUser; print([u.username for u in CustomUser.objects.all()])"
   ```

### ❌ Error 403 Forbidden en endpoints

**Síntomas:**
- Acceso denegado a endpoints específicos
- Mensaje: "You do not have permission to perform this action"

**Causa:** Usuario no tiene los permisos requeridos para esa operación

**Solución:** Usa un usuario con rol `admin` para operaciones administrativas

### ❌ Error 405 Method Not Allowed

**Síntomas:**
- Intento de modificar o eliminar ventas
- Mensaje: "Method 'PUT'/'PATCH'/'DELETE' not allowed"

**Causa:** Las ventas son inmutables por diseño de seguridad

**Solución:** Las ventas no se pueden modificar después de crearlas

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda adicional, revisa:
- Los mensajes de error en la consola del servidor Django
- Los códigos de estado HTTP en las respuestas
- Los logs de la base de datos
- Esta sección de troubleshooting

**¡El proyecto está listo para usar en producción! 🎉**
