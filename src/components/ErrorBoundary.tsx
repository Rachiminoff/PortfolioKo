import React from 'react';

interface State {
  hasError: boolean;
}

/** Catches render/chunk-load errors so visitors see a recoverable message, not a blank page. */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="app-loading" role="alert">
        <div style={{ textAlign: 'center', padding: '1.5rem', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ opacity: 0.75, marginBottom: '1.25rem' }}>
            The page failed to load, which can happen right after the site is updated. Reloading
            usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.2rem',
              border: '1px solid currentColor',
              background: 'transparent',
              color: 'inherit',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
