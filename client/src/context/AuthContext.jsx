import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const PERMS = {
  admin:    { search: true, export: true, add: true, edit: true, del: true, roles: true },
  manager:  { search: true, export: true, add: false, edit: true, del: false, roles: false },
  employee: { search: false, export: false, add: false, edit: false, del: false, roles: false }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (username, password, fullname) => {
    await api.post('/auth/register', { username, password, fullname });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const can = (action) => {
    if (!user) return false;
    return PERMS[user.role]?.[action] || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
