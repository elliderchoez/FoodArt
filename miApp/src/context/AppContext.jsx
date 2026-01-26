import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import * as Notifications from 'expo-notifications';
import { consumeWarningPopupOnce, saveNotificationToStorage } from '../services/notificationService';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState(null);

  
  const login = async (userData, tokenValue, adminStatus = false) => {
    setUser(userData);
    setToken(tokenValue);
    setIsAdmin(adminStatus);
    setIsBlocked(!!userData?.is_blocked);
    setBlockedReason(userData?.block_reason || null);
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
    setIsBlocked(false);
    setBlockedReason(null);
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
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAdmin(storedIsAdmin ? JSON.parse(storedIsAdmin) : false);
        setIsBlocked(!!parsedUser?.is_blocked);
        setBlockedReason(parsedUser?.block_reason || null);
      }
      setLoadingAuth(false);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const checkBlockedAndWarnings = async () => {
      try {
        const userResp = await apiClient.get('/user');
        const freshUser = userResp?.data;

        if (!isMounted) return;

        if (freshUser) {
          setUser(freshUser);
          setIsBlocked(!!freshUser?.is_blocked);
          setBlockedReason(freshUser?.block_reason || null);
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        }

        // Mostrar popup de advertencia aunque el usuario no abra la pantalla Alertas
        const notifResp = await apiClient.get('/notifications');
        const notifs = Array.isArray(notifResp?.data) ? notifResp.data : [];
        const firstUnreadWarning = notifs.find((n) => !n.read && n?.data?.type === 'warning');
        if (firstUnreadWarning) {
          const shouldShow = await consumeWarningPopupOnce({ notificationId: firstUnreadWarning.id });
          if (shouldShow) {
            Alert.alert(firstUnreadWarning.title || '⚠️ Advertencia de moderación', firstUnreadWarning.body || '');
          }
        }
      } catch (error) {
        // Si el backend ya devuelve ACCOUNT_BLOCKED por middleware, también lo reflejamos acá
        const status = error?.response?.status;
        const data = error?.response?.data;
        if (status === 403 && (data?.code === 'ACCOUNT_BLOCKED' || data?.message === 'Tu cuenta ha sido bloqueada')) {
          if (!isMounted) return;
          setIsBlocked(true);
          setBlockedReason(data?.reason || null);
        }
      }
    };

    // Check inicial
    checkBlockedAndWarnings();

    // Re-check al volver al foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkBlockedAndWarnings();
      }
    });

    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, [token]);

  useEffect(() => {
    const showWarningPopupIfNeeded = async (content) => {
      const title = content?.title || '⚠️ Advertencia de moderación';
      const body = content?.body || '';
      const data = content?.data || {};

      // Solo para el reportado: warnings de moderación.
      if (data?.type !== 'warning') return;

      const shouldShow = await consumeWarningPopupOnce(data);
      if (!shouldShow) return;

      Alert.alert(title, body || 'Tu contenido fue reportado y se aplicó una medida de moderación.');
    };

    const receivedSub = Notifications.addNotificationReceivedListener(async (notification) => {
      try {
        const content = notification?.request?.content;
        if (!content) return;

        // Guardar en historial local (fallback si backend no responde)
        await saveNotificationToStorage({
          title: content.title,
          body: content.body,
          data: content.data,
        });

        await showWarningPopupIfNeeded(content);
      } catch (error) {
        console.error('Error manejando notificación recibida:', error);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      try {
        const content = response?.notification?.request?.content;
        if (!content) return;
        await showWarningPopupIfNeeded(content);
      } catch (error) {
        console.error('Error manejando respuesta de notificación:', error);
      }
    });

    return () => {
      receivedSub?.remove?.();
      responseSub?.remove?.();
    };
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
      isBlocked,
      blockedReason,
    }),
    [user, token, isAdmin, isDarkTheme, loadingAuth, isBlocked, blockedReason]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
