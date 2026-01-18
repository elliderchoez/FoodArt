import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { UserService } from '../services/UserService';
import { useTheme } from '../context/ThemeContext';

export const CambiarContrasenaScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mínimo 6 caracteres';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (newPassword === currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await UserService.changePassword(currentPassword, newPassword);
      Alert.alert(
        'Éxito',
        'Tu contraseña ha sido cambiada correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo cambiar la contraseña'
      );
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, onToggleShow, error }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.passwordContainer, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={label}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          editable={!loading}
        />
        <TouchableOpacity onPress={onToggleShow} disabled={loading}>
          <Icon
            name={show ? 'eye-off' : 'eye'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cambiar Contraseña</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {/* Información */}
          <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
            <Icon name="information" size={20} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Por tu seguridad, debes confirmar tu contraseña actual
            </Text>
          </View>

          {/* Inputs */}
          <PasswordInput
            label="Contraseña Actual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            error={errors.currentPassword}
          />

          <PasswordInput
            label="Nueva Contraseña"
            value={newPassword}
            onChange={setNewPassword}
            show={showNewPassword}
            onToggleShow={() => setShowNewPassword(!showNewPassword)}
            error={errors.newPassword}
          />

          <PasswordInput
            label="Confirmar Contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmPassword}
          />

          {/* Botones */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 12,
    height: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
