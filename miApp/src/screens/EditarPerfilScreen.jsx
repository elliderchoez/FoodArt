import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

export const EditarPerfilScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { usuario } = route.params || {};
  const [nombre, setNombre] = useState(usuario?.name || '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '');
  const [fotoUri, setFotoUri] = useState(usuario?.imagen_perfil || null);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const seleccionarFoto = async (source) => {
    try {
      let resultado;

      if (source === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Permiso cámara:', permiso);
        
        if (!permiso.granted) {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
          return;
        }
        
        console.log('Abriendo cámara...');
        resultado = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        console.log('Resultado cámara:', resultado);
      } else {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Permiso galería:', permiso);
        
        if (!permiso.granted) {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
          return;
        }
        
        console.log('Abriendo galería...');
        resultado = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        console.log('Resultado galería:', resultado);
      }

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        console.log('Foto seleccionada:', resultado.assets[0]);
        setFotoSeleccionada(resultado.assets[0]);
        setFotoUri(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error completo:', error);
      Alert.alert('Error', `Error al seleccionar imagen: ${error.message}`);
    }
  };

  const abrirSelectorFoto = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      '¿De dónde deseas seleccionar la foto?',
      [
        {
          text: 'Cámara',
          onPress: () => seleccionarFoto('camara'),
        },
        {
          text: 'Galería',
          onPress: () => seleccionarFoto('galeria'),
        },
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
      ]
    );
  };

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = usuario?.imagen_perfil;

      // Si hay una foto seleccionada, subirla primero
      if (fotoSeleccionada) {
        const formData = new FormData();
        formData.append('image', {
          uri: fotoSeleccionada.uri,
          type: 'image/jpeg',
          name: `perfil_${Date.now()}.jpg`,
        });

        try {
          const { data: datosImagen } = await apiClient.post('/upload-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          fotoUrl = datosImagen.url || datosImagen.path || datosImagen.imagen_url;
          console.log('URL imagen obtenida:', fotoUrl);
        } catch (errorImagen) {
          console.error('Error en upload imagen:', errorImagen);
          Alert.alert('Advertencia', 'Error al subir imagen, continuaré con otros cambios');
        }
      }

      // Actualizar perfil en la BD
      console.log('Actualizando perfil con datos:', { nombre, descripcion, imagen_perfil: fotoUrl });
      
      await apiClient.put('/user/update-profile', {
        name: nombre,
        descripcion: descripcion,
        imagen_perfil: fotoUrl,
      });

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      // Volver al perfil y refrescar datos
      navigation.goBack();
      setTimeout(() => {
        navigation.navigate('Perfil');
      }, 500);
    } catch (error) {
      console.error('Error general:', error);
      Alert.alert('Error', `Error al actualizar el perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Text style={styles.logo}>FOOD ART</Text>

        {/* Foto de perfil */}
        <View style={styles.fotoSection}>
          <View style={styles.fotoContainer}>
            {fotoUri ? (
              <Image
                source={{ uri: fotoUri }}
                style={styles.foto}
              />
            ) : (
              <View style={[styles.foto, styles.fotoPlaceholder]}>
                <Icon name="account-circle" size={80} color="#D1D5DB" />
              </View>
            )}
            <TouchableOpacity
              style={styles.btnCambiarFoto}
              onPress={abrirSelectorFoto}
            >
              <Icon name="camera-plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.fotoHint, { color: colors.textSecondary }]}>Toca para cambiar foto de perfil</Text>
        </View>

        {/* Nombre */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textSecondary}
            value={nombre}
            onChangeText={setNombre}
            editable={!loading}
          />
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Escribe sobre ti (máx 150 caracteres)"
            placeholderTextColor={colors.textSecondary}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            maxLength={150}
            editable={!loading}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{descripcion.length}/150</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Proporciona tu nombre y una descripción sobre ti. Esta información será visible para otros usuarios.
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.btnCancelar, loading && styles.btnDisabled]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.btnCancelarText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnGuardar, loading && styles.btnDisabled]}
            onPress={guardarCambios}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnGuardarText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  fotoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fotoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  fotoPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCambiarFoto: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fotoHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    lineHeight: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  btnGuardar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGuardarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
