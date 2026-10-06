import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server who we are (the cookie is sent automatically).
  useEffect(() => {
    api.auth.me().then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    login: async (b) => setUser((await api.auth.login(b)).user),
    register: async (b) => setUser((await api.auth.register(b)).user),
    logout: async () => { await api.auth.logout().catch(() => {}); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
