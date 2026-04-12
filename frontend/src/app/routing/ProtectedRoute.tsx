import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../core/auth/AuthContext';
import { UserRole } from '../shared/data/mockData';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!allowedRoles.includes(currentUser.role)) {
      navigate('/403');
    }
  }, [currentUser, allowedRoles, navigate]);

  if (!currentUser) {
    return null;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return <>{children}</>;
}
