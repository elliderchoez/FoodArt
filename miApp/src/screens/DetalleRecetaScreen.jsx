import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Servicios y Contexto
import apiClient from '../services/apiClient';
import { updateReceta, deleteReceta } from '../services/apiClient';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';

/* ============================================================
   COMPONENTES AUXILIARES (UI)
============================================================ */

const IngredienteItem = ({ ingrediente, index, colors }) => (
  <View style={styles.ingredienteItem}>
    <View style={[styles.ingredienteIcon, { backgroundColor: colors.primary }]}>
      <Text style={styles.ingredienteNumber}>{index + 1}</Text>
    </View>
    <Text style={[styles.ingredienteText, { color: colors.text }]}>
      {ingrediente}
    </Text>
  </View>
);

const PasoItem = ({ paso, index, colors }) => (
  <View style={[styles.pasoItem, { backgroundColor: colors.cardBackground }]}>
    <View style={[styles.pasoNumber, { backgroundColor: colors.primary }]}>
      <Text style={styles.pasoNumberText}>{index + 1}</Text>
    </View>
    <Text style={[styles.pasoText, { color: colors.text }]}>{paso}</Text>
  </View>
);

const ComentarioItem = ({ comentario, colors }) => (
  <View style={[styles.comentarioItem, { backgroundColor: colors.cardBackground }]}>
    <View style={styles.comentarioHeader}>
      <Image
        source={{ uri: comentario.user?.imagen_perfil || 'https://via.placeholder.com/40' }}
        style={styles.comentarioAvatar}
      />
      <View style={styles.comentarioInfo}>
        <Text style={[styles.comentarioUserName, { color: colors.text }]}>
          {comentario.user?.name || 'Usuario'}
        </Text>
        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < comentario.calificacion ? 'star' : 'star-outline'}
              size={14}
              color="#FFD700"
            />
          ))}
        </View>
      </View>
    </View>
    <Text style={[styles.comentarioText, { color: colors.textSecondary }]}>
      {comentario.contenido}
    </Text>
  </View>
);

const Divider = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.border || '#E5E5E5' }]} />
);

/* ============================================================
   PANTALLA PRINCIPAL: DETALLE DE RECETA
============================================================ */

