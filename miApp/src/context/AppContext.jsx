import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  
  const login = async (userData, tokenValue, adminStatus = false) => {
    setUser(userData);
    setToken(tokenValue);
    setIsAdmin(adminStatus);
    await AsyncStorage.setItem('authToken', tokenValue);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('isAdmin', JSON.stringify(adminStatus));
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (e) {
      console.log('Error en logout:', e);
    }
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isAdmin');
  };

  
  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedIsAdmin = await AsyncStorage.getItem('isAdmin');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAdmin(storedIsAdmin ? JSON.parse(storedIsAdmin) : false);
      }
      setLoadingAuth(false);
    };
    loadSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAdmin,
      login,
      logout,
      loadingAuth,
      isDarkTheme,
      toggleTheme,
    }),
    [user, token, isAdmin, isDarkTheme, loadingAuth]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
