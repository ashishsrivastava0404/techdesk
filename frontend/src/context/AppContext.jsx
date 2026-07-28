import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/index.js';

const AppContext = createContext(null);

// Idle timeout in milliseconds (15 minutes)
const IDLE_TIMEOUT = 15 * 60 * 1000;
// Warning before logout (1 minute before)
const IDLE_WARNING = 14 * 60 * 1000;

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const authChecked = useRef(false);
  const lastActivity = useRef(Date.now());
  const idleTimer = useRef(null);
  const warningTimer = useRef(null);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();
    setShowIdleWarning(false);
    
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    if (user) {
      // Set warning timer (14 minutes)
      warningTimer.current = setTimeout(() => {
        setShowIdleWarning(true);
      }, IDLE_WARNING);
      
      // Set logout timer (15 minutes)
      idleTimer.current = setTimeout(() => {
        logout();
        console.log('Session expired due to inactivity. Please login again.');
      }, IDLE_TIMEOUT);
    }
  }, [user]);

  // Check for existing auth session on mount
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;
    checkAuth();
  }, []);

  // Set up idle detection when user is logged in
  useEffect(() => {
    if (!user) {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      setShowIdleWarning(false);
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle the reset function
    let throttleTimeout = null;
    const throttledReset = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetIdleTimer();
          throttleTimeout = null;
        }, 1000); // Max once per second
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Start the idle timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [user, resetIdleTimer]);

  // Continue session (reset idle timer)
  const continueSession = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await api.auth.verify();
        setUser(response.user);
      }
    } catch (error) {
      // Token is invalid, expired, or server unreachable
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = useCallback(async (email, password) => {
    const response = await api.auth.login(email, password);
    setUser(response.user);
    resetIdleTimer();
    return response;
  }, [resetIdleTimer]);

  // Register function
  const register = useCallback(async (email, password, name, role) => {
    const response = await api.auth.register(email, password, name, role);
    setUser(response.user);
    resetIdleTimer();
    return response;
  }, [resetIdleTimer]);

  // Logout function
  const logout = useCallback(async () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setShowIdleWarning(false);
    await api.auth.logout();
    setUser(null);
  }, []);

  // Legacy function for backward compatibility
  const setIdentity = useCallback(async (name) => {
    if (!name.trim()) return;
    
    localStorage.setItem('promote_username', name);
    try {
      const userData = await api.users.get(name);
      setUser(userData);
    } catch (error) {
      console.error('Error setting identity:', error);
    }
  }, []);

  // Legacy function for backward compatibility
  const setRole = useCallback(async (role) => {
    if (!user) return;
    
    try {
      const updatedUser = await api.users.update(user.name, { role });
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }, [user]);

  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const requireAuth = useCallback(() => {
    if (!user) {
      showToast('Please login first');
      return false;
    }
    return true;
  }, [user, showToast]);

  // Legacy function for backward compatibility
  const requireName = useCallback(() => {
    if (!user?.name) {
      showToast('Enter your name first');
      return false;
    }
    return true;
  }, [user, showToast]);

  return (
    <AppContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      setIdentity,
      setRole,
      showToast,
      requireAuth,
      requireName,
      continueSession
    }}>
      {children}
      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div className="idle-warning-overlay">
          <div className="idle-warning-modal">
            <h3>Session Timeout Warning</h3>
            <p>Your session will expire in 1 minute due to inactivity.</p>
            <p>Click "Continue Session" to stay logged in.</p>
            <div className="idle-warning-buttons">
              <button onClick={logout} className="btn-secondary">Logout Now</button>
              <button onClick={continueSession} className="btn-primary">Continue Session</button>
            </div>
          </div>
        </div>
      )}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.message}</div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
