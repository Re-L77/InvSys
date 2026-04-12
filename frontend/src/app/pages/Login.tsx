import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../core/auth/AuthContext';
import { AlertCircle, Package } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image with overlay */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A5F] via-[#2d5a8f] to-[#1E3A5F] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 text-white text-center px-12">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
              <Package className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">InvSys</h1>
          <p className="text-xl text-white/80 font-medium">Sistema de Gestión de Inventarios</p>
          <p className="text-white/60 mt-3 max-w-md mx-auto">Control total de productos, almacenes y movimientos en tiempo real</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-4">
              <span className="text-blue-700 text-sm font-semibold">Bienvenido de nuevo</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_user"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent bg-white shadow-sm transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent bg-white shadow-sm transition-all"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={18} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-md"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Contacta al administrador si no tienes acceso
          </p>

          {/* Demo credentials helper */}
          <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl text-xs">
            <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Credenciales de prueba
            </p>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold">Admin:</span>
                <span className="font-mono">admin_user / Admin123!</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Almacenista:</span>
                <span className="font-mono">almacen_user / Almacen123!</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Supervisor:</span>
                <span className="font-mono">super_user / Super123!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
