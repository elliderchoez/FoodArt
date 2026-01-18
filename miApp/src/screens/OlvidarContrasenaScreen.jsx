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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { UserService } from '../services/UserService';
import { useTheme } from '../context/ThemeContext';

export const OlvidarContrasenaScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(1); // 1: Email, 2: Token, 3: NewPassword
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestReset = async () => {
    if (!validateEmail(email)) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setLoading(true);
    try {
      await UserService.requestPasswordReset(email);
      setErrors({});
      setStep(2);
      Alert.alert(
        'Éxito',
        'Si el email existe en nuestro sistema, recibirás un código de verificación'
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error al solicitar reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors = {};

    if (!token.trim()) {
      newErrors.token = 'Ingresa el código recibido';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mínimo 6 caracteres';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await UserService.resetPassword(email, token, newPassword);
      Alert.alert('Éxito', 'Tu contraseña ha sido reseteada. Por favor inicia sesión nuevamente', [
        {
          text: 'OK',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, onToggleShow, error }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }]}>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Recuperar Contraseña</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            {/* Indicador de pasos */}
            <View style={styles.stepsIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.step,
                    { backgroundColor: s <= step ? colors.primary : colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.stepText, { color: s <= step ? '#fff' : colors.text }]}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Step 1: Email */}
            {step === 1 && (
              <View>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Ingresa el email asociado a tu cuenta
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: errors.email ? colors.error : colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    placeholder="tu@email.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                  {errors.email && <Text style={[styles.error, { color: colors.error }]}>{errors.email}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
                  onPress={handleRequestReset}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continuar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Token */}
            {step === 2 && (
              <View>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Ingresa el código que recibiste en {email}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Código de Verificación</Text>
                  <TextInput
                    style={[styles.textInput, { borderColor: errors.token ? colors.error : colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    placeholder="Código de 60 caracteres"
                    placeholderTextColor={colors.textSecondary}
                    value={token}
                    onChangeText={setToken}
                    editable={!loading}
                    multiline
                  />
                  {errors.token && <Text style={[styles.error, { color: colors.error }]}>{errors.token}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={() => setStep(3)}
                  disabled={!token.trim()}
                >
                  <Text style={styles.buttonText}>Continuar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Volver</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <View>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Ingresa tu nueva contraseña
                </Text>

                <PasswordInput
                  label="Nueva Contraseña"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                  error={errors.newPassword}
                />

                <PasswordInput
                  label="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm(!showConfirm)}
                  error={errors.confirmPassword}
                />

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Resetear Contraseña</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Volver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputContainer: {
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
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
