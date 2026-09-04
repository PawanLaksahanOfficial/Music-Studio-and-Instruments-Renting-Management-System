import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Catches render errors so one broken page shows a recoverable message
 * instead of unmounting the whole app to a blank white screen.
 */
class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Replace with a reporting service (App Insights) when one is wired up.
        console.error('Unhandled render error:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="admin-content">
                <div className="card" role="alert">
                    <h2>Something went wrong on this page</h2>
                    <p className="muted mt-4">
                        The error has been logged. You can try again, or go back to the dashboard.
                    </p>
                    {import.meta.env.DEV && (
                        <pre className="mono text-sm mt-4" style={{ whiteSpace: 'pre-wrap', color: 'var(--c-danger)' }}>
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="btn-group mt-5">
                        <button type="button" className="btn btn--primary" onClick={() => this.setState({ error: null })}>
                            Try again
                        </button>
                        <button type="button" className="btn" onClick={() => window.location.assign('/admin')}>
                            Back to dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
