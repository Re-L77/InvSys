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
uvicorn app.main:app --reload
```

El backend quedará disponible en:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health`
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

## Notas

- El frontend consume datos mockeados localmente.
- El backend ya tiene estructura lista para conectar endpoints reales a la base de datos.
- El SQL completo está dentro de `backend/sql/` para mantener el proyecto ordenado.
