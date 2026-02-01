import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('🔐 AuthContext Init - Token:', token ? 'EXISTS' : 'NONE');
      console.log('🔐 AuthContext Init - Saved User:', savedUser ? 'EXISTS' : 'NONE');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('✅ Setting user from localStorage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('❌ Error parsing saved user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
      console.log('✅ AuthContext initialized');
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      console.log('✅ Login response:', response.data);
      
      const { token, user: userData } = response.data;

      console.log('💾 Saving to localStorage - Token:', token ? 'EXISTS' : 'MISSING');
      console.log('💾 Saving to localStorage - User:', userData);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      console.log('✅ User state updated:', userData);

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      // Backend returns 'error' not 'message'
      const message = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      // Backend returns 'error' not 'message'
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
