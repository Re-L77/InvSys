#!/usr/bin/env .venv/bin/python
"""Test role-based authorization for InvSys backend."""

import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Test users
USERS = {
    "admin": {"username": "admin_user", "password": "Admin123!"},
    "almacenista": {"username": "almacen_user", "password": "Almacen123!"},
    "supervisor": {"username": "super_user", "password": "Super123!"},
}

def get_token(user_type):
    """Login and get access token."""
    creds = USERS[user_type]
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": creds["username"], "password": creds["password"]}
    )
    if resp.status_code != 200:
        print(f"❌ Login failed for {user_type}: {resp.status_code}")
        print(resp.text)
        return None
    return resp.json()["accessToken"]

def test_endpoint(method, path, user_type, expected_code, data=None):
    """Test an endpoint with a specific user."""
    token = get_token(user_type)
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}{path}"
    
    if method == "GET":
        resp = requests.get(url, headers=headers)
    elif method == "POST":
        headers["Content-Type"] = "application/json"
        resp = requests.post(url, json=data or {}, headers=headers)
    else:
        return False
    
    status = "✓" if resp.status_code == expected_code else "❌"
    print(f"{status} {user_type:12} {method:4} {path:40} → {resp.status_code} (expected {expected_code})")
    return resp.status_code == expected_code

def main():
    """Run all tests."""
    print("\n" + "="*90)
    print("InvSys Role-Based Authorization Tests")
    print("="*90 + "\n")
    
    results = []
    
    # Test /users (admin only)
    print("TEST 1: /users (ADMIN ONLY)")
    print("-" * 90)
    results.append(test_endpoint("GET", "/users", "admin", 200))
    results.append(test_endpoint("GET", "/users", "almacenista", 403))
    results.append(test_endpoint("GET", "/users", "supervisor", 403))
    
    # Test /categorias (GET: all auth, POST: admin)
    print("\nTEST 2: /categorias (GET: ALL AUTH, POST: ADMIN)")
    print("-" * 90)
    results.append(test_endpoint("GET", "/categorias", "admin", 200))
    results.append(test_endpoint("GET", "/categorias", "almacenista", 200))
    results.append(test_endpoint("GET", "/categorias", "supervisor", 200))
    results.append(test_endpoint("POST", "/categorias", "admin", 201, {"nombre": "Test"}))
    results.append(test_endpoint("POST", "/categorias", "almacenista", 403, {"nombre": "Test"}))
    results.append(test_endpoint("POST", "/categorias", "supervisor", 403, {"nombre": "Test"}))
    
    # Test /movimientos (GET: all, POST: admin+almacenista)
    print("\nTEST 3: /movimientos (GET: ALL, WRITE: ADMIN+ALMACENISTA)")
    print("-" * 90)
    results.append(test_endpoint("GET", "/movimientos", "admin", 200))
    results.append(test_endpoint("GET", "/movimientos", "almacenista", 200))
    results.append(test_endpoint("GET", "/movimientos", "supervisor", 200))
    results.append(test_endpoint("POST", "/movimientos", "almacenista", 422, {}))  # 422 for missing data
    results.append(test_endpoint("POST", "/movimientos", "supervisor", 403, {}))
    
    # Test /reportes (all auth)
    print("\nTEST 4: /reportes (ALL AUTH)")
    print("-" * 90)
    results.append(test_endpoint("GET", "/reportes/inventario-actual", "admin", 200))
    results.append(test_endpoint("GET", "/reportes/inventario-actual", "almacenista", 200))
    results.append(test_endpoint("GET", "/reportes/inventario-actual", "supervisor", 200))
    
    # Test missing auth
    print("\nTEST 5: Missing Authorization Header")
    print("-" * 90)
    resp = requests.get(f"{BASE_URL}/categorias")
    status = "✓" if resp.status_code == 401 else "❌"
    print(f"{status} {'NONE':12} GET    /categorias (no auth)                       → {resp.status_code} (expected 401)")
    results.append(resp.status_code == 401)
    
    # Summary
    passed = sum(results)
    total = len(results)
    print("\n" + "="*90)
    print(f"Results: {passed}/{total} tests passed")
    print("="*90 + "\n")
    
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
