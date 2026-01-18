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

export const AdminReports = ({ navigation }) => {
  const { colors } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [filter, setFilter] = useState('pendiente'); // 'pendiente', 'resuelto', 'todos'

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 30000); // Recargar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getReports();
      const reportsData = response.data || response;
      const items = Array.isArray(reportsData) ? reportsData : reportsData.data || [];
      setReports(items);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    if (filter === 'pendiente') {
      return reports.filter(r => r.estado === 'pendiente');
    } else if (filter === 'resuelto') {
      return reports.filter(r => r.estado === 'resuelto');
    }
    return reports;
  };

  const handleResolveReport = async (status) => {
    if (!selectedReport) return;

    Alert.alert(
      `Marcar como ${status === 'resuelto' ? 'Resuelto' : 'Rechazado'}`,
      `¿Deseas marcar este reporte como ${status}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setResolving(true);
              await AdminService.resolveReport(selectedReport.id, status);
              await loadReports();
              setShowModal(false);
              Alert.alert('Éxito', `Reporte marcado como ${status}`);
            } catch (error) {
              console.error('Error resolviendo reporte:', error);
              Alert.alert('Error', 'No se pudo resolver el reporte');
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return '#ff9800';
      case 'resuelto':
        return '#4caf50';
      case 'rechazado':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return 'clock';
      case 'resuelto':
        return 'check-circle';
      case 'rechazado':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedReport(item);
        setShowModal(true);
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Icon
            name={getStatusIcon(item.estado)}
            size={20}
            color={getStatusColor(item.estado)}
          />
          <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={2}>
            {item.receta?.titulo || 'Receta desconocida'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Text style={styles.statusText}>{item.estado}</Text>
        </View>
      </View>

      <Text style={[styles.reporterText, { color: colors.textSecondary }]}>
        Reportado por: {item.usuario_reportador?.nombre}
      </Text>

      <Text
        style={[styles.reportReason, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.razon}
      </Text>

      <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const filteredReports = getFilteredReports();

  if (loading) {
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
        <Text style={styles.headerTitle}>Reportes de Contenido</Text>
        <TouchableOpacity onPress={loadReports}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: filter === 'pendiente' ? colors.primary : colors.border,
              borderWidth: filter === 'pendiente' ? 2 : 1,
            },
          ]}
          onPress={() => setFilter('pendiente')}
        >
          <Icon name="clock" size={24} color="#ff9800" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {reports.filter(r => r.estado === 'pendiente').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: filter === 'resuelto' ? colors.primary : colors.border,
              borderWidth: filter === 'resuelto' ? 2 : 1,
            },
          ]}
          onPress={() => setFilter('resuelto')}
        >
          <Icon name="check-circle" size={24} color="#4caf50" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {reports.filter(r => r.estado === 'resuelto').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Resueltos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: filter === 'todos' ? colors.primary : colors.border,
              borderWidth: filter === 'todos' ? 2 : 1,
            },
          ]}
          onPress={() => setFilter('todos')}
        >
          <Icon name="format-list-bulleted" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {reports.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox-multiple" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {filter === 'pendiente'
              ? 'No hay reportes pendientes'
              : filter === 'resuelto'
              ? 'No hay reportes resueltos'
              : 'No hay reportes'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detalles del Reporte</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadgeLarge,
                  { backgroundColor: getStatusColor(selectedReport.estado) },
                ]}
              >
                <Icon
                  name={getStatusIcon(selectedReport.estado)}
                  size={32}
                  color="#fff"
                />
                <Text style={styles.statusTextLarge}>
                  {selectedReport.estado.toUpperCase()}
                </Text>
              </View>

              {/* Receta Reportada */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Receta Reportada
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="chef-hat" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.receta?.titulo}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Autor: {selectedReport.receta?.usuario?.nombre}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.viewRecetaButton, { borderColor: colors.primary }]}
                >
                  <Icon name="eye" size={16} color={colors.primary} />
                  <Text style={[styles.viewRecetaText, { color: colors.primary }]}>
                    Ver Receta
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reportador */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Reportado Por
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.usuario_reportador?.nombre}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="email" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.usuario_reportador?.email}
                  </Text>
                </View>
              </View>

              {/* Razón del Reporte */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Razón del Reporte
                </Text>
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                  {selectedReport.razon}
                </Text>
              </View>

              {/* Detalles */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Información
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="calendar" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Reportado: {new Date(selectedReport.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {selectedReport.resuelto_en && (
                  <View style={styles.infoRow}>
                    <Icon name="check" size={18} color="#4caf50" />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Resuelto: {new Date(selectedReport.resuelto_en).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {selectedReport.resuelto_por && (
                  <View style={styles.infoRow}>
                    <Icon name="shield-account" size={18} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Por: {selectedReport.resuelto_por?.nombre}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {selectedReport.estado === 'pendiente' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4caf50', opacity: resolving ? 0.5 : 1 }]}
                    onPress={() => handleResolveReport('resuelto')}
                    disabled={resolving}
                  >
                    {resolving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="check-circle" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Marcar Resuelto</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                    onPress={() => handleResolveReport('rechazado')}
                    disabled={resolving}
                  >
                    <Icon name="close-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Rechazar</Text>
                  </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  reportCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reporterText: {
    fontSize: 12,
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  reportDate: {
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
  statusBadgeLarge: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTextLarge: {
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
  viewRecetaButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecetaText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
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
