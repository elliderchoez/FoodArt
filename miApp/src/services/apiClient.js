import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'http://192.168.100.13:8000/api';

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Normalizar respuesta de cuenta bloqueada
    if (status === 403 && (data?.code === 'ACCOUNT_BLOCKED' || data?.message === 'Tu cuenta ha sido bloqueada')) {
      error.isAccountBlocked = true;
      error.blockReason = data?.reason || null;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
