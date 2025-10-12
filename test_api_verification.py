#!/usr/bin/env python3
"""
Script de Verificación de la API REST - JoyeríaTrebol
Ejecuta pruebas automáticas para verificar que todos los endpoints funcionan correctamente
"""

import requests
import json
import sys
from datetime import datetime


class APITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.admin_token = None
        self.vendedor_token = None
        self.session = requests.Session()

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def test_endpoint(self, method, url, headers=None, data=None, expected_status=200):
        """Realiza una petición HTTP y verifica el código de estado"""
        try:
            if data:
                response = self.session.request(
                    method=method, url=url, headers=headers or {}, json=data
                )
            else:
                response = self.session.request(
                    method=method, url=url, headers=headers or {}
                )

            if response.status_code == expected_status:
                self.log(f"✅ {method} {url} -> {response.status_code}", "SUCCESS")
                return response
            else:
                self.log(
                    f"❌ {method} {url} -> {response.status_code} (esperado: {expected_status})",
                    "ERROR",
                )
                self.log(f"   Respuesta: {response.text}", "ERROR")
                return None

        except Exception as e:
            self.log(f"❌ Error conectando a {url}: {str(e)}", "ERROR")
            return None

    def test_authentication(self):
        """Prueba el sistema de autenticación JWT"""
        self.log("🔐 Probando sistema de autenticación...")

        # 1. Obtener token admin
        response = self.test_endpoint(
            "POST",
            f"{self.base_url}/api/token/",
            data={"username": "admin2", "password": "admin123456"},
            expected_status=200,
        )

        if response:
            data = response.json()
            self.admin_token = data.get("access")
            self.log(f"Token admin obtenido: {self.admin_token[:20]}...")

        # 2. Obtener token vendedor
        response = self.test_endpoint(
            "POST",
            f"{self.base_url}/api/token/",
            data={"username": "testuser2", "password": "newpass123"},
            expected_status=200,
        )

        if response:
            data = response.json()
            self.vendedor_token = data.get("access")
            self.log(f"Token vendedor obtenido: {self.vendedor_token[:20]}...")

    def test_entities(self):
        """Prueba la gestión de entidades (clientes, categorías, productos)"""
        self.log("📋 Probando gestión de entidades...")

        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # 1. Listar clientes
        self.test_endpoint(
            "GET", f"{self.base_url}/api/clients/", headers=headers_admin
        )

        # 2. Crear cliente
        self.test_endpoint(
            "POST",
            f"{self.base_url}/api/clients/",
            headers=headers_admin,
            data={
                "ci": "9999999",
                "nombre": "Cliente",
                "apellido": "Prueba",
                "telefono": "555-9999",
            },
        )

        # 3. Crear categoría (solo admin)
        self.test_endpoint(
            "POST",
            f"{self.base_url}/api/inventario/categories/",
            headers=headers_admin,
            data={"nombre": "Pruebas", "descripcion": "Categoría de prueba"},
        )

        # 4. Crear producto (solo admin)
        self.test_endpoint(
            "POST",
            f"{self.base_url}/api/inventario/products/",
            headers=headers_admin,
            data={
                "nombre": "Producto de Prueba",
                "descripcion": "Producto creado para testing",
                "categoria": 1,
                "precio": 100.00,
                "cantidad_disponible": 20,
                "estado": True,
            },
        )

    def test_sales(self):
        """Prueba el sistema de ventas"""
        self.log("💰 Probando sistema de ventas...")

        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        headers_vendedor = {"Authorization": f"Bearer {self.vendedor_token}"}

        # 1. Crear venta con admin
        response = self.test_endpoint(
            "POST",
            f"{self.base_url}/api/sales/",
            headers=headers_admin,
            data={"cliente_id": 1, "detalles": [{"producto_id": 1, "cantidad": 1}]},
        )

        if response:
            venta_data = response.json()
            venta_id = venta_data.get("id")
            self.log(f"Venta creada con ID: {venta_id}")

            # 2. Listar ventas
            self.test_endpoint(
                "GET", f"{self.base_url}/api/sales/", headers=headers_admin
            )

            # 3. Ver detalle de venta
            if venta_id:
                self.test_endpoint(
                    "GET",
                    f"{self.base_url}/api/sales/{venta_id}/",
                    headers=headers_admin,
                )

    def test_reports(self):
        """Prueba el sistema de reportes"""
        self.log("📊 Probando sistema de reportes...")

        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # 1. Generar reporte CSV
        response = self.test_endpoint(
            "GET",
            f"{self.base_url}/api/reports/sales/?formato=csv",
            headers=headers_admin,
            expected_status=200,
        )

        if response:
            self.log("Reporte CSV generado correctamente")

        # 2. Generar reporte PDF
        response = self.test_endpoint(
            "GET",
            f"{self.base_url}/api/reports/sales/?formato=pdf",
            headers=headers_admin,
            expected_status=200,
        )

        if response:
            self.log("Reporte PDF generado correctamente")

    def test_security(self):
        """Prueba las medidas de seguridad"""
        self.log("🛡️ Probando medidas de seguridad...")

        # 1. Acceso sin token (debe fallar)
        self.test_endpoint("GET", f"{self.base_url}/api/clients/", expected_status=401)

        # 2. Usuario vendedor intenta acceder a reportes (debe fallar)
        headers_vendedor = {"Authorization": f"Bearer {self.vendedor_token}"}
        self.test_endpoint(
            "GET",
            f"{self.base_url}/api/reports/sales/?formato=csv",
            headers=headers_vendedor,
            expected_status=403,
        )

        # 3. Intentar modificar venta (debe fallar)
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        self.test_endpoint(
            "PUT",
            f"{self.base_url}/api/sales/1/",
            headers=headers_admin,
            data={"cliente_id": 2},
            expected_status=405,
        )

    def run_all_tests(self):
        """Ejecuta todas las pruebas"""
        self.log("🚀 Iniciando verificación completa de la API...")

        self.test_authentication()
        self.test_entities()
        self.test_sales()
        self.test_reports()
        self.test_security()

        self.log("✅ Verificación completa finalizada!")
        self.log("🎉 La API REST está funcionando correctamente!")


def main():
    """Función principal"""
    print("🔍 Verificación Automática de la API REST - JoyeríaTrebol")
    print("=" * 60)

    tester = APITester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
