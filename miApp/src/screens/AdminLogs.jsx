import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';

export const AdminLogs = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('todos'); // 'todos', 'usuarios', 'recetas', 'sistema'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [page, filter]);

  const loadLogs = async () => {
    try {
      // Si es la primera página, mostrar loading
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await AdminService.getLogs(page, filter);
      const logsData = response.data || response;
      const items = Array.isArray(logsData) ? logsData : logsData.data || [];
      
      if (page === 1) {
        setLogs(items);
      } else {
        setLogs([...logs, ...items]);
      }
      
      // Si no hay items, no hay más páginas
      setHasMore(items.length > 0);
    } catch (error) {
      console.error('Error cargando logs:', error);
      Alert.alert('Error', 'No se pudieron cargar los logs');
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setLogs([]);
    setHasMore(true);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'crear':
        return '#4caf50';
      case 'editar':
        return '#2196f3';
      case 'eliminar':
        return '#f44336';
      case 'bloquear':
        return '#ff9800';
      case 'desbloquear':
        return '#8bc34a';
      default:
        return '#9e9e9e';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'crear':
        return 'plus-circle';
      case 'editar':
        return 'pencil-circle';
      case 'eliminar':
        return 'trash-can';
      case 'bloquear':
        return 'lock';
      case 'desbloquear':
        return 'lock-open';
      default:
        return 'information';
    }
  };

  const renderLogItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedLog(item);
        setShowModal(true);
      }}
    >
      <View style={styles.logHeader}>
        <Icon
          name={getActionIcon(item.action || item.accion || '')}
          size={20}
          color={getActionColor(item.action || item.accion || '')}
        />
        <View style={styles.logTitleContainer}>
          <Text style={[styles.logAction, { color: colors.text }]}>
            {(item.action || item.accion || 'DESCONOCIDA').toUpperCase()}
          </Text>
          <Text style={[styles.logAdminName, { color: colors.textSecondary }]}>
            Por: {item.admin?.nombre || item.admin_name || 'Sistema'}
          </Text>
        </View>
      </View>

      <Text style={[styles.logDetails, { color: colors.text }]} numberOfLines={2}>
        {item.descripcion || item.description || 'Sin descripción'}
      </Text>

      <Text style={[styles.logDate, { color: colors.textSecondary }]}>
        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading && page === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logs del Sistema</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme}>
            <Icon
              name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadLogs()} style={{ marginLeft: 14 }}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {['todos', 'usuarios', 'recetas', 'sistema'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleFilterChange(f)}
            disabled={loading && page === 1}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === f ? '#fff' : colors.text },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {logs.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Registros
          </Text>
        </View>
      </View>

      {/* Logs List */}
      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay registros
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          onEndReached={() => {
            if (hasMore && !isLoadingMore && !loading) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}

      {/* Modal de Detalle */}
      <Modal visible={showModal} transparent animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header Modal */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detalles del Log</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedLog && (
            <ScrollView style={styles.modalContent}>
              {/* Action Badge */}
              <View
                style={[
                  styles.actionBadge,
                  { backgroundColor: getActionColor(selectedLog.action || selectedLog.accion) },
                ]}
              >
                <Icon
                  name={getActionIcon(selectedLog.action || selectedLog.accion)}
                  size={32}
                  color="#fff"
                />
                <Text style={styles.actionText}>
                  {(selectedLog.action || selectedLog.accion).toUpperCase()}
                </Text>
              </View>

              {/* Información */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Información General
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Admin: {selectedLog.admin?.nombre}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="email" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedLog.admin?.email}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="calendar" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Descripción */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Descripción
                </Text>
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                  {selectedLog.descripcion}
                </Text>
              </View>

              {/* Modelo */}
              {selectedLog.modelo && (
                <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Entidad Afectada
                  </Text>

                  <View style={styles.infoRow}>
                    <Icon name="tag" size={18} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Tipo: {selectedLog.modelo}
                    </Text>
                  </View>

                  {selectedLog.modelo_id && (
                    <View style={styles.infoRow}>
                      <Icon name="identifier" size={18} color={colors.primary} />
                      <Text style={[styles.infoLabel, { color: colors.text }]}>
                        ID: {selectedLog.modelo_id}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  logCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  logAction: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logAdminName: {
    fontSize: 12,
    marginTop: 2,
  },
  logDetails: {
    fontSize: 13,
    marginBottom: 8,
  },
  logDate: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 12,
  },
  actionBadge: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  infoSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
