import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

class UsuarioManager {
  static async sincronizarDesdeAPI(token) {
    try {
      const response = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Guardar datos en AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        return userData;
      } else {
        throw new Error('Error al sincronizar usuario');
      }
    } catch (error) {
      console.error('Error al sincronizar usuario:', error);
      throw error;
    }
  }

  static async obtenerNombre() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.name || parsed.nombre || '';
      }
      return '';
    } catch (error) {
      console.error('Error al obtener nombre:', error);
      return '';
    }
  }

  static async obtenerEmail() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.email || '';
      }
      return '';
    } catch (error) {
      console.error('Error al obtener email:', error);
      return '';
    }
  }

  static async obtenerDatos() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener datos:', error);
      return null;
    }
  }

  static async limpiar() {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error al limpiar datos:', error);
    }
  }
}

export { UsuarioManager };
