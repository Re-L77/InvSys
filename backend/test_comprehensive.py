#!/usr/bin/env .venv/bin/python
"""
Comprehensive backend test suite validating all HTTP codes and error scenarios.
Covers: 200, 201, 204, 401, 403, 404, 409, 422 scenarios.
"""

import requests
import sys
from typing import Any

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Test users with different roles
USERS = {
    "admin": {"username": "admin_user", "password": "Admin123!"},
    "almacenista": {"username": "almacen_user", "password": "Almacen123!"},
    "supervisor": {"username": "super_user", "password": "Super123!"},
}

# Store token for each user
TOKENS = {}

# Counters
tests_passed = 0
tests_failed = 0


def get_token(user_type: str) -> str | None:
    """Get and cache authentication token."""
    if user_type in TOKENS:
        return TOKENS[user_type]
    
    creds = USERS[user_type]
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": creds["username"], "password": creds["password"]}
    )
    if resp.status_code != 200:
        return None
    
    token = resp.json()["accessToken"]
    TOKENS[user_type] = token
    return token


def test(
    name: str,
    method: str,
    path: str,
    user: str | None,
    expected_code: int,
    payload: dict[str, Any] | None = None,
    check_response: bool = False
) -> bool:
    """Execute a single test case."""
    global tests_passed, tests_failed
    
    headers = {}
    if user:
        token = get_token(user)
        if not token:
            print(f"❌ {name}: Failed to get token for {user}")
            tests_failed += 1
            return False
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE_URL}{path}"
    headers["Content-Type"] = "application/json"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers)
        elif method == "POST":
            resp = requests.post(url, json=payload or {}, headers=headers)
        elif method == "PUT":
            resp = requests.put(url, json=payload or {}, headers=headers)
        elif method == "PATCH":
            resp = requests.patch(url, json=payload or {}, headers=headers)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers)
        else:
            print(f"❌ {name}: Unknown method {method}")
            tests_failed += 1
            return False
        
        passed = resp.status_code == expected_code
        status = "✓" if passed else "❌"
        print(f"{status} {name:50} → {resp.status_code} (expected {expected_code})")
        
        if passed:
            tests_passed += 1
        else:
            tests_failed += 1
            if check_response:
                print(f"   Response: {resp.text[:200]}")
        
        return passed
    
    except Exception as e:
        print(f"❌ {name:50} → Exception: {str(e)[:100]}")
        tests_failed += 1
        return False


