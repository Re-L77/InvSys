import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled frontend error', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-gray-200 shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-red-600 text-2xl font-bold mb-6">
              !
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">La aplicación encontró un error</h1>
            <p className="text-gray-600 mb-8">
              Hemos mostrado esta pantalla para evitar que la interfaz cruda del router interrumpa la experiencia.
              Puedes volver a intentar cargar la app.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}