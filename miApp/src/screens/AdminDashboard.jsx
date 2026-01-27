import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { AdminBottomNavBar } from '../components/AdminBottomNavBar';

const screenWidth = Dimensions.get('window').width;

export const AdminDashboard = ({ navigation }) => {
  const { logout, user } = useAppContext();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getStatistics();
      setStatistics(data.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      navigation.replace('Login');
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Deseas cerrar sesión?');
      if (ok) {
        await doLogout();
      }
      return;
    }

    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Cerrar',
        onPress: doLogout,
      },
    ]);
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: color + '20', borderColor: color },
        ]}
      >
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {value || '0'}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const MenuButton = ({ title, icon, color, onPress }) => (
    <TouchableOpacity
      style={[
        styles.menuButton,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <Icon name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Administrador
            </Text>
            
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={toggleTheme}>
              <Icon
                name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 14 }}>
              <Icon name="logout" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>



        {/* Gestión */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Gestión
          </Text>

          <MenuButton
            title="Usuarios"
            icon="account-multiple"
            color="#3B82F6"
            onPress={() => navigation.navigate('AdminUsuarios')}
          />

          <MenuButton
            title="Recetas"
            icon="chef-hat"
            color="#8B5CF6"
            onPress={() => navigation.navigate('AdminRecetas')}
          />

          <MenuButton
            title="Reportes"
            icon="alert-circle"
            color="#F59E0B"
            onPress={() => navigation.navigate('AdminReports')}
          />

          

          <MenuButton
            title="Logs del Sistema"
            icon="history"
            color="#10B981"
            onPress={() => navigation.navigate('AdminLogs')}
          />

          <MenuButton
            title="Parámetros"
            icon="cog"
            color="#6366F1"
            onPress={() => navigation.navigate('AdminParameters')}
          />

          <MenuButton
            title="Backups"
            icon="cloud-upload"
            color="#EC4899"
            onPress={() => navigation.navigate('AdminBackups')}
          />
        </View>

        {/* Sistema */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sistema
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <Icon name="information" size={24} color={colors.info} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Versión 1.0
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Panel de administración completo
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AdminBottomNavBar navigation={navigation} currentRoute="AdminDashboard" colors={colors} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    marginTop: 2,
  },
});
