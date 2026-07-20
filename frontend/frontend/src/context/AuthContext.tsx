import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../lib/types';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loginWithDemo: (role?: 'user' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ceyloncart_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ceyloncart_token');
      if (storedToken) {
        try {
          const data = await getCurrentUser();
          setUser(data.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          localStorage.removeItem('ceyloncart_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('ceyloncart_token', newToken);
    setToken(newToken);
    setUser(newUser);
    closeAuthModal();
  };

  const login = async (payload: LoginPayload) => {
    const res = await loginUser(payload);
    if (res.success && res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
    } else {
      throw new Error(res.message || 'Failed to login');
    }
  };

  const register = async (payload: RegisterPayload) => {
    const res = await registerUser(payload);
    if (res.success && res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
    } else {
      throw new Error(res.message || 'Failed to register');
    }
  };

  const loginWithDemo = async (role: 'user' | 'admin' = 'user') => {
    const credentials = role === 'admin'
      ? { email: 'admin@ceyloncart.com', password: 'password123' }
      : { email: 'user@ceyloncart.com', password: 'password123' };

    await login(credentials);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      localStorage.removeItem('ceyloncart_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        loginWithDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
