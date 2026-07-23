import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Check for existing auth session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await api.auth.verify();
        setUser(response.user);
      }
    } catch (error) {
      // Token is invalid or expired
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
    return response;
  }, []);

  // Register function
  const register = useCallback(async (email, password, name, role) => {
    const response = await api.auth.register(email, password, name, role);
    setUser(response.user);
    return response;
  }, []);

  // Logout function
  const logout = useCallback(async () => {
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
      requireName
    }}>
      {children}
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
