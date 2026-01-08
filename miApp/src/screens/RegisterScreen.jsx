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
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

export const RegisterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Mínimo 6 caracteres y al menos una mayúscula
    const passRegex = /^(?=.*[A-Z]).{6,}$/;
    return passRegex.test(password);
  };

  const validateName = (name) => {
    // Solo letras y espacios
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$/;
    return nameRegex.test(name);
  };

  const handleNameChange = (text) => {
    // Solo permite letras, acentos y espacios
    if (validateName(text)) {
      setName(text);
    }
  };

  const pickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagenPerfil(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagenPerfil(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const validate = () => {
    const next = {};
    const nameTrim = name.trim();
    const emailTrim = email.trim();

    if (!nameTrim) {
      next.name = 'El nombre es obligatorio';
    } else if (!validateName(nameTrim)) {
      next.name = 'El nombre solo debe contener letras y espacios';
    }

    if (!emailTrim) {
      next.email = 'El correo es obligatorio';
    } else if (!validateEmail(emailTrim)) {
      next.email = 'Email inválido';
    }

    if (!password) {
      next.password = 'La contraseña es obligatoria';
    } else if (!validatePassword(password)) {
      next.password = 'Mínimo 6 caracteres y una mayúscula';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(next);
    setFormError('');
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      let imagenUrl = null;

      // Si hay imagen, subirla primero
      if (imagenPerfil) {
        try {
          const formData = new FormData();
          const filename = imagenPerfil.uri.split('/').pop();
          
          formData.append('image', {
            uri: imagenPerfil.uri,
            name: filename,
            type: 'image/jpeg',
          });

          console.log('Subiendo imagen...');
          try {
            const { data: uploadData } = await apiClient.post('/upload-image', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            console.log('Upload data parsed:', uploadData);

            // El servidor retorna URL completa
            imagenUrl = uploadData.url;
            console.log('Imagen URL final:', imagenUrl);
          } catch (uploadErr) {
            console.error('Upload error:', uploadErr.response?.data);
            Alert.alert('Error en imagen', uploadErr.response?.data?.message || 'No se pudo subir la imagen');
            return;
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Error', 'No se pudo procesar la imagen');
          setLoading(false);
          return;
        }
      }

      // Luego registrar usuario
      const registerData = {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        password_confirmation: confirmPassword.trim(),
        descripcion: descripcion.trim(),
      };

      if (imagenUrl) {
        registerData.imagen_perfil = imagenUrl;
      }

      console.log('Datos de registro:', registerData);

      try {
        const { data } = await apiClient.post('/register', registerData);
        console.log('Response data:', data);

        Alert.alert('Éxito', 'Cuenta creada correctamente. Ahora inicia sesión.');
        navigation.replace('Login');
      } catch (error) {
        const fieldMessages = error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().filter(Boolean)
          : [];

        if (fieldMessages.length) {
          setFormError(fieldMessages.join('\n'));
        } else {
          setFormError(error.response?.data?.message || error.response?.data?.error || 'Error al registrarse');
        }
    } catch (error) {
      console.error('Error en registro:', error);
      setFormError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />

        {/* Título */}
        <Text style={[styles.title, { color: colors.text }]}>Crear una cuenta</Text>

        {/* Tarjeta */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {!!formError && (
            <View style={[styles.formErrorBox, { borderColor: colors.error, backgroundColor: colors.surface }]}>
              <Text style={[styles.formErrorText, { color: colors.error }]}>{formError}</Text>
            </View>
          )}

          {/* Selector de foto de perfil */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Foto de perfil</Text>

          <View style={styles.imageContainer}>
            {imagenPerfil ? (
              <Image source={{ uri: imagenPerfil.uri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="account-circle" size={64} color="#D4AF37" />
              </View>
            )}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.imageButton, styles.cameraButton]}
              onPress={takePicture}
              disabled={loading}
            >
              <Icon name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.imageButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, styles.galleryButton]}
              onPress={pickImage}
              disabled={loading}
            >
              <Icon name="image" size={20} color="#FFFFFF" />
              <Text style={styles.imageButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {/* Nombre */}
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: errors.name ? colors.error : colors.border }]}
            placeholder="Nombre completo"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={(v) => {
              handleNameChange(v);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            editable={!loading}
            maxLength={255}
          />
          {!!errors.name && (
            <Text style={[styles.fieldErrorText, { color: colors.error }]}>{errors.name}</Text>
          )}

          {/* Email */}
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: errors.email ? colors.error : colors.border }]}
            placeholder="Correo electrónico"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            editable={!loading}
          />
          {!!errors.email && (
            <Text style={[styles.fieldErrorText, { color: colors.error }]}>{errors.email}</Text>
          )}

          {/* Descripción */}
          <TextInput
            style={[styles.input, styles.descriptionInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder="Descripción (opcional)"
            placeholderTextColor={colors.textSecondary}
            value={descripcion}
            onChangeText={setDescripcion}
            editable={!loading}
            multiline
            numberOfLines={3}
          />

          {/* Contraseña */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
            >
              <Icon
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={24}
                color="#D4AF37"
              />
            </TouchableOpacity>
          </View>
          {!!errors.password && (
            <Text style={[styles.fieldErrorText, { color: colors.error }]}>{errors.password}</Text>
          )}

          <Text style={styles.passwordRule}>
            Mínimo 6 caracteres, una mayúscula
          </Text>

          {/* Confirmar Contraseña */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, { color: colors.text }]}
              placeholder="Confirmar contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              disabled={loading}
            >
              <Icon
                name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                size={24}
                color="#D4AF37"
              />
            </TouchableOpacity>
          </View>
          {!!errors.confirmPassword && (
            <Text style={[styles.fieldErrorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
          )}

          {/* Botón Registrarse */}
          <TouchableOpacity
            style={[styles.button, styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          {/* Link a Login */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>¿Ya tienes una cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© Food Art</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formErrorBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  formErrorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldErrorText: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#D4AF37',
  },
  galleryButton: {
    backgroundColor: '#6366F1',
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 48,
  },
  descriptionInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    marginBottom: 4,
    paddingRight: 10,
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  visibilityButton: {
    padding: 10,
  },
  passwordRule: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    paddingLeft: 4,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerButton: {
    backgroundColor: '#D4AF37',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginLink: {
    color: '#D4AF37',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  footer: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    opacity: 0.7,
  },
});
