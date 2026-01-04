import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import {
  requestNotificationPermissions,
  registerDeviceToken,
  saveNotificationToStorage,
} from './src/services/notificationService';

// Configurar cómo se muestran las notificaciones en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    setupNotifications();

    // Cleanup al desmontar el componente
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Solicitar permisos
      console.log('🔔 Solicitando permisos de notificación...');
      const permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        console.warn('⚠️ Permisos de notificación denegados');
        return;
      }

      console.log('✅ Permisos de notificación otorgados');

      // Registrar token del dispositivo
      console.log('📱 Registrando token del dispositivo...');
      const token = await registerDeviceToken();
      if (token) {
        console.log('✅ Token registrado:', token.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ No se pudo obtener el token (verifica projectId en app.json)');
      }

      // Listener para notificaciones recibidas en foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(
        async (notification) => {
          console.log('📨 Notificación recibida (foreground):', {
            title: notification.request.content.title,
            body: notification.request.content.body,
          });

          // Guardar en almacenamiento local
          await saveNotificationToStorage(notification.request.content);
        }
      );

      // Listener para cuando el usuario presiona en una notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          console.log('👆 Usuario presionó notificación:', {
            title: response.notification.request.content.title,
            data: response.notification.request.content.data,
          });

          // Las acciones específicas se manejarán en AlertasScreen
          // Esta notificación será refrescada cuando se abra la app
        }
      );

      console.log('✅ Sistema de notificaciones inicializado correctamente');
    } catch (error) {
      console.error('❌ Error configurando notificaciones:', error);
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <>
          <AppNavigator />
          <StatusBar style="auto" />
        </>
      </NotificationProvider>
    </ThemeProvider>
  );
}