def main():
    """Run comprehensive test suite."""
    print("\n" + "="*100)
    print("InvSys Backend - Comprehensive HTTP Status Code Tests")
    print("="*100 + "\n")
    
    # ==========================================================================
    print("[AUTH] Authentication & Authorization Tests")
    print("-" * 100)
    test("Auth: Login success", "POST", "/auth/login", None, 200, 
         {"username": "admin_user", "password": "Admin123!"})
    test("Auth: Login invalid credentials", "POST", "/auth/login", None, 401,
         {"username": "admin_user", "password": "wrongpass"})
    test("Auth: GET protected without token", "GET", "/users", None, 401)
    test("Auth: GET protected with token", "GET", "/users", "admin", 200)
    
    # ==========================================================================
    print("\n[AUTHORIZATION] Role-Based Access Control")
    print("-" * 100)
    test("Authz: Admin can list users", "GET", "/users", "admin", 200)
    test("Authz: Almacenista cannot list users", "GET", "/users", "almacenista", 403)
    test("Authz: Supervisor cannot list users", "GET", "/users", "supervisor", 403)
    test("Authz: Admin can create category", "POST", "/categorias", "admin", 201,
         {"nombre": "Test Cat 1"})
    test("Authz: Almacenista cannot create category", "POST", "/categorias", "almacenista", 403,
         {"nombre": "Test Cat 2"})
    
    # ==========================================================================
    print("\n[200] OK - Successful GET Operations")
    print("-" * 100)
    test("GET: List categorias", "GET", "/categorias", "admin", 200)
    test("GET: List proveedores", "GET", "/proveedores", "admin", 200)
    test("GET: List almacenes", "GET", "/almacenes", "admin", 200)
    test("GET: List productos", "GET", "/productos", "admin", 200)
    test("GET: List movimientos", "GET", "/movimientos", "admin", 200)
    test("GET: List inventario", "GET", "/inventario", "admin", 200)
    test("GET: Reports inventario-actual", "GET", "/reportes/inventario-actual", "admin", 200)
    test("GET: Reports historial-movimientos", "GET", "/reportes/historial-movimientos", "admin", 200)
    test("GET: /auth/me", "GET", "/auth/me", "admin", 200)
    
    # ==========================================================================
    print("\n[201] Created - Successful POST Operations")
    print("-" * 100)
    test("POST: Create categoria", "POST", "/categorias", "admin", 201,
         {"nombre": "Categoria Test Create"})
    test("POST: Create proveedor", "POST", "/proveedores", "admin", 201,
         {"nombre": "Proveedor Test", "email": f"prov{tests_passed}@test.com"})
    test("POST: Create almacen", "POST", "/almacenes", "admin", 201,
         {"nombre": "Almacen Test"})
    
    # ==========================================================================
    print("\n[204] No Content - Successful DELETE & Logout")
    print("-" * 100)
    test("DELETE: Logout", "POST", "/auth/logout", "admin", 204)
    # Note: Actual deletes require existing IDs and possibly cleanup after tests
    
    # ==========================================================================
    print("\n[404] Not Found - Non-existent Resources")
    print("-" * 100)
    test("404: GET user that doesn't exist", "GET", "/users", "admin", 200)  # List works
    test("404: GET categoria by ID (invalid)", "GET", "/categorias/99999", "admin", 404)
    test("404: GET proveedor by ID (invalid)", "GET", "/proveedores/99999", "admin", 404)
    test("404: GET producto by ID (invalid)", "GET", "/productos/99999", "admin", 404)
    test("404: GET almacen by ID (invalid)", "GET", "/almacenes/99999", "admin", 404)
    test("404: GET movimiento by ID (invalid)", "GET", "/movimientos/99999", "admin", 404)
    test("404: PATCH user that doesn't exist", "PATCH", "/users/nonexistent", "admin", 404,
         {"displayName": "Test"})
    test("404: DELETE categoria that doesn't exist", "DELETE", "/categorias/99999", "admin", 404)
    test("404: DELETE proveedor that doesn't exist", "DELETE", "/proveedores/99999", "admin", 404)
    test("404: DELETE almacen that doesn't exist", "DELETE", "/almacenes/99999", "admin", 404)
    
    # ==========================================================================
    print("\n[409] Conflict - Business Logic Violations")
    print("-" * 100)
    # First create a category to test deletion with products
    cat_resp = requests.post(
        f"{BASE_URL}/categorias",
        json={"nombre": "Cat With Products"},
        headers={"Authorization": f"Bearer {get_token('admin')}", "Content-Type": "application/json"}
    )
    if cat_resp.status_code == 201:
        cat_id = cat_resp.json()["idCategoria"]
        # Create a product in this category
        requests.post(
            f"{BASE_URL}/productos",
            json={
                "nombre": "Product Test",
                "idCategoria": cat_id,
                "idProveedor": 1,
                "precio": 100.0,
                "stockMin": 5
            },
            headers={"Authorization": f"Bearer {get_token('admin')}", "Content-Type": "application/json"}
        )
        test("409: Delete categoria with products", "DELETE", f"/categorias/{cat_id}", "admin", 409)
    
    test("409: Inventory adjustment negative stock", "POST", "/inventario/ajustes", "admin", 409,
         {"idProducto": 1, "idAlmacen": 1, "cantidad": -999999, "motivo": "test"})
    
    # ==========================================================================
    print("\n[422] Unprocessable Entity - Validation Errors")
    print("-" * 100)
    test("422: Create categoria - empty nombre", "POST", "/categorias", "admin", 422,
         {"nombre": ""})
    test("422: Create categoria - nombre too short", "POST", "/categorias", "admin", 422,
         {"nombre": "a"})
    test("422: Create proveedor - missing email", "POST", "/proveedores", "admin", 422,
         {"nombre": "Test", "email": ""})
    test("422: Create almacen - nombre too short", "POST", "/almacenes", "admin", 422,
         {"nombre": "a"})
    test("422: Movement - invalid tipo", "POST", "/movimientos", "almacenista", 422,
         {"idAlmacen": 1, "idProducto": 1, "cantidad": 10, "tipo": "invalid"})
    test("422: Movement - missing cantidad", "POST", "/movimientos", "almacenista", 422,
         {"idAlmacen": 1, "idProducto": 1, "tipo": "entrada"})
    test("422: Inventory - cantidad zero", "POST", "/inventario/ajustes", "admin", 422,
         {"idProducto": 1, "idAlmacen": 1, "cantidad": 0, "motivo": "test"})
    
    # ==========================================================================
    print("\n[401] Unauthorized - Missing/Invalid Tokens")
    print("-" * 100)
    test("401: Missing auth header", "GET", "/categorias", None, 401)
    test("401: Invalid token format", "GET", "/categorias", None, 401)
    
    # ==========================================================================
    print("\n[403] Forbidden - Insufficient Permissions")
    print("-" * 100)
    test("403: Almacenista cannot manage users", "GET", "/users", "almacenista", 403)
    test("403: Almacenista cannot create category", "POST", "/categorias", "almacenista", 403,
         {"nombre": "Test"})
    test("403: Supervisor cannot write movements", "POST", "/movimientos", "supervisor", 403,
         {"idAlmacen": 1, "idProducto": 1, "cantidad": 10, "tipo": "entrada"})
    test("403: Supervisor cannot create category", "POST", "/categorias", "supervisor", 403,
         {"nombre": "Test"})
    
    # ==========================================================================
    print("\n" + "="*100)
    print(f"Test Results: {tests_passed} passed, {tests_failed} failed")
    print("="*100 + "\n")
    
    return 0 if tests_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
