import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useNotificationCount } from '../context/NotificationContext';
import { BottomNavBar } from '../components/BottomNavBar';
import { AdminBottomNavBar } from '../components/AdminBottomNavBar';
import {
  getStoredNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notificationService';

// Componente de Alerta mejorado
const AlertItem = ({ alerta, onPress, onDelete, colors }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'comment-multiple';
      case 'follow':
        return 'account-plus';
      case 'recipe':
        return 'chef-hat';
      default:
        return 'bell';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'like':
        return '#FF6B6B';
      case 'comment':
        return '#4ECDC4';
      case 'follow':
        return '#95E1D3';
      case 'recipe':
        return '#FFE66D';
      default:
        return '#D4AF37';
    }
  };

  const typeColor = getColorForType(alerta.data?.type);

  return (
    <TouchableOpacity
      style={[
        styles.alertCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: alerta.read ? colors.border : typeColor,
          opacity: alerta.read ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${typeColor}20` },
          ]}
        >
          <Icon name={getIconForType(alerta.data?.type)} size={20} color={typeColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {alerta.title}
          </Text>
          {!alerta.read && (
            <View style={[styles.badge, { backgroundColor: typeColor }]} />
          )}
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Icon name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.alertBody, { color: colors.textSecondary }]}>
        {alerta.body}
      </Text>
      <Text style={[styles.alertDate, { color: colors.textTertiary }]}>
        {new Date(alerta.timestamp).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );
};

export const AlertasScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { isAdmin } = useAppContext();
  const { setUnreadCount: setGlobalUnreadCount } = useNotificationCount();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      cargarAlertas();
      return () => {};
    }, [])
  );

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      // Obtener notificaciones del backend
      const { data } = await apiClient.get(`/notifications`);
      setAlertas(data);
      // Contar no leídas
      const noLeidas = data.filter((n) => !n.read).length;
      setUnreadCount(noLeidas);
      setGlobalUnreadCount(noLeidas); // Actualizar el contexto global
    } catch (error) {
      console.error('Error cargando alertas:', error);
      // Fallback a almacenamiento local
      const notificaciones = await getStoredNotifications();
      setAlertas(notificaciones);
      const noLeidas = notificaciones.filter((n) => !n.read).length;
      setGlobalUnreadCount(noLeidas);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (alerta) => {
    try {
      // Marcar como leída en el backend
      await apiClient.put(`/notifications/${alerta.id}/read`);

      setAlertas((prev) => {
        const actualizado = prev.map((n) => (n.id === alerta.id ? { ...n, read: true } : n));
        // Actualizar el conteo de notificaciones no leídas
        const noLeidas = actualizado.filter((n) => !n.read).length;
        setGlobalUnreadCount(noLeidas);
        return actualizado;
      });

      // Navegar según el tipo de notificación
      if (alerta.data?.type === 'recipe' && alerta.data?.recipeId) {
        // Si es like/comentario de una receta, mostrar detalles
        navigation.navigate('DetalleReceta', { id: alerta.data.recipeId });
      }

      if ((alerta.data?.type === 'report_reviewed' || alerta.data?.type === 'warning') && alerta.data?.recipeId) {
        navigation.navigate('DetalleReceta', { id: alerta.data.recipeId });
      }
      
      if ((alerta.data?.type === 'like' || alerta.data?.type === 'comment') && alerta.data?.userId) {
        // Ir al perfil de quien dio like/comentó
        navigation.navigate('UsuarioPerfil', { usuarioId: alerta.data.userId });
      }
      
      if (alerta.data?.type === 'follow' && alerta.data?.userId) {
        // Ir al perfil de quien te sigue
        navigation.navigate('UsuarioPerfil', { usuarioId: alerta.data.userId });
      }
    } catch (error) {
      console.error('Error al procesar notificación:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setAlertas((prev) => {
        const actualizado = prev.filter((n) => n.id !== notificationId);
        // Actualizar el conteo de notificaciones no leídas
        const noLeidas = actualizado.filter((n) => !n.read).length;
        setGlobalUnreadCount(noLeidas);
        return actualizado;
      });
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar alertas',
      '¿Eliminar todas las alertas?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            await clearAllNotifications();
            setAlertas([]);
            setGlobalUnreadCount(0);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const irA = (pantalla) => {
    navigation.navigate(pantalla);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mis alertas
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {alertas.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={[styles.clearButton, { color: colors.primary }]}>
              Limpiar todo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alertas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : alertas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bell-outline" size={64} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No tienes alertas
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Las nuevas alertas aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertItem
              alerta={item}
              onPress={() => handleNotificationPress(item)}
              onDelete={() => handleDeleteNotification(item.id)}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isAdmin ? (
        <AdminBottomNavBar navigation={navigation} currentRoute="Alertas" colors={colors} />
      ) : (
        <BottomNavBar navigation={navigation} currentRoute="Alertas" colors={colors} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertBody: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 52,
  },
  alertDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 52,
  },
  deleteButton: {
    padding: 8,
  },
});
