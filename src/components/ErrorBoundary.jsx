
import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WAYMARK React Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <div className="error-content">
            <AlertTriangle size={35} />

            <span className="eyebrow">WAYMARK SYSTEM ERROR</span>

            <h1>Something interrupted your journey.</h1>

            <p>
              An unexpected application error occurred.
              Your account data has not intentionally been deleted.
            </p>

            <button
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={17} />
              Reload application
            </button>

            {import.meta.env.DEV && (
              <pre className="error-details">
                {this.state.error?.stack ||
                  this.state.error?.message}
              </pre>
            )}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
