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

export const AdminBackups = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBackups();
    const interval = setInterval(loadBackups, 60000); // Recargar cada minuto
    return () => clearInterval(interval);
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await AdminService.listBackups();
      setBackups(data.data || []);
    } catch (error) {
      console.error('Error cargando backups:', error);
      Alert.alert('Error', 'No se pudieron cargar los backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = () => {
    Alert.alert(
      'Crear Backup',
      '¿Deseas crear un nuevo backup de la base de datos? Este proceso puede tomar algunos minutos.',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Crear',
          onPress: async () => {
            try {
              setCreating(true);
              await AdminService.createBackup();
              await loadBackups();
              Alert.alert('Éxito', 'Backup creado correctamente');
            } catch (error) {
              console.error('Error creando backup:', error);
              Alert.alert('Error', 'No se pudo crear el backup');
            } finally {
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  const handleDownloadBackup = (backup) => {
    Alert.alert(
      'Descargar Backup',
      `¿Deseas descargar el backup de ${new Date(backup.created_at).toLocaleDateString()}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Descargar',
          onPress: async () => {
            // En una aplicación real, aquí irías a AdminService.downloadBackup(backup.id)
            Alert.alert('Descarga iniciada', 'El archivo comenzará a descargarse en poco tiempo');
          },
        },
      ]
    );
  };

  const getFileSizeLabel = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderBackupItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.backupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedBackup(item);
        setShowModal(true);
      }}
    >
      <View style={styles.backupHeader}>
        <Icon name="cloud-check" size={20} color="#4caf50" />
        <View style={styles.backupInfo}>
          <Text style={[styles.backupDate, { color: colors.text }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={[styles.backupTime, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      <View style={styles.backupDetails}>
        <View style={styles.detailItem}>
          <Icon name="database" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {getFileSizeLabel(item.tamaño || 0)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="table-of-contents" size={16} color={colors.primary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.registro_count || 0} registros
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && backups.length === 0) {
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
        <Text style={styles.headerTitle}>Gestión de Backups</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme}>
            <Icon
              name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadBackups} disabled={loading} style={{ marginLeft: 14 }}>
            <Icon
              name="refresh"
              size={24}
              color="#fff"
              style={{ opacity: loading ? 0.5 : 1 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Icon name="information" size={20} color={colors.info} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Los backups se crean automáticamente. Crea uno manualmente antes de cambios importantes.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.card }]}>
          <Icon name="cloud-check" size={24} color="#4caf50" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {backups.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Backups Totales
          </Text>
        </View>

        {backups.length > 0 && (
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Icon name="cloud-upload" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {getFileSizeLabel(
                backups.reduce((sum, b) => sum + (b.tamaño || 0), 0)
              )}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Almacenamiento
            </Text>
          </View>
        )}
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { opacity: creating ? 0.5 : 1 }]}
        onPress={handleCreateBackup}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="plus-circle" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear Backup Ahora</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Backups List */}
      {backups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cloud-off" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay backups disponibles
          </Text>
        </View>
      ) : (
        <FlatList
          data={backups}
          renderItem={renderBackupItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Detalles del Backup
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedBackup && (
            <ScrollView style={styles.modalContent}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: '#4caf50' }]}>
                <Icon name="cloud-check" size={32} color="#fff" />
                <Text style={styles.statusText}>DISPONIBLE</Text>
              </View>

              {/* Información */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Información del Backup
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="calendar" size={18} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Fecha
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {new Date(selectedBackup.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Icon name="clock" size={18} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Hora
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {new Date(selectedBackup.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Icon name="database" size={18} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Tamaño
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {getFileSizeLabel(selectedBackup.tamaño || 0)}
                    </Text>
                  </View>
                </View>

                {selectedBackup.registro_count && (
                  <View style={[styles.infoRow, { marginTop: 12 }]}>
                    <Icon name="table-of-contents" size={18} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Registros
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {selectedBackup.registro_count}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
                  onPress={() => {
                    handleDownloadBackup(selectedBackup);
                    setShowModal(false);
                  }}
                >
                  <Icon name="download" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Descargar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
                  onPress={() => {
                    Alert.alert('Info', 'Contacta con el administrador para restaurar un backup');
                  }}
                >
                  <Icon name="restore" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Restaurar</Text>
                </TouchableOpacity>
              </View>
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
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backupCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  backupDate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  backupTime: {
    fontSize: 12,
    marginTop: 2,
  },
  backupDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
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
  statusBadge: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
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
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13,
  },
});
