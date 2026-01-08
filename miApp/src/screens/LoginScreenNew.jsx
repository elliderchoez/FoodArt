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
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { UsuarioManager } from '../services/UsuarioManager';
import { getStoredToken } from '../services/notificationService';

export const LoginScreenNew = ({ navigation }) => {
  const { login } = useAppContext();
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = () => {
    const next = {};
    const emailTrim = email.trim();
    const passTrim = password;

    if (!emailTrim) {
      next.email = 'El correo es obligatorio';
    } else if (!validateEmail(emailTrim)) {
      next.email = 'Email inválido';
    }

    if (!passTrim) {
      next.password = 'La contraseña es obligatoria';
    } else if (passTrim.length < 6) {
      next.password = 'Mínimo 6 caracteres';
    }

    setErrors(next);
    setFormError('');
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Consumir API con axios centralizado
      const { data } = await apiClient.post('/login', {
        email: email.trim(),
        password: password.trim(),
      });

      if (data.token) {
        // Guardar en AppContext
        await login(data.user, data.token);

        // Sincronizar datos del usuario
        await UsuarioManager.sincronizarDesdeAPI(data.token);
        await UsuarioManager.obtenerNombre();

        // Registrar token de notificaciones
        try {
          const pushToken = await getStoredToken();
          if (pushToken) {
            await apiClient.post('/notifications/register-token', {
              token: pushToken,
              device_name: 'mobile-app',
            });
          }
        } catch (notifError) {
          console.log('Error registrando token de notificación:', notifError);
        }

        // Navegar a Home (App.js detección automática de usuario)
        navigation.replace('Home');
      }
    } catch (error) {
      console.log('Error de login:', error);
      if (error.response?.status === 401) {
        setFormError('Correo o contraseña incorrectos');
      } else {
        setFormError('Error al conectar con el servidor. Verifica que esté corriendo.');
      }
      Alert.alert('Error', formError || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo_foodart.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.title, { color: colors.text }]}>Iniciar Sesión</Text>

            {formError ? (
              <Text style={[styles.errorText, { color: '#e74c3c' }]}>{formError}</Text>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: errors.email ? '#e74c3c' : colors.primary,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.text}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={colors.text} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: errors.password ? '#e74c3c' : colors.primary,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Contraseña"
                placeholderTextColor={colors.text}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.link, { color: colors.primary }]}>¿Olvidaste la contraseña?</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.text }]}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 8,
  },
  eyeIcon: {
    padding: 10,
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
