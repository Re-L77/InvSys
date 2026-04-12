# InvSys

Sistema de inventarios completo con:

- Backend en FastAPI + SQLAlchemy + MariaDB/MySQL.
- Frontend en React + Vite.
- Seguridad por roles (admin, almacenista, supervisor).
- Base de datos con vistas, funciones, procedimientos y trigger.

## Estado actual del proyecto

El proyecto ya esta integrado end-to-end:

- Frontend conectado a API real (sin mocks para los modulos principales).
- Login JWT y proteccion de rutas por rol.
- CRUD funcional en categorias, proveedores, almacenes y productos.
- Registro de movimientos con procedimiento almacenado.
- Inventario e historial consumiendo reportes reales del backend.

## Arquitectura

- Frontend: [frontend](frontend)
- Backend API: [backend](backend)
- Contrato OpenAPI: [backend/openapi.contract.yaml](backend/openapi.contract.yaml)
- SQL completo del proyecto: [backend/sql/proyecto.sql](backend/sql/proyecto.sql)

## Estructura del repositorio

```text
InvSys/
  backend/
    app/
      api/v1/endpoints/
      core/
      db/
    scripts/
    sql/
    requirements.txt
  frontend/
    src/
      app/
      styles/
    package.json
  README.md
```

## Requisitos

- Python 3.11+
- Node.js 20+
- pnpm
- MariaDB o MySQL compatible con el SQL del proyecto

## Inicio rapido (local)

### 1. Base de datos

1. Crea una base llamada `sistemaInventarios` (o la que vayas a usar).
2. Importa [backend/sql/proyecto.sql](backend/sql/proyecto.sql).
3. Verifica usuarios/roles de prueba definidos por el script SQL.

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

Backend disponible en:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/api/v1/health/db`
- `http://127.0.0.1:8000/docs` (si `EXPOSE_DOCS=true` y no estas en produccion)

### 3. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Frontend disponible en:

- `http://127.0.0.1:5173/`

## Variables de entorno

### Backend (.env)

Referencia: [backend/.env.example](backend/.env.example)

Variables clave:

- `APP_NAME`
- `APP_ENV` (`development` o `production`)
- `DEBUG`
- `DATABASE_URL`
- `AUTH_SECRET_KEY`
- `AUTH_ACCESS_TOKEN_MINUTES`
- `AUTH_REFRESH_TOKEN_DAYS`
- `CORS_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`
- `TRUSTED_HOSTS`
- `FORCE_HTTPS_REDIRECT`
- `EXPOSE_DOCS`

### Frontend (.env)

Referencia: [frontend/.env.example](frontend/.env.example)

- `VITE_API_BASE_URL` (ejemplo: `http://127.0.0.1:8000/api/v1`)
- `VITE_TOKEN_STORAGE` (`session` recomendado, o `local`)

## Seguridad implementada

Backend:

- CORS configurable y restringido.
- Trusted hosts middleware.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.).
- Redireccion HTTPS opcional (`FORCE_HTTPS_REDIRECT`).
- Validaciones de configuracion para entorno productivo.
- JWT firmado con HMAC SHA-256.
- Control de acceso por rol en endpoints.
- Logout autenticado.

Frontend:

- Rutas protegidas por rol.
- Manejo de sesion con token bearer.
- Almacenamiento de token configurable (`session` por defecto).
- Error boundary global para evitar pantalla de fallo cruda.

## Roles y permisos de aplicacion

- `admin`
  - Gestion de usuarios.
  - CRUD de catalogos.
  - Ajustes de inventario.
  - Registro y lectura de movimientos.
  - Acceso a reportes.

- `almacenista`
  - Consulta de catalogos e inventario.
  - Registro de movimientos.
  - Sin acceso a gestion de usuarios/catalogos administrativos.

- `supervisor`
  - Consulta de dashboard, inventario e historial.
  - Sin operaciones de escritura.

## Objetos SQL del proyecto

Definidos en [backend/sql/proyecto.sql](backend/sql/proyecto.sql):

- Vistas:
  - `vista_inventario_actual`
  - `vista_historial_movimientos`
- Funciones:
  - `fn_nivel_stock`
  - `fn_consultar_inventario`
- Procedimientos:
  - `sp_registrar_movimiento_completo`
  - `sp_consultar_inventario`
- Trigger:
  - `tr_evitar_stock_negativo`

Uso desde API:

- Reportes en [backend/app/api/v1/endpoints/reports.py](backend/app/api/v1/endpoints/reports.py)
- Movimientos transaccionales en [backend/app/api/v1/endpoints/movements.py](backend/app/api/v1/endpoints/movements.py)

## Endpoints principales

Routers registrados en [backend/app/api/v1/api.py](backend/app/api/v1/api.py):

- Auth
- Users
- Catalogs (categorias, proveedores, productos, almacenes, inventario)
- Movimientos
- Reportes
- Health

Base path API:

- `/api/v1`

## Frontend: modulos funcionales

Paginas principales en [frontend/src/app/pages](frontend/src/app/pages):

- `Login`
- `Dashboard`
- `Productos`
- `Proveedores`
- `Almacenes`
- `Categorias`
- `Movimientos`
- `Inventario` (incluye export CSV)
- `Historial`

## Pruebas y validaciones

Actualmente el repositorio no incluye scripts de pruebas automatizadas dedicados.

Validacion recomendada:

1. Levantar backend y frontend.
2. Probar autenticacion con los tres roles (`admin`, `almacenista`, `supervisor`).
3. Verificar CRUD de catalogos y productos.
4. Verificar registro de movimientos y reportes.

## Despliegue recomendado

### Opcion recomendada

- Frontend en Vercel.
- Backend FastAPI en Render/Railway/Fly/VM.
- MariaDB/MySQL gestionada fuera de Vercel.

### Nota importante sobre Vercel

Vercel no hospeda MariaDB de forma nativa para este caso. La BD debe vivir en un servicio externo accesible por red.

### Checklist minimo de produccion

1. `APP_ENV=production`
2. `DEBUG=false`
3. `AUTH_SECRET_KEY` fuerte y unica
4. `CORS_ORIGINS` con dominios reales
5. `TRUSTED_HOSTS` con hostnames reales
6. `FORCE_HTTPS_REDIRECT=true` (si tu infra termina TLS correctamente)
7. `EXPOSE_DOCS=false`

## Troubleshooting rapido

- Error `401`: revisa token bearer o login.
- Error `403`: rol insuficiente para endpoint/pagina.
- Error `409` al borrar: hay relaciones activas (integridad referencial).
- Error `ws://localhost:5173`: se cayo o reinicio el servidor de Vite, reinicia `pnpm dev`.

## Licencia

Uso academico/proyecto universitario.
