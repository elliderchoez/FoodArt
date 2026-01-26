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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';

export const AdminParameters = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParam, setSelectedParam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getParameters();
      setParameters(data.data || []);
    } catch (error) {
      console.error('Error cargando parámetros:', error);
      Alert.alert('Error', 'No se pudieron cargar los parámetros');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParameter = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'El valor no puede estar vacío');
      return;
    }

    try {
      setSaving(true);
      await AdminService.updateParameter(selectedParam.id, editValue);
      setParameters(
        parameters.map(p =>
          p.id === selectedParam.id ? { ...p, valor: editValue } : p
        )
      );
      setShowModal(false);
      Alert.alert('Éxito', 'Parámetro actualizado correctamente');
    } catch (error) {
      console.error('Error guardando parámetro:', error);
      Alert.alert('Error', 'No se pudo guardar el parámetro');
    } finally {
      setSaving(false);
    }
  };

  const renderParameterItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.paramCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedParam(item);
        setEditValue(item.valor);
        setShowModal(true);
      }}
    >
      <View style={styles.paramHeader}>
        <Icon name="tune" size={20} color={colors.primary} />
        <Text style={[styles.paramKey, { color: colors.text }]}>
          {item.clave}
        </Text>
      </View>
      <Text
        style={[styles.paramValue, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {item.valor}
      </Text>
      {item.descripcion && (
        <Text
          style={[styles.paramDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.descripcion}
        </Text>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Configuración del Sistema</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme}>
            <Icon
              name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadParameters} style={{ marginLeft: 14 }}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Icon name="information" size={20} color={colors.info} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Modifica los parámetros del sistema. Los cambios se aplican inmediatamente.
        </Text>
      </View>

      {/* Parameters List */}
      {parameters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="tune" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay parámetros disponibles
          </Text>
        </View>
      ) : (
        <FlatList
          data={parameters}
          renderItem={renderParameterItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}

      {/* Modal de Edición */}
      <Modal visible={showModal} transparent animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header Modal */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Editar Parámetro
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedParam && (
            <ScrollView style={styles.modalContent}>
              {/* Parámetro Info */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Información
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="tag" size={18} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Parámetro
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {selectedParam.clave}
                    </Text>
                  </View>
                </View>

                {selectedParam.descripcion && (
                  <View style={[styles.infoRow, { marginTop: 12 }]}>
                    <Icon name="information" size={18} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Descripción
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {selectedParam.descripcion}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Input */}
              <View style={[styles.inputSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Nuevo Valor
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Ingresa el nuevo valor"
                  placeholderTextColor={colors.textSecondary}
                  value={editValue}
                  onChangeText={setEditValue}
                  multiline
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {editValue.length}/500
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { opacity: saving ? 0.5 : 1 }]}
                onPress={handleSaveParameter}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="content-save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
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
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  paramCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  paramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paramKey: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  paramValue: {
    fontSize: 13,
    marginBottom: 4,
  },
  paramDescription: {
    fontSize: 11,
    fontStyle: 'italic',
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
  inputSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
    maxHeight: 120,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});