export default function DetalleRecetaScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { receta, isAdmin } = route.params || {};

  // Estados de Datos
  const [recetaCompleta, setRecetaCompleta] = useState(
    receta ? { ...receta, is_blocked: receta?.is_blocked || false } : null
  );
  const [comentarios, setComentarios] = useState([]);
  const [token, setToken] = useState(null);

  // Estados de Interacción
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [siguiendo, setSiguiendo] = useState(false);
  const [esMiReceta, setEsMiReceta] = useState(false);

  // Estados de Modales y Edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockModalReason, setBlockModalReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Campos de Edición
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editIngredientes, setEditIngredientes] = useState('');
  const [editPasos, setEditPasos] = useState('');
  const [editTiempoPreparacion, setEditTiempoPreparacion] = useState('');
  const [editPorciones, setEditPorciones] = useState('');
  const [editDificultad, setEditDificultad] = useState('medio');
  const [editCategoria, setEditCategoria] = useState('');

  /* --- Efectos --- */
  useEffect(() => {
    const inicializar = async () => {
      try {
        const tk = await AsyncStorage.getItem('authToken');
        setToken(tk);

        if (tk && receta) {
          try {
            const { data: userData } = await apiClient.get('/user');
            setEsMiReceta(userData.id === receta.user_id);
          } catch (err) { console.log('Error User:', err); }
        }

        if (receta) {
          await cargarDetalleReceta();
          await cargarComentarios();
        }
      } catch (err) { console.log('Error Init:', err); }
    };
    inicializar();
  }, [receta?.id]);

  /* --- Funciones de Carga --- */
  const cargarDetalleReceta = async () => {
    if (!receta?.id) return;
    try {
      const { data } = await apiClient.get(`/recetas/${receta.id}`);
      setRecetaCompleta(prev => ({ ...prev, ...data }));
      setLiked(data.user_liked || false);
      setSaved(data.user_saved || false);
      setSiguiendo(data.user_follows_author || false);
    } catch (err) { console.log('Error Receta:', err); }
  };

  const cargarComentarios = async () => {
    if (!receta?.id) return;
    try {
      const { data } = await apiClient.get(`/comentarios/${receta.id}`);
      setComentarios(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.log('Error Comentarios:', err); }
  };

  /* --- Acciones de Usuario --- */
  const toggleLike = async () => {
    if (!token) return Alert.alert('Error', 'Inicia sesión');
    setLiked(!liked);
    try {
      await apiClient.post(`/recetas/${receta.id}/like`);
      cargarDetalleReceta();
    } catch (err) { setLiked(!liked); }
  };

  const toggleSave = async () => {
    if (!token) return Alert.alert('Error', 'Inicia sesión');
    const nuevoEstado = !saved;
    setSaved(nuevoEstado);
    try {
      await apiClient.post(`/recetas/${receta.id}/save`);
    } catch (err) { setSaved(!nuevoEstado); }
  };

  const toggleSeguir = async () => {
    if (!token) return Alert.alert('Error', 'Inicia sesión');
    const nuevoEstado = !siguiendo;
    setSiguiendo(nuevoEstado);
    try {
      if (!nuevoEstado) await apiClient.post(`/usuarios/${receta.user_id}/dejar-de-seguir`);
      else await apiClient.post(`/usuarios/${receta.user_id}/seguir`);
    } catch (err) { setSiguiendo(!nuevoEstado); }
  };

  /* --- Funciones de Gestión (Admin/Dueño) --- */
  const openEditModal = () => {
    setEditTitulo(recetaCompleta?.titulo || '');
    setEditDescripcion(recetaCompleta?.descripcion || '');
    setEditTiempoPreparacion((recetaCompleta?.tiempo_preparacion || '').toString());
    setEditPorciones((recetaCompleta?.porciones || '').toString());
    setEditDificultad(recetaCompleta?.dificultad || 'medio');
    setEditCategoria(recetaCompleta?.categoria || '');
    setEditIngredientes(Array.isArray(recetaCompleta?.ingredientes) ? recetaCompleta.ingredientes.join('\n') : '');
    setEditPasos(Array.isArray(recetaCompleta?.pasos) ? recetaCompleta.pasos.join('\n') : '');
    setShowEditModal(true);
  };

  const handleEditReceta = async () => {
    try {
      setEditLoading(true);
      const payload = {
        titulo: editTitulo.trim(),
        descripcion: editDescripcion.trim(),
        tiempo_preparacion: parseInt(editTiempoPreparacion),
        porciones: parseInt(editPorciones),
        dificultad: editDificultad,
        categoria: editCategoria.trim(),
        ingredientes: editIngredientes.split('\n').filter(i => i.trim()),
        pasos: editPasos.split('\n').filter(p => p.trim()),
      };

      if (isAdmin) await AdminService.updateReceta(recetaCompleta.id, payload);
      else await updateReceta(recetaCompleta.id, payload);

      setShowEditModal(false);
      cargarDetalleReceta();
      Alert.alert('Éxito', 'Receta actualizada');
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReceta = () => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            if (isAdmin) await AdminService.deleteReceta(receta.id);
            else await deleteReceta(receta.id);
            navigation.goBack();
          } catch (err) { Alert.alert('Error', 'No se pudo eliminar'); }
      }}
    ]);
  };

  const handleBlockReceta = async () => {
    if (recetaCompleta?.is_blocked) {
      try {
        await AdminService.unblockReceta(receta.id);
        setRecetaCompleta({ ...recetaCompleta, is_blocked: false });
      } catch (err) { Alert.alert('Error', 'No se pudo desbloquear'); }
    } else {
      setBlockModalVisible(true);
    }
  };

  const confirmBlockReceta = async () => {
    try {
      await AdminService.blockReceta(receta.id, blockModalReason);
      setRecetaCompleta({ ...recetaCompleta, is_blocked: true });
      setBlockModalVisible(false);
    } catch (err) { Alert.alert('Error', 'Error al bloquear'); }
  };

  if (!recetaCompleta) {
    return (
      <SafeAreaView style={[styles.loadContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Imagen Cabecera */}
        {recetaCompleta.imagen && (
          <Image source={{ uri: recetaCompleta.imagen }} style={styles.recetaImagen} />
        )}

        <View style={styles.contentContainer}>
          {/* Título y Autor */}
          <Text style={[styles.titulo, { color: colors.text }]}>{recetaCompleta.titulo}</Text>
          <TouchableOpacity 
            style={styles.autorContainer} 
            onPress={() => navigation.navigate('UsuarioPerfil', { usuarioId: receta.user_id })}
          >
            <MaterialCommunityIcons name="account-circle" size={32} color={colors.primary} />
            <Text style={[styles.autorNombre, { color: colors.text }]}>{recetaCompleta.autor?.name}</Text>
          </TouchableOpacity>

          {/* Botones de Acción */}
          <View style={styles.interactionContainer}>
            <TouchableOpacity onPress={toggleLike} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
              <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={28} color="#FF6B6B" />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Me gusta</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleSave} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
              <MaterialCommunityIcons name={saved ? 'bookmark' : 'bookmark-outline'} size={28} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Guardar</Text>
            </TouchableOpacity>

            {!esMiReceta && (
              <TouchableOpacity onPress={toggleSeguir} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
                <MaterialCommunityIcons name={siguiendo ? 'account-check' : 'account-plus'} size={28} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{siguiendo ? 'Siguiendo' : 'Seguir'}</Text>
              </TouchableOpacity>
            )}

              {esMiReceta && (
              <>
                <TouchableOpacity onPress={openEditModal} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
                  <MaterialCommunityIcons name="pencil" size={28} color="#4ECDC4" />
                  <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteReceta} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
                  <MaterialCommunityIcons name="delete" size={28} color="#FF6B6B" />
                  <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Eliminar</Text>
                </TouchableOpacity>
              </>
            )}

            {isAdmin && (
              <TouchableOpacity onPress={handleBlockReceta} style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}>
                <MaterialCommunityIcons 
                  name={recetaCompleta.is_blocked ? 'lock-open' : 'lock'} 
                  size={28} 
                  color={recetaCompleta.is_blocked ? '#51CF66' : '#FFA94D'} 
                />
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                  {recetaCompleta.is_blocked ? 'Desbloquear' : 'Bloquear'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Divider colors={colors} />
          
          {/* Descripción */}
          <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción</Text>
             <Text style={[styles.descripcionText, { color: colors.textSecondary }]}>{recetaCompleta.descripcion}</Text>
          </View>

          {/* Grid Detalles */}
          <View style={styles.detallesGrid}>
            <View style={[styles.detalleCard, { backgroundColor: colors.cardBackground }]}>
               <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
               <Text style={[styles.detalleValue, { color: colors.text }]}>{recetaCompleta.tiempo_preparacion} min</Text>
            </View>
            <View style={[styles.detalleCard, { backgroundColor: colors.cardBackground }]}>
               <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
               <Text style={[styles.detalleValue, { color: colors.text }]}>{recetaCompleta.porciones} pers.</Text>
            </View>
          </View>

          <Divider colors={colors} />

          {/* Ingredientes */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredientes</Text>
          {recetaCompleta.ingredientes?.map((ing, i) => (
            <IngredienteItem key={i} ingrediente={ing} index={i} colors={colors} />
          ))}

          <Divider colors={colors} />

          {/* Pasos */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pasos</Text>
          {recetaCompleta.pasos?.map((p, i) => (
            <PasoItem key={i} paso={p} index={i} colors={colors} />
          ))}

          <Divider colors={colors} />

          {/* Comentarios */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Comentarios ({comentarios.length})</Text>
          {comentarios.map((c, i) => <ComentarioItem key={i} comentario={c} colors={colors} />)}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* --- MODAL EDICIÓN --- */}
      <Modal visible={showEditModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>Editar Receta</Text>
            
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editTitulo} onChangeText={setEditTitulo} placeholder="Título" />
            <TextInput style={[styles.inputMultiline, { color: colors.text, borderColor: colors.border }]} value={editDescripcion} onChangeText={setEditDescripcion} multiline placeholder="Descripción" />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editTiempoPreparacion} onChangeText={setEditTiempoPreparacion} keyboardType="numeric" placeholder="Tiempo (min)" />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editPorciones} onChangeText={setEditPorciones} keyboardType="numeric" placeholder="Porciones" />
            
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker selectedValue={editDificultad} onValueChange={setEditDificultad} style={{ color: colors.text }}>
                <Picker.Item label="Fácil" value="facil" />
                <Picker.Item label="Medio" value="medio" />
                <Picker.Item label="Difícil" value="dificil" />
              </Picker>
            </View>

            <TextInput style={[styles.inputMultilineLarge, { color: colors.text, borderColor: colors.border }]} value={editIngredientes} onChangeText={setEditIngredientes} multiline placeholder="Ingredientes (uno por línea)" />
            <TextInput style={[styles.inputMultilineLarge, { color: colors.text, borderColor: colors.border }]} value={editPasos} onChangeText={setEditPasos} multiline placeholder="Pasos (uno por línea)" />

            <TouchableOpacity style={[styles.botonGuardar, { backgroundColor: colors.primary }]} onPress={handleEditReceta}>
              {editLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botonTexto}>Guardar Cambios</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.botonCancelar} onPress={() => setShowEditModal(false)}>
              <Text style={{ color: 'red', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- MODAL BLOQUEO (ADMIN) --- */}
      <Modal visible={blockModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.blockModalBox, { backgroundColor: colors.cardBackground }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Razón del bloqueo</Text>
            <TextInput 
              style={[styles.blockInput, { color: colors.text, borderColor: colors.border }]} 
              value={blockModalReason} 
              onChangeText={setBlockModalReason} 
              multiline 
            />
            <TouchableOpacity style={[styles.botonGuardar, {backgroundColor: '#FF6B6B', marginTop: 15}]} onPress={confirmBlockReceta}>
              <Text style={styles.botonTexto}>Confirmar Bloqueo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBlockModalVisible(false)} style={{ marginTop: 15 }}>
              <Text style={{ color: colors.text, textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({
  loadContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recetaImagen: { width: '100%', height: 280 },
  contentContainer: { padding: 20 },
  titulo: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  autorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  autorNombre: { marginLeft: 10, fontSize: 16, fontWeight: '600' },
  interactionContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { alignItems: 'center', width: '30%', padding: 10, borderRadius: 10, marginBottom: 10 },
  actionLabel: { fontSize: 11, marginTop: 4 },
  divider: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  descripcionText: { fontSize: 16, lineHeight: 24 },
  detallesGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  detalleCard: { padding: 15, borderRadius: 10, alignItems: 'center', width: '45%' },
  detalleValue: { fontWeight: 'bold', marginTop: 5 },
  ingredienteItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ingredienteIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  ingredienteNumber: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  ingredienteText: { fontSize: 16 },
  pasoItem: { padding: 15, borderRadius: 10, marginBottom: 10 },
  pasoNumber: { width: 25, height: 25, borderRadius: 12.5, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  pasoNumberText: { color: 'white', fontWeight: 'bold' },
  pasoText: { fontSize: 15 },
  comentarioItem: { padding: 15, borderRadius: 10, marginBottom: 15 },
  comentarioHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  comentarioAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
  comentarioUserName: { fontWeight: 'bold' },
  comentarioInfo: { marginLeft: 10, flex: 1 },
  ratingContainer: { flexDirection: 'row', gap: 2, marginTop: 4 },
  comentarioText: { fontSize: 14, fontStyle: 'italic' },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  inputMultiline: { borderWidth: 1, borderRadius: 8, padding: 12, height: 80, marginBottom: 10 },
  inputMultilineLarge: { borderWidth: 1, borderRadius: 8, padding: 12, height: 120, marginBottom: 10, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  botonGuardar: { padding: 15, borderRadius: 10, alignItems: 'center' },
  botonTexto: { color: '#FFF', fontWeight: 'bold' },
  botonCancelar: { padding: 10, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  blockModalBox: { padding: 25, borderRadius: 20 },
  blockInput: { borderWidth: 1, borderRadius: 8, padding: 10, height: 100, marginTop: 15, textAlignVertical: 'top' },
});