import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error information for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          minHeight: '300px',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#991b1b',
            marginBottom: '12px'
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
            maxWidth: '500px'
          }}>
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          
          {showDetails && error && (
            <div style={{
              backgroundColor: '#fee2e2',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxWidth: '600px',
              textAlign: 'left',
              fontSize: '14px',
              fontFamily: 'monospace',
              overflow: 'auto'
            }}>
              <strong>Error:</strong> {error.message || 'Unknown error'}
              {errorInfo?.componentStack && (
                <>
                  <br /><br />
                  <strong>Stack trace:</strong>
                  <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
