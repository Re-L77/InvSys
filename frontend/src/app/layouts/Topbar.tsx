import { useAuth } from '../core/auth/AuthContext';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const getRoleBadgeColor = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'almacenista':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'supervisor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleName = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'Administrador';
      case 'almacenista':
        return 'Almacenista';
      case 'supervisor':
        return 'Supervisor';
      default:
        return currentUser.role;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="h-20 bg-white px-8 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Bienvenido de nuevo, {currentUser.displayName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{currentUser.displayName}</p>
          <p className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getRoleBadgeColor()}`}>
            {getRoleName()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
          {getInitials(currentUser.displayName)}
        </div>
      </div>
    </div>
  );
}
