import { Component } from 'react';

class DemoDataErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    const isDemoDataError = error.name === 'DemoDataError';

    return (
      <main className="recovery-page">
        <section className="recovery-panel" role="alert">
          <p className="recovery-label">FRONTEND RECOVERY</p>
          <h1>
            {isDemoDataError
              ? 'Saved demo data needs attention'
              : 'This page could not be displayed'}
          </h1>
          <p>{error.message}</p>

          {isDemoDataError && (
            <p>
              Your browser record under
              <code> bloodSystemHospitalDemoV1 </code>
              is still intact. Back it up or correct it in your browser’s
              local-storage tools, then reload this page.
            </p>
          )}

          <button className="recovery-button" type="button" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </section>
      </main>
    );
  }
}

export default DemoDataErrorBoundary;
