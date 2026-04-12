import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Productos } from '../pages/Productos';
import { Proveedores } from '../pages/Proveedores';
import { Almacenes } from '../pages/Almacenes';
import { Categorias } from '../pages/Categorias';
import { Movimientos } from '../pages/Movimientos';
import { Inventario } from '../pages/Inventario';
import { Historial } from '../pages/Historial';
import { Error403 } from '../pages/Error403';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'almacenista', 'supervisor']}>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/productos',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'almacenista']}>
        <Productos />
      </ProtectedRoute>
    )
  },
  {
    path: '/proveedores',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Proveedores />
      </ProtectedRoute>
    )
  },
  {
    path: '/almacenes',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Almacenes />
      </ProtectedRoute>
    )
  },
  {
    path: '/categorias',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Categorias />
      </ProtectedRoute>
    )
  },
  {
    path: '/movimientos',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'almacenista']}>
        <Movimientos />
      </ProtectedRoute>
    )
  },
  {
    path: '/inventario',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'almacenista', 'supervisor']}>
        <Inventario />
      </ProtectedRoute>
    )
  },
  {
    path: '/historial',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
        <Historial />
      </ProtectedRoute>
    )
  },
  {
    path: '/403',
    element: <Error403 />
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
