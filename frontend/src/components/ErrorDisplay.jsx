import { useState } from 'react';

/**
 * Error Display Component
 * User-friendly error messages with retry functionality
 */
export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showCode = false,
  variant = 'default' // 'default', 'inline', 'card'
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract error message and code
  const getErrorInfo = (error) => {
    if (!error) {
      return {
        message: 'An unexpected error occurred',
        code: null,
        details: null
      };
    }

    // Handle different error formats
    if (typeof error === 'string') {
      return { message: error, code: null, details: null };
    }

    // API error response
    if (error.response?.data) {
      const data = error.response.data;
      return {
        message: data.userMessage || data.message || 'An error occurred',
        code: data.code || error.response.status,
        details: data.details || data.errors || null
      };
    }

    // Network error
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NET_001',
        details: null
      };
    }

    // Timeout error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'NET_002',
        details: null
      };
    }

    // Default fallback
    return {
      message: error.userMessage || error.message || 'Something went wrong',
      code: error.code || null,
      details: error.details || null
    };
  };

  const errorInfo = getErrorInfo(error);

  // Get user-friendly message based on error code
  const getFriendlyMessage = (code) => {
    const codeMessages = {
      'AUTH_001': 'Please log in to continue.',
      'AUTH_002': 'Invalid email or password.',
      'AUTH_003': 'Your session has expired. Please log in again.',
      'VAL_001': 'This field is required.',
      'VAL_005': 'Please enter a valid email address.',
      'RES_001': 'The requested resource was not found.',
      'BIZ_003': 'This item already exists.',
      'NET_001': 'Please check your internet connection.',
      'NET_002': 'The request took too long. Please try again.'
    };
    return codeMessages[code] || null;
  };

  const friendlyMessage = getFriendlyMessage(errorInfo.code);
  const displayMessage = friendlyMessage || errorInfo.message;

  // Variants
  if (variant === 'inline') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '14px'
        }}
        role="alert"
      >
        <span>⚠️</span>
        <span>{displayMessage}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#991b1b',
              fontSize: '18px',
              padding: '0 4px'
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center'
        }}
        role="alert"
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#991b1b', fontSize: '14px', marginBottom: '16px' }}>
          {displayMessage}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        backgroundColor: '#fef2f2',
        borderRadius: '12px',
        textAlign: 'center'
      }}
      role="alert"
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#991b1b',
        marginBottom: '8px'
      }}>
        {displayMessage}
      </h3>

      {showCode && errorInfo.code && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          fontFamily: 'monospace',
          marginBottom: '16px'
        }}>
          Error Code: {errorInfo.code}
        </p>
      )}

      {errorInfo.details && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px'
          }}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {isExpanded && errorInfo.details && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            textAlign: 'left',
            maxWidth: '500px',
            overflow: 'auto'
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(errorInfo.details, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
