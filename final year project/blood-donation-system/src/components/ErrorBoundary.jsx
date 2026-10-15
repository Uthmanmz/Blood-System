import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <main className="recovery-page">
        <section className="recovery-panel" role="alert">
          <p className="recovery-label">APPLICATION ERROR</p>
          <h1>This page could not be displayed</h1>
          <p>{error.message}</p>

          <button className="recovery-button" type="button" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
