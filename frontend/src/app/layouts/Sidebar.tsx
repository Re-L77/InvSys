import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Package,
  Users,
  Warehouse,
  FolderTree,
  ArrowRightLeft,
  Archive,
  History,
  LogOut
} from 'lucide-react';
import { useAuth } from '../core/auth/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['admin', 'almacenista', 'supervisor']
    },
    {
      path: '/productos',
      icon: Package,
      label: 'Productos',
      roles: ['admin', 'almacenista']
    },
    {
      path: '/proveedores',
      icon: Users,
      label: 'Proveedores',
      roles: ['admin']
    },
    {
      path: '/almacenes',
      icon: Warehouse,
      label: 'Almacenes',
      roles: ['admin']
    },
    {
      path: '/categorias',
      icon: FolderTree,
      label: 'Categorías',
      roles: ['admin']
    },
    {
      path: '/movimientos',
      icon: ArrowRightLeft,
      label: 'Movimientos',
      roles: ['admin', 'almacenista']
    },
    {
      path: '/inventario',
      icon: Archive,
      label: 'Inventario',
      roles: ['admin', 'almacenista', 'supervisor']
    },
    {
      path: '/historial',
      icon: History,
      label: 'Historial',
      roles: ['admin', 'supervisor']
    },
  ];

  const visibleItems = menuItems.filter(item =>
    item.roles.includes(currentUser.role as any)
  );

  const getRoleBadgeColor = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'bg-blue-500';
      case 'almacenista':
        return 'bg-green-500';
      case 'supervisor':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="w-20 bg-white border-r border-gray-200 h-screen flex flex-col items-center py-6">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-[#2d5a8f] flex items-center justify-center">
          <Package className="text-white" size={24} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full flex flex-col items-center gap-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative"
              title={item.label}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#1E3A5F] text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-[#1E3A5F]'
                }`}
              >
                <Icon size={22} />
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="mt-auto pt-4 border-t border-gray-200 w-full flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
          {getInitials(currentUser.displayName)}
        </div>
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
