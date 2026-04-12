import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../core/auth/AuthContext';
import { UserRole } from '../shared/data/mockData';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!currentUser) {
      navigate('/login');
    } else if (!allowedRoles.includes(currentUser.role)) {
      navigate('/403');
    }
  }, [currentUser, allowedRoles, navigate, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600">
        Cargando sesión...
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return <>{children}</>;
}
