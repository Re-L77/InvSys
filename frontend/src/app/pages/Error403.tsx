import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';

export function Error403() {
  const { currentUser } = useAuth();

  const getRoleName = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'Administrador';
      case 'almacenista':
        return 'Almacenista';
      case 'supervisor':
        return 'Supervisor';
      default:
        return currentUser?.role || 'Usuario';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-2xl">
              <ShieldAlert className="text-red-600" size={64} />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              !
            </div>
          </div>
        </div>

        <div className="inline-block px-6 py-2 bg-red-50 border-2 border-red-200 rounded-full mb-6">
          <span className="text-red-700 font-bold text-sm">ERROR 403</span>
        </div>

        <h2 className="text-4xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>

        <p className="text-gray-600 mb-3 text-lg">
          No tienes permisos para acceder a esta sección.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Tu rol actual:</p>
          <p className="text-xl font-bold text-gray-900">{getRoleName()}</p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-md"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
