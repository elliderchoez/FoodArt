// Configuración de la API
// Para Android Emulator: http://10.0.2.2:8000/api
// Para Android/iOS físico: http://192.168.100.97:8000/api
export const API_URL = 'http://192.168.100.97:8000/api';

export const apiCall = async (endpoint, options = {}) => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};
