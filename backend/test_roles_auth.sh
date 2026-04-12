#!/bin/bash

# Test script for role-based authorization
# Tests: admin, almacenista, supervisor access to various endpoints

set -e

BASE_URL="http://127.0.0.1:8000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    local expected=$3
    local actual=$4
    
    if [[ "$expected" == "$actual" ]]; then
        echo -e "${GREEN}✓${NC} $test_name: $actual"
    else
        echo -e "${RED}✗${NC} $test_name: expected $expected, got $actual"
    fi
}

echo "========================================"
echo "InvSys Role-Based Authorization Tests"
echo "========================================"

# Login as admin_user (admin role)
echo -e "\n${YELLOW}Logging in as admin_user...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_user","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.accessToken')
echo "Admin token: ${ADMIN_TOKEN:0:20}..."

# Login as almacen_user (almacenista role)
echo -e "\n${YELLOW}Logging in as almacen_user...${NC}"
ALMACEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"almacen_user","password":"almacen123"}')
ALMACEN_TOKEN=$(echo $ALMACEN_RESPONSE | jq -r '.accessToken')
echo "Almacenista token: ${ALMACEN_TOKEN:0:20}..."

# Login as super_user (supervisor role)
echo -e "\n${YELLOW}Logging in as super_user...${NC}"
SUPER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"super_user","password":"super123"}')
SUPER_TOKEN=$(echo $SUPER_RESPONSE | jq -r '.accessToken')
echo "Supervisor token: ${SUPER_TOKEN:0:20}..."

# Test /users endpoint (admin only)
echo -e "\n${YELLOW}Testing /users endpoint (admin only)${NC}"
ADMIN_USERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | tail -1)
print_result "Admin GET /users" 200 "200" "$ADMIN_USERS"

ALMACEN_USERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" | tail -1)
print_result "Almacenista GET /users (should fail)" 403 "403" "$ALMACEN_USERS"

SUPER_USERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $SUPER_TOKEN" | tail -1)
print_result "Supervisor GET /users (should fail)" 403 "403" "$SUPER_USERS"

# Test /categorias endpoint (GET: all auth, POST: admin only)
echo -e "\n${YELLOW}Testing /categorias endpoint (GET: all auth, POST: admin only)${NC}"
ADMIN_CATS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/categorias" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | tail -1)
print_result "Admin GET /categorias" 200 "200" "$ADMIN_CATS"

ALMACEN_CATS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/categorias" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" | tail -1)
print_result "Almacenista GET /categorias" 200 "200" "$ALMACEN_CATS"

SUPER_CATS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/categorias" \
  -H "Authorization: Bearer $SUPER_TOKEN" | tail -1)
print_result "Supervisor GET /categorias" 200 "200" "$SUPER_CATS"

# Test POST /categorias (admin only)
ADMIN_POST_CAT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/categorias" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Cat"}' | tail -1)
print_result "Admin POST /categorias" 201 "201" "$ADMIN_POST_CAT"

ALMACEN_POST_CAT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/categorias" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Cat"}' | tail -1)
print_result "Almacenista POST /categorias (should fail)" 403 "403" "$ALMACEN_POST_CAT"

# Test /movimientos endpoint (GET: all, POST: admin+almacenista)
echo -e "\n${YELLOW}Testing /movimientos endpoint (GET: all, POST: admin+almacenista)${NC}"
ADMIN_MOV=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/movimientos" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | tail -1)
print_result "Admin GET /movimientos" 200 "200" "$ADMIN_MOV"

ALMACEN_MOV=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/movimientos" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" | tail -1)
print_result "Almacenista GET /movimientos" 200 "200" "$ALMACEN_MOV"

SUPER_MOV=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/movimientos" \
  -H "Authorization: Bearer $SUPER_TOKEN" | tail -1)
print_result "Supervisor GET /movimientos" 200 "200" "$SUPER_MOV"

# Test POST /movimientos (admin + almacenista only)
# Note: This will likely fail on 422 due to missing data, but 403 means auth failed
ALMACEN_POST_MOV=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/movimientos" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | tail -1)
print_result "Almacenista POST /movimientos" 422 "422" "$ALMACEN_POST_MOV"

SUPER_POST_MOV=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/movimientos" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | tail -1)
print_result "Supervisor POST /movimientos (should fail)" 403 "403" "$SUPER_POST_MOV"

# Test /reportes endpoint (GET: all auth)
echo -e "\n${YELLOW}Testing /reportes endpoint (GET: all auth)${NC}"
ADMIN_REP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/reportes/inventario-actual" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | tail -1)
print_result "Admin GET /reportes/inventario-actual" 200 "200" "$ADMIN_REP"

ALMACEN_REP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/reportes/inventario-actual" \
  -H "Authorization: Bearer $ALMACEN_TOKEN" | tail -1)
print_result "Almacenista GET /reportes/inventario-actual" 200 "200" "$ALMACEN_REP"

SUPER_REP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/reportes/inventario-actual" \
  -H "Authorization: Bearer $SUPER_TOKEN" | tail -1)
print_result "Supervisor GET /reportes/inventario-actual" 200 "200" "$SUPER_REP"

# Test missing auth header (should get 401)
echo -e "\n${YELLOW}Testing missing authorization header${NC}"
NO_AUTH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/categorias" | tail -1)
print_result "GET /categorias without auth header" 401 "401" "$NO_AUTH"

echo -e "\n${GREEN}========================================"
echo "Authorization tests completed!"
echo "========================================${NC}"
