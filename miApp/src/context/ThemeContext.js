import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error cargando tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error guardando tema:', error);
    }
  };

  // Colores del tema
  const colors = isDarkMode
    ? {
        // Tema Oscuro
        background: '#121212',
        surface: '#1E1E1E',
        card: '#2A2A2A',
        cardBackground: '#2A2A2A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: '#333333',
        primary: '#D4AF37',
        accent: '#6366F1',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      }
    : {
        // Tema Claro
        background: '#FFFFFF',
        surface: '#F9F9F9',
        card: '#FFFFFF',
        cardBackground: '#F9F9F9',
        text: '#1F2937',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        primary: '#D4AF37',
        accent: '#6366F1',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      };

  const theme = {
    isDarkMode,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {!isLoading && children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};
