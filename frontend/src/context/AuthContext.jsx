import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserSession() {
      const storedUser = localStorage.getItem('qb_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }

      try {
        if (api.token) {
          const res = await api.getSession();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('qb_user', JSON.stringify(res.user));
          }
        }
      } catch (err) {
        // Token expired or invalid
        api.setToken(null);
        localStorage.removeItem('qb_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserSession();
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem('qb_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    api.setToken(null);
    localStorage.removeItem('qb_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
