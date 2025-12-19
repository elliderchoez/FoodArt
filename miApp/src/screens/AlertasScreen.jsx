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
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Componente de Alerta
const AlertItem = ({ alerta }) => (
  <View style={styles.alertCard}>
    <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
    <Text style={styles.alertTitle}>{alerta.titulo}</Text>
    <Text style={styles.alertDescription}>{alerta.descripcion}</Text>
    <Text style={styles.alertDate}>
      {new Date(alerta.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </Text>
  </View>
);

export const AlertasScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarAlertas();
      return () => {};
    }, [])
  );

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      // Las alertas se cargarán desde la base de datos más adelante
      setAlertas([]);
    } catch (error) {
      console.error('Error cargando alertas:', error);
      Alert.alert('Error', 'No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
    }
  };

  const irA = (pantalla) => {
    navigation.navigate(pantalla);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mis alertas</Text>
      </View>

      {/* Alertas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : alertas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bell-outline" size={64} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No tienes alertas</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Las nuevas alertas aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <AlertItem alerta={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Home')}>
          <Icon name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Buscar')}>
          <Icon name="magnify" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('CrearReceta')}>
          <Icon name="plus-circle" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Alertas')}>
          <Icon name="bell-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Perfil')}>
          <Icon name="account-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
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
  alertMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  alertDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
