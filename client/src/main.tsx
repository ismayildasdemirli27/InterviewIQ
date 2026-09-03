import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.scss'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#fff", background: "#0f172a", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2>Bir xəta baş verdi</h2>
          <pre style={{ color: "#ef4444" }}>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1rem", marginTop: "1rem", cursor: "pointer" }}>
            Yenilə
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)