// Editar receta (usuario normal)
export const updateReceta = async (id, data) => {
  return await apiClient.put(`/recetas/${id}`, data);
};

// Eliminar receta (usuario normal)
export const deleteReceta = async (id) => {
  return await apiClient.delete(`/recetas/${id}`);
};
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'http://192.168.100.103:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
export { API_URL };
