import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicitar permisos para enviar notificaciones
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

/**
 * Registrar el token de notificación del dispositivo
 * Este token se enviará al backend para poder enviar notificaciones push
 */
export const registerDeviceToken = async () => {
  try {
    // Verificar que tengamos projectId configurado
    const projectId = require('../../app.json').expo.projectId;
    if (!projectId) {
      console.warn('⚠️ projectId no está configurado en app.json');
      return null;
    }

    // Intentar obtener el token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    if (token && token.data) {
      console.log('🔔 Token de notificación obtenido exitosamente');
      console.log('   Token:', token.data.substring(0, 30) + '...');
      
      // Guardar el token localmente
      await AsyncStorage.setItem('expoPushToken', token.data);
      return token.data;
    }
    
    console.warn('⚠️ No se pudo obtener el token (token.data está vacío)');
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo token de notificación:', error.message);
    
    // Intentar sin projectId como fallback
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      if (token && token.data) {
        await AsyncStorage.setItem('expoPushToken', token.data);
        return token.data;
      }
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError.message);
    }
    
    return null;
  }
};

/**
 * Obtener el token guardado localmente
 */
export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('expoPushToken');
    return token;
  } catch (error) {
    console.error('Error obteniendo token guardado:', error);
    return null;
  }
};

/**
 * Mostrar notificación local (para testing sin backend)
 */
export const sendLocalNotification = async ({
  title,
  body,
  data = {},
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        badge: 1,
      },
      trigger: { seconds: 1 }, // Se envía en 1 segundo
    });
  } catch (error) {
    console.error('Error enviando notificación local:', error);
  }
};

/**
 * Guardar notificación en almacenamiento local
 * Esto mantiene un historial de notificaciones recibidas
 */
export const saveNotificationToStorage = async (notification) => {
  try {
    const existing = await AsyncStorage.getItem('notificationsHistory');
    const history = existing ? JSON.parse(existing) : [];
    
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: notification.title || 'Notificación',
      body: notification.body || '',
      data: notification.data || {},
      read: false,
    };
    
    history.unshift(newNotification); // Agregar al principio
    
    // Guardar solo las últimas 50 notificaciones
    await AsyncStorage.setItem(
      'notificationsHistory',
      JSON.stringify(history.slice(0, 50))
    );
    
    return newNotification;
  } catch (error) {
    console.error('Error guardando notificación:', error);
  }
};

/**
 * Obtener todas las notificaciones guardadas
 */
export const getStoredNotifications = async () => {
  try {
    const notifications = await AsyncStorage.getItem('notificationsHistory');
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
};

/**
 * Marcar una notificación como leída
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifications = await getStoredNotifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(
      'notificationsHistory',
      JSON.stringify(updated)
    );
    return updated;
  } catch (error) {
    console.error('Error marcando notificación:', error);
  }
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notifications = await getStoredNotifications();
    const updated = notifications.filter((n) => n.id !== notificationId);
    await AsyncStorage.setItem(
      'notificationsHistory',
      JSON.stringify(updated)
    );
    return updated;
  } catch (error) {
    console.error('Error eliminando notificación:', error);
  }
};

/**
 * Limpiar todas las notificaciones
 */
export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.setItem('notificationsHistory', JSON.stringify([]));
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
  }
};

/**
 * Contar notificaciones no leídas
 */
export const getUnreadCount = async () => {
  try {
    const notifications = await getStoredNotifications();
    return notifications.filter((n) => !n.read).length;
  } catch (error) {
    console.error('Error contando no leídas:', error);
    return 0;
  }
};

// ====== Pop-up de advertencia (solo una vez) ======

const buildWarningPopupStorageKey = (data = {}) => {
  const reportId = data?.reportId ?? data?.report_id;
  const notificationId = data?.notificationId ?? data?.notification_id;
  const recetaId = data?.recetaId ?? data?.recipeId;
  const comentarioId = data?.comentarioId ?? data?.comentario_id;
  const action = data?.action ?? 'none';

  if (reportId) return `warningPopupShown:report:${String(reportId)}`;
  if (notificationId) return `warningPopupShown:notification:${String(notificationId)}`;

  // Fallback razonable (por si no viene reportId)
  return `warningPopupShown:fallback:${String(recetaId ?? 'x')}:${String(comentarioId ?? 'x')}:${String(action)}`;
};

// Devuelve true solo la primera vez para ese reporte/notificación.
export const consumeWarningPopupOnce = async (data = {}) => {
  try {
    const key = buildWarningPopupStorageKey(data);
    const existing = await AsyncStorage.getItem(key);
    if (existing === '1') return false;
    await AsyncStorage.setItem(key, '1');
    return true;
  } catch (error) {
    console.error('Error consumiendo warning popup:', error);
    // En caso de error, evitar spamear: no mostrar popup.
    return false;
  }
};
