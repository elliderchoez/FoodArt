import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

export default function CrearRecetaScreen({ navigation }) {
  const { colors } = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [porciones, setPorciones] = useState('');
  const [dificultad, setDificultad] = useState('Fácil');
  const [tipoDieta, setTipoDieta] = useState('mixta');
  const [ingredientes, setIngredientes] = useState('');
  const [pasos, setPasos] = useState('');
  const [imagenUri, setImagenUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [openSelect, setOpenSelect] = useState(null); // 'dificultad' | 'tipoDieta' | null

  const DIFICULTADES = [
    { label: 'Fácil', value: 'Fácil' },
    { label: 'Media', value: 'Media' },
    { label: 'Difícil', value: 'Difícil' },
  ];

  const TIPOS_DIETA = [
    { label: 'Mixta', value: 'mixta' },
    { label: 'Vegana', value: 'vegana' },
    { label: 'Vegetariana', value: 'vegetariana' },
    { label: 'Carnes', value: 'carnes' },
    { label: 'Gym', value: 'gym' },
    { label: 'Bajar de Peso', value: 'bajar_peso' },
  ];

  const getLabelFromValue = (items, value) => {
    const found = items.find((i) => i.value === value);
    return found ? found.label : String(value ?? '');
  };

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
        tipo_dieta: tipoDieta,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nueva Receta</Text>
          <TouchableOpacity
            onPress={publicarReceta}
            disabled={loading || uploadingImage}
            style={[styles.publicarBtn, (loading || uploadingImage) && styles.disabled]}
          >
            {loading || uploadingImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publicarBtnText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Foto de la receta */}
        <TouchableOpacity style={[styles.fotoContainer, { backgroundColor: colors.surface }]} onPress={seleccionarImagen}>
          {imagenUri ? (
            <Image source={{ uri: imagenUri }} style={styles.fotoReceta} />
          ) : (
            <View style={[styles.fotoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <MaterialCommunityIcons name="camera-plus-outline" size={48} color="#D4AF37" />
              <Text style={[styles.agregarFotoText, { color: colors.primary }]}>Agregar Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploadingImage && (
          <View style={[styles.uploadingIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={[styles.uploadingText, { color: colors.primary }]}>Subiendo imagen...</Text>
          </View>
        )}

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Título de la receta</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Ej: Tacos al Pastor"
            value={titulo}
            onChangeText={setTitulo}
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
        </View>

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Descripción</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Describe tu receta"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={[styles.counter, { color: colors.textSecondary }]}>{descripcion.length}/500</Text>
        </View>

        {/* Tiempo de preparación */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tiempo de preparación (minutos)</Text>
          <View style={styles.tiempoContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 8, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Ej: 45"
              value={tiempo}
              onChangeText={setTiempo}
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
            <View style={[styles.tiempoLabel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.tiempoText, { color: colors.textSecondary }]}>min</Text>
            </View>
          </View>
        </View>

        {/* Porciones */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Número de porciones</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Ej: 4"
            value={porciones}
            onChangeText={setPorciones}
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        {/* Dificultad */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Dificultad</Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setOpenSelect('dificultad')}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectButtonText, { color: colors.text }]}>
              {getLabelFromValue(DIFICULTADES, dificultad)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tipo de Dieta */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría / Tipo de Dieta</Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setOpenSelect('tipoDieta')}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectButtonText, { color: colors.text }]}>
              {getLabelFromValue(TIPOS_DIETA, tipoDieta)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Modal selector (tema oscuro compatible) */}
        <Modal
          visible={openSelect !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setOpenSelect(null)}
        >
          <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {openSelect === 'dificultad' ? 'Selecciona dificultad' : 'Selecciona tipo de dieta'}
                </Text>
                <TouchableOpacity onPress={() => setOpenSelect(null)}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {(openSelect === 'dificultad' ? DIFICULTADES : TIPOS_DIETA).map((item) => {
                const selected = openSelect === 'dificultad' ? item.value === dificultad : item.value === tipoDieta;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor: selected ? colors.surface : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (openSelect === 'dificultad') {
                        setDificultad(item.value);
                      } else {
                        setTipoDieta(item.value);
                      }
                      setOpenSelect(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>{item.label}</Text>
                    {selected && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* Ingredientes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Ingredientes (uno por línea)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="- 2 tazas de harina&#10;- 1 huevo&#10;- Sal al gusto"
            value={ingredientes}
            onChangeText={setIngredientes}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Pasos */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pasos de preparación (uno por línea)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="1. Mezclar ingredientes&#10;2. Cocinar a fuego medio&#10;3. Servir caliente"
            value={pasos}
            onChangeText={setPasos}
            placeholderTextColor={colors.textSecondary}
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
    fontSize: 20,
    fontWeight: 'bold',
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
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  agregarFotoText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
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
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  counter: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
  },
  tiempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tiempoLabel: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    minWidth: 50,
  },
  tiempoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  selectButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    maxHeight: '75%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 24,
  },
});
