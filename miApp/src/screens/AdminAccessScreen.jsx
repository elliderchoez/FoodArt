import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export const AdminAccessScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const adminOptions = [
    {
      id: 'dashboard',
      title: 'Panel Principal',
      description: 'Estadísticas y acceso rápido',
      icon: 'view-dashboard',
      color: '#3B82F6',
      screen: 'AdminDashboard',
    },
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Crear, editar, bloquear usuarios',
      icon: 'account-multiple',
      color: '#10B981',
      screen: 'AdminUsuarios',
    },
    {
      id: 'recetas',
      title: 'Gestión de Recetas',
      description: 'Editar o eliminar recetas',
      icon: 'chef-hat',
      color: '#F59E0B',
      screen: 'AdminRecetas',
    },
    {
      id: 'reportes',
      title: 'Gestión de Reportes',
      description: 'Revisar y resolver reportes',
      icon: 'alert-circle',
      color: '#EF4444',
      screen: 'AdminReports',
    },
    {
      id: 'logs',
      title: 'Logs del Sistema',
      description: 'Historial de acciones',
      icon: 'history',
      color: '#8B5CF6',
      screen: 'AdminLogs',
    },
    {
      id: 'parametros',
      title: 'Configuración',
      description: 'Parámetros del sistema',
      icon: 'cog',
      color: '#6366F1',
      screen: 'AdminParameters',
    },
    {
      id: 'backups',
      title: 'Backups',
      description: 'Crear y gestionar backups',
      icon: 'cloud-upload',
      color: '#EC4899',
      screen: 'AdminBackups',
    },
  ];

  const AdminCard = ({ option }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate(option.screen)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: option.color + '20', borderColor: option.color },
        ]}
      >
        <Icon name={option.icon} size={28} color={option.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{option.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {option.description}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {adminOptions.map((option) => (
          <AdminCard key={option.id} option={option} />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
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
    marginRight: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
});
