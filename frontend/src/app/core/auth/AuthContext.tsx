import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole } from '../../shared/data/mockData';
import { apiRequest, getStoredAccessToken, setStoredAccessToken } from '../../shared/api/client';

export interface SessionUser {
  username: string;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  currentUser: SessionUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedToken = getStoredAccessToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await apiRequest<SessionUser>('/auth/me');
        setCurrentUser(profile);
      } catch {
        setStoredAccessToken(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ accessToken: string; refreshToken: string; user: SessionUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setStoredAccessToken(response.accessToken);
      setCurrentUser(response.user);
      return true;
    } catch {
      setStoredAccessToken(null);
      setCurrentUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // If the session is already invalid, just clear the local state.
    }

    setStoredAccessToken(null);
    setCurrentUser(null);
  };

  const hasAccess = (allowedRoles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
