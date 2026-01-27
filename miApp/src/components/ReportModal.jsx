import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export const ReportModal = ({
  visible,
  title = 'Reportar',
  reasons = [],
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setDescription('');
    }
  }, [visible]);

  const selectedIsOtro = useMemo(() => selectedReason === 'otro', [selectedReason]);

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Falta motivo', 'Selecciona un motivo para el reporte.');
      return;
    }

    if (selectedIsOtro && description.trim().length < 5) {
      Alert.alert('Describe el motivo', 'Escribe al menos 5 caracteres si eliges "Otro".');
      return;
    }

    onSubmit?.({ reason: selectedReason, description: description.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} disabled={submitting}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Selecciona un motivo
          </Text>

          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8 }}>
            {reasons.map((r) => {
              const active = selectedReason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setSelectedReason(r.key)}
                  activeOpacity={0.85}
                  style={[
                    styles.reasonRow,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + '15' : colors.surface,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reasonLabel, { color: colors.text }]}>{r.label}</Text>
                    {r.help ? (
                      <Text style={[styles.reasonHelp, { color: colors.textSecondary }]}>{r.help}</Text>
                    ) : null}
                  </View>
                  <Icon
                    name={active ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 12 }]}>
            Detalles (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
            placeholder="Cuéntanos un poco más..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.primaryBtn, { backgroundColor: colors.error, opacity: submitting ? 0.7 : 1 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Reportar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  reasonRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  reasonHelp: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
