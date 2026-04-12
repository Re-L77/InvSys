import { RouterProvider } from 'react-router';
import { AuthProvider } from './core/auth/AuthContext';
import { router } from './routing/routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors theme="light" />
    </AuthProvider>
  );
}