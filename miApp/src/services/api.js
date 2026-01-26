// Configuración de la API
// Cambia la IP según la red local:
export const API_URL = 'http://192.168.100.29:8000/api';

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

export const getRecetaRating = async (recetaId) => {
  const res = await apiCall(`/recetas/${recetaId}/rating`, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error fetching rating: ${res.status} ${text}`);
  }
  return res.json();
};

export const postRecetaRating = async (recetaId, rating) => {
  const body = JSON.stringify({ rating });
  const res = await apiCall(`/recetas/${recetaId}/rating`, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error posting rating: ${res.status} ${text}`);
  }
  return res.json();
};
