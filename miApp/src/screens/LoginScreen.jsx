import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { API_URL } from '../services/api';
import { UsuarioManager } from '../services/UsuarioManager';
import { useTheme } from '../context/ThemeContext';
import { getStoredToken } from '../services/notificationService';

export const LoginScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = () => {
    let ok = true;

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Email inválido');
      ok = false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Mínimo 6 caracteres para la contraseña');
      ok = false;
    }

    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);

      if (!text) {
        Alert.alert('Error', 'El servidor no respondió correctamente. Verifica que el backend esté corriendo.');
        return;
      }

      const data = JSON.parse(text);

      if (response.ok && data.token) {
        // Guardar token
        await AsyncStorage.setItem('authToken', data.token);

        // Sincronizar datos del usuario
        await UsuarioManager.sincronizarDesdeAPI(data.token);
        const userName = await UsuarioManager.obtenerNombre();

        // Registrar token de notificaciones (si existe)
        try {
          const pushToken = await getStoredToken();
          if (pushToken) {
            const registerResponse = await fetch(`${API_URL}/notifications/register-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`,
              },
              body: JSON.stringify({ token: pushToken }),
            });
            if (registerResponse.ok) {
              console.log('✅ Token de notificaciones registrado en el backend');
            }
          } else {
            console.warn('⚠️ No hay token de notificaciones (Expo Go limitación)');
          }
        } catch (error) {
          console.warn('Advertencia registrando token:', error.message);
          // Continuamos aunque falle el registro de notificaciones
        }

        Alert.alert('Bienvenido', `¡Hola ${userName}!`);
        navigation.replace('Home');
      } else {
        const errorMessage = data.message || 'Credenciales incorrectas';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', `No se pudo conectar con el servidor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Image source={require('../../assets/logo.png')} style={styles.logo} />

          {/* Título */}
          

          {/* Tarjeta de login */}
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Correo"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  disabled={loading}
                >
                  <Icon
                    name={passwordVisible ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.forgotPassword, { color: colors.primary }]}>¿Olvidé mi contraseña?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>¿No tienes cuenta?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Registro')}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  forgotPassword: {
    color: '#D4AF37',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 20,
    fontWeight: '500',
  },
  loginButton: {
    height: 52,
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginHorizontal: 12,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  signUpText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signUpLink: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
});
