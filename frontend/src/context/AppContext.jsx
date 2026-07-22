import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const savedName = localStorage.getItem('promote_username');
    if (savedName) {
      loadUser(savedName);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (name) => {
    try {
      const userData = await api.users.get(name);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setIdentity,
      setRole,
      showToast,
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
