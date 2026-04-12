import { RouterProvider } from 'react-router';
import { AuthProvider } from './core/auth/AuthContext';
import { router } from './routing/routes';
import { Toaster } from 'sonner';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
      <Toaster position="top-right" richColors theme="light" />
    </AuthProvider>
  );
}