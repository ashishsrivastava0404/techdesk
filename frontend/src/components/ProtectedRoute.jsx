import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Protected Route - requires authentication
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'tech') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

/**
 * Public Route - only accessible when logged out
 * Redirects to dashboard if already authenticated
 */
export function PublicRoute({ children }) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'tech') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

/**
 * Admin Route - only accessible by admins
 */
export function AdminRoute({ children }) {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Tech Route - only accessible by technicians (or admins who can access tech features)
 */
export function TechRoute({ children }) {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow both techs and admins to access tech features
  if (user.role !== 'tech' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
