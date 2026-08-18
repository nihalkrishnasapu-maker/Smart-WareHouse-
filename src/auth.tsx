import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'warehouse_manager' | 'inventory_manager' | 'picker' | 'packer' | 'quality_inspector';
  avatarColor: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  resetPassword: (email: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const mockUsers: Record<string, { password: string; user: User }> = {
  'liam.kowalski@warehouseiq.io': {
    password: 'demo123',
    user: { id: 'E-10', name: 'Liam Kowalski', email: 'liam.kowalski@warehouseiq.io', role: 'warehouse_manager', avatarColor: '#6366f1' },
  },
  'manager@warehouseiq.io': {
    password: 'manager123',
    user: { id: 'E-10', name: 'Liam Kowalski', email: 'manager@warehouseiq.io', role: 'warehouse_manager', avatarColor: '#6366f1' },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('warehouseiq-user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, password: string) => {
    const entry = mockUsers[email.toLowerCase()];
    if (!entry) return { success: false, error: 'No account found with that email address.' };
    if (entry.password !== password) return { success: false, error: 'Incorrect password. Please try again.' };
    setUser(entry.user);
    localStorage.setItem('warehouseiq-user', JSON.stringify(entry.user));
    return { success: true };
  }, []);

  const signup = useCallback((name: string, email: string, _password: string) => {
    if (mockUsers[email.toLowerCase()]) return { success: false, error: 'An account with this email already exists.' };
    const newUser: User = {
      id: `U-${Date.now()}`,
      name,
      email,
      role: 'warehouse_manager',
      avatarColor: '#2b7da6',
    };
    mockUsers[email.toLowerCase()] = { password: _password, user: newUser };
    setUser(newUser);
    localStorage.setItem('warehouseiq-user', JSON.stringify(newUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('warehouseiq-user');
  }, []);

  const resetPassword = useCallback((email: string) => {
    if (!mockUsers[email.toLowerCase()]) return { success: false, error: 'No account found with that email address.' };
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
