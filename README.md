# InvSys

Sistema de inventarios con frontend en Vite/React y backend en FastAPI.

## Estructura

- `frontend/` - aplicación web
- `backend/` - API FastAPI y SQL del sistema
- `backend/sql/proyecto.sql` - script completo de base de datos

## Requisitos

- Node.js 20 o superior
- pnpm
- Python 3.11 o superior
- MySQL o MariaDB

## Instalación en Linux

### 1. Clonar y entrar al proyecto

```bash
git clone <url-del-repositorio>
cd InvSys
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

El backend quedará disponible en:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/api/v1/auth/me`
- `http://127.0.0.1:8000/api/v1/health/db`
- `http://127.0.0.1:8000/docs`

### 3. Frontend

```bash
cd ../frontend
pnpm install
pnpm dev
```

La aplicación web quedará disponible en:

- `http://127.0.0.1:5173/`

## Instalación en Windows

### 1. Clonar y entrar al proyecto

```powershell
git clone <url-del-repositorio>
cd InvSys
```

### 2. Backend

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Si PowerShell bloquea la activación del entorno virtual, ejecuta esto una vez como administrador:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Frontend

```powershell
cd ..\frontend
pnpm install
pnpm dev
```

## Base de datos

1. Crea una base de datos en MySQL o MariaDB.
2. Importa el archivo `backend/sql/proyecto.sql`.
3. Ajusta la cadena de conexión en `backend/app/core/config.py` o en un archivo `.env`.

Ejemplo de variable de entorno:

```env
DATABASE_URL=mysql+pymysql://usuario:password@localhost:3306/invsys
```

## Configuración del backend

El backend usa estos valores por defecto:

- `app_name`: `InvSys API`
- `database_url`: `mysql+pymysql://root:password@localhost:3306/invsys`
- `cors_origins`: `http://localhost:5173`

Si quieres cambiar la base de datos o el origen del frontend, edita `backend/app/core/config.py`.

Contrato API inicial (OpenAPI): `backend/openapi.contract.yaml`

Para comprobar conexión a base de datos, usa este endpoint:

- `GET /api/v1/health/db`

Si la conexión es correcta retorna `{"status": "ok", "database": "connected"}`.

### Verificación de roles y permisos (MariaDB)

El backend debe usar una credencial técnica en `DATABASE_URL` (usuario de aplicación),
mientras que la prueba de roles se hace con usuarios separados.

1. Define en `backend/.env` estas variables:

```env
DB_TEST_ADMIN_URL=mysql+pymysql://admin_user:Admin123!@localhost:3307/sistemaInventarios
DB_TEST_ALMACEN_URL=mysql+pymysql://almacen_user:Almacen123!@localhost:3307/sistemaInventarios
DB_TEST_SUPER_URL=mysql+pymysql://super_user:Super123!@localhost:3307/sistemaInventarios
```

2. Ejecuta el validador:

```bash
cd backend
python scripts/test_db_role_access.py
```

3. Si todo está bien, verás `PASS` en cada regla y resumen `N/N checks passed`.

## Notas

- El frontend consume datos mockeados localmente.
- El backend ya tiene estructura lista para conectar endpoints reales a la base de datos.
- El SQL completo está dentro de `backend/sql/` para mantener el proyecto ordenado.
