import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold mb-3">
            !
          </div>
          <h2 className="text-[#111c2d] text-lg font-bold mb-1">
            {this.props.fallbackTitle || 'Terjadi Kendala Memuat Komponen'}
          </h2>
          <p className="text-[#787583] text-sm max-w-md mb-4">
            {this.state.error?.message || 'Silakan muat ulang halaman ini untuk memperbarui data.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[#4b3f9e] hover:bg-[#3b3280] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
