import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  
  const login = async (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    await AsyncStorage.setItem('authToken', tokenValue);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (e) {
      console.log('Error en logout:', e);
    }
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  };

  
  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoadingAuth(false);
    };
    loadSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      loadingAuth,
      isDarkTheme,
      toggleTheme,
    }),
    [user, token, isDarkTheme, loadingAuth]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
