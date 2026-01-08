import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';

export default function CrearRecetaScreen({ navigation }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [porciones, setPorciones] = useState('');
  const [dificultad, setDificultad] = useState('Fácil');
  const [ingredientes, setIngredientes] = useState('');
  const [pasos, setPasos] = useState('');
  const [imagenUri, setImagenUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Seleccionar imagen de galería o cámara
  const seleccionarImagen = async () => {
    Alert.alert(
      'Seleccionar foto',
      'Elige de dónde quieres tomar la foto',
      [
        {
          text: 'Cámara',
          onPress: async () => {
            const resultado = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!resultado.canceled) {
              setImagenUri(resultado.assets[0].uri);
            }
          },
        },
        {
          text: 'Galería',
          onPress: async () => {
            const resultado = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!resultado.canceled) {
              setImagenUri(resultado.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', onPress: () => {} },
      ]
    );
  };

  // Subir imagen al servidor
  const subirImagen = async (imageUri) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `receta_${Date.now()}.jpg`,
      });

      const { data } = await apiClient.post(`/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.url) {
        return data.url;
      }
      throw new Error('Error al subir imagen');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Validar campos
  const validarCampos = () => {
    if (!imagenUri) {
      Alert.alert('Error', 'Debes subir una foto válida de tu receta antes de publicarla');
      return false;
    }
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return false;
    }
    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return false;
    }
    if (!tiempo.trim()) {
      Alert.alert('Error', 'El tiempo es obligatorio');
      return false;
    }
    if (!porciones.trim()) {
      Alert.alert('Error', 'Las porciones son obligatorias');
      return false;
    }
    if (!ingredientes.trim()) {
      Alert.alert('Error', 'Los ingredientes son obligatorios');
      return false;
    }
    if (!pasos.trim()) {
      Alert.alert('Error', 'Los pasos son obligatorios');
      return false;
    }
    return true;
  };

  // Publicar receta
  const publicarReceta = async () => {
    if (!validarCampos()) return;

    try {
      setLoading(true);

      // Subir imagen
      const imageUrl = await subirImagen(imagenUri);
      if (!imageUrl) {
        Alert.alert('Error', 'No se pudo subir la imagen');
        return;
      }

      // Obtener token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'No estás autenticado');
        navigation.replace('Login');
        return;
      }

      // Preparar datos de receta
      const ingredientesArray = ingredientes
        .split('\n')
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0);

      const pasosArray = pasos
        .split('\n')
        .map(paso => paso.trim())
        .filter(paso => paso.length > 0);

      const datosReceta = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagen_url: imageUrl,
        tiempo_preparacion: tiempo.trim(),
        porciones: parseInt(porciones),
        dificultad: dificultad,
        ingredientes: ingredientesArray,
        pasos: pasosArray,
        categoria: 'General',
      };

      console.log('Datos de receta a enviar:', JSON.stringify(datosReceta, null, 2));

      // Enviar a API
      const { data: responseData } = await apiClient.post(`/recetas`, datosReceta);

      console.log('Response data:', responseData);

      Alert.alert('Éxito', '¡Receta publicada con éxito!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error publishing recipe:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Error al publicar la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Receta</Text>
          <TouchableOpacity
            onPress={publicarReceta}
            disabled={loading || uploadingImage}
            style={[styles.publicarBtn, (loading || uploadingImage) && styles.disabled]}
          >
            {loading || uploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.publicarBtnText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Foto de la receta */}
        <TouchableOpacity style={styles.fotoContainer} onPress={seleccionarImagen}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.fotoReceta} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <MaterialCommunityIcons name="camera-plus-outline" size={48} color="#D4AF37" />
              <Text style={styles.agregarFotoText}>Agregar Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploadingImage && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.uploadingText}>Subiendo imagen...</Text>
          </View>
        )}

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título de la receta</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Tacos al Pastor"
            value={titulo}
            onChangeText={setTitulo}
            placeholderTextColor="#999"
            maxLength={100}
          />
        </View>

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe tu receta"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.counter}>{descripcion.length}/500</Text>
        </View>

        {/* Tiempo de preparación */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiempo de preparación (minutos)</Text>
          <View style={styles.tiempoContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 8 }]}
              placeholder="Ej: 45"
              value={tiempo}
              onChangeText={setTiempo}
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
            <View style={styles.tiempoLabel}>
              <Text style={styles.tiempoText}>min</Text>
            </View>
          </View>
        </View>

        {/* Porciones */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de porciones</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: 4"
            value={porciones}
            onChangeText={setPorciones}
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        {/* Dificultad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dificultad</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dificultad}
              onValueChange={setDificultad}
              style={styles.picker}
            >
              <Picker.Item label="Fácil" value="Fácil" />
              <Picker.Item label="Media" value="Media" />
              <Picker.Item label="Difícil" value="Difícil" />
            </Picker>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ingredientes (uno por línea)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="- 2 tazas de harina&#10;- 1 huevo&#10;- Sal al gusto"
            value={ingredientes}
            onChangeText={setIngredientes}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Pasos */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pasos de preparación (uno por línea)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="1. Mezclar ingredientes&#10;2. Cocinar a fuego medio&#10;3. Servir caliente"
            value={pasos}
            onChangeText={setPasos}
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  publicarBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  publicarBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fotoContainer: {
    width: '100%',
    height: 250,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  fotoReceta: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
  },
  agregarFotoText: {
    marginTop: 8,
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#D4AF37',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  counter: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  tiempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tiempoLabel: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    minWidth: 50,
  },
  tiempoText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  spacer: {
    height: 24,
  },
});
