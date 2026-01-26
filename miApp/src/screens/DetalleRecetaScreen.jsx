import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import StarRating from '../components/StarRating';
import { AdminService } from '../services/AdminService';
import { SharingService } from '../services/SharingService';
import { ReportModal } from '../components/ReportModal';
import { ReportService } from '../services/ReportService';

const IngredienteItem = ({ ingrediente, index, colors }) => (
  <View style={styles.ingredienteItem}>
    <View style={[styles.ingredienteIcon, { backgroundColor: colors.primary }]}>
      <Text style={styles.ingredienteNumber}>{index + 1}</Text>
    </View>
    <Text style={[styles.ingredienteText, { color: colors.text }]}>{ingrediente}</Text>
  </View>
);

const PasoItem = ({ paso, index, colors }) => (
  <View style={[styles.pasoItem, { backgroundColor: colors.cardBackground }]}>
    <View style={[styles.pasoNumber, { backgroundColor: colors.primary }]}>
      <Text style={styles.pasoNumberText}>{index + 1}</Text>
    </View>
    <Text style={[styles.pasoText, { color: colors?.text }]}>{paso}</Text>
  </View>
);

const ComentarioItem = ({ comentario, colors, canReport = false, hasReported = false, onReport }) => (
  <View style={[styles.comentarioItem, { backgroundColor: colors.cardBackground }]}>
    <View style={styles.comentarioHeader}>
      <Image
        source={{ uri: comentario.user?.imagen_perfil || 'https://via.placeholder.com/40' }}
        style={styles.comentarioAvatar}
      />
      <View style={styles.comentarioInfo}>
        <Text style={[styles.comentarioUserName, { color: colors.text }]}>{comentario.user?.name || 'Usuario'}</Text>
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

      {canReport ? (
        <TouchableOpacity
          onPress={onReport}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ paddingLeft: 10, paddingVertical: 2 }}
        >
          <MaterialCommunityIcons
            name={hasReported ? 'flag' : 'flag-outline'}
            size={20}
            color={hasReported ? colors.error : colors.textSecondary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
    <Text style={[styles.comentarioText, { color: colors.textSecondary }]}>{comentario.contenido}</Text>
  </View>
);

export default function DetalleRecetaScreen({ route, navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { receta, recetaId, isAdmin } = route.params || {};
  
  // Logging para debugging
  console.log('DetalleRecetaScreen - route.params:', route.params);
  console.log('DetalleRecetaScreen - recetaId extraído:', recetaId);
  console.log('DetalleRecetaScreen - receta extraída:', receta);
  
  const [loading, setLoading] = useState(false);
  const [recetaCompleta, setRecetaCompleta] = useState({
    ...receta,
    is_blocked: receta?.is_blocked || false,
  });
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [mostrarModalResena, setMostrarModalResena] = useState(false);
  const [token, setToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [siguiendo, setSiguiendo] = useState(false);
  const [esMiReceta, setEsMiReceta] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showCommentReportModal, setShowCommentReportModal] = useState(false);
  const [commentReporting, setCommentReporting] = useState(false);
  const [commentToReport, setCommentToReport] = useState(null);
  const [reportedCommentMap, setReportedCommentMap] = useState({});
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  const [deletingReceta, setDeletingReceta] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editIngredientes, setEditIngredientes] = useState('');
  const [editPasos, setEditPasos] = useState('');
  const [editTiempoPreparacion, setEditTiempoPreparacion] = useState('');
  const [editPorciones, setEditPorciones] = useState('');
  const [editDificultad, setEditDificultad] = useState('medio');
  const [editCategoria, setEditCategoria] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockModalReason, setBlockModalReason] = useState('');
  const [blockingReceta, setBlockingReceta] = useState(false);
  const [mostrarModalCompartir, setMostrarModalCompartir] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      const tk = await AsyncStorage.getItem('authToken');
      setToken(tk);

      if (tk) {
        try {
          const { data: userData } = await apiClient.get(`/user`);
          setCurrentUserId(userData?.id ?? null);
        } catch (error) {
          console.error('Error obteniendo usuario:', error);
        }
      }
      
      console.log('DetalleRecetaScreen inicializando - recetaId:', recetaId, 'receta:', receta?.id);
      
      // Si viene solo recetaId, cargar directamente
      if (recetaId && !receta) {
        console.log('Cargando con recetaId:', recetaId);
        await cargarDetalleReceta(tk, recetaId);
        await cargarComentarios(recetaId);
      } else if (receta) {
        console.log('Cargando con receta.id:', receta.id);
        // Obtener usuario actual para saber si es su receta
        if (tk) {
          try {
            const { data: userData } = await apiClient.get(`/user`);
            setCurrentUserId(userData?.id ?? null);
            setEsMiReceta(userData.id === receta.user_id);
          } catch (error) {
            console.error('Error obteniendo usuario:', error);
          }
        }
        
        // Ahora cargar receta con el token disponible
        await cargarDetalleReceta(tk, receta.id);
        await cargarComentarios(receta.id);
      }
    };
    inicializar();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const id = recetaCompleta?.id || receta?.id || recetaId;
      if (!id) return;
      // Al volver a la pantalla (o al enfocarla), refrescar para reflejar eliminaciones/bloqueos.
      cargarDetalleReceta(token, id);
      cargarComentarios(id);
    }, [recetaCompleta?.id, receta?.id, recetaId, token])
  );

  useEffect(() => {
    const id = recetaCompleta?.id || receta?.id || recetaId;
    if (!id) return;

    const key = `reported:receta:${id}`;
    AsyncStorage.getItem(key)
      .then((v) => {
        if (v === '1') setHasReported(true);
      })
      .catch(() => {});
  }, [recetaCompleta?.id, receta?.id, recetaId]);

  const recetaReportReasons = [
    { key: 'inapropiado', label: 'Contenido inapropiado', help: 'Lenguaje ofensivo, violencia, etc.' },
    { key: 'spam', label: 'Spam', help: 'Publicidad o contenido repetitivo.' },
    { key: 'falso', label: 'Información falsa', help: 'Datos engañosos o peligrosos.' },
    { key: 'plagios', label: 'Plagio', help: 'Copia sin atribución.' },
    { key: 'otro', label: 'Otro', help: 'Especifica el motivo.' },
  ];

  const commentReportReasons = useMemo(
    () => [
      { key: 'inapropiado', label: 'Contenido inapropiado', help: 'Lenguaje ofensivo, insultos, etc.' },
      { key: 'spam', label: 'Spam', help: 'Publicidad o contenido repetitivo.' },
      { key: 'acoso', label: 'Acoso', help: 'Ataques o intimidación.' },
      { key: 'otro', label: 'Otro', help: 'Especifica el motivo.' },
    ],
    []
  );

  const openReport = () => {
    if (!token) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para reportar.');
      return;
    }
    setShowReportModal(true);
  };

  const submitRecetaReport = async ({ reason, description }) => {
    const id = recetaCompleta?.id || receta?.id || recetaId;
    const key = id ? `reported:receta:${id}` : null;

    try {
      setReporting(true);
      await ReportService.reportReceta(id, reason, description);
      setHasReported(true);
      if (key) {
        await AsyncStorage.setItem(key, '1');
      }
      setShowReportModal(false);
      Alert.alert('Gracias', 'Tu reporte fue enviado.');
    } catch (error) {
      // Si el backend responde que ya existe, también lo marcamos como reportado.
      const status = error?.response?.status;
      if (status === 409) {
        setHasReported(true);
        if (key) {
          try {
            await AsyncStorage.setItem(key, '1');
          } catch {}
        }
        setShowReportModal(false);
      }
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo enviar el reporte';
      Alert.alert('Error', msg);
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    const items = Array.isArray(comentarios) ? comentarios : [];
    if (!items.length) {
      setReportedCommentMap({});
      return;
    }

    const keys = items
      .map((c) => c?.id)
      .filter(Boolean)
      .map((id) => `reported:comentario:${id}`);

    if (!keys.length) return;

    AsyncStorage.multiGet(keys)
      .then((pairs) => {
        const next = {};
        for (const [k, v] of pairs) {
          if (v === '1') {
            const idStr = (k || '').split(':').pop();
            if (idStr) next[idStr] = true;
          }
        }
        setReportedCommentMap(next);
      })
      .catch(() => {});
  }, [comentarios]);

  const openCommentReport = (comentario) => {
    if (!token) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para reportar.');
      return;
    }
    if (!comentario?.id) return;
    setCommentToReport(comentario);
    setShowCommentReportModal(true);
  };

  const submitCommentReport = async ({ reason, description }) => {
    const comentarioId = commentToReport?.id;
    if (!comentarioId) return;
    const key = `reported:comentario:${comentarioId}`;

    try {
      setCommentReporting(true);
      await ReportService.reportComentario(comentarioId, reason, description);
      setReportedCommentMap((prev) => ({ ...prev, [String(comentarioId)]: true }));
      try {
        await AsyncStorage.setItem(key, '1');
      } catch {}
      setShowCommentReportModal(false);
      setCommentToReport(null);
      Alert.alert('Gracias', 'Tu reporte fue enviado.');
    } catch (error) {
      const status = error?.response?.status;
      if (status === 409) {
        setReportedCommentMap((prev) => ({ ...prev, [String(comentarioId)]: true }));
        try {
          await AsyncStorage.setItem(key, '1');
        } catch {}
        setShowCommentReportModal(false);
        setCommentToReport(null);
        return;
      }
      const msg = error?.response?.data?.message || error?.message || 'No se pudo enviar el reporte';
      Alert.alert('Error', msg);
    } finally {
      setCommentReporting(false);
    }
  };

  const obtenerToken = async () => {
    const tk = await AsyncStorage.getItem('authToken');
    setToken(tk);
    return tk;
  };

  const cargarDetalleReceta = async (tk = null, id = null) => {
    try {
      const recetaId = id || receta?.id;
      console.log('cargarDetalleReceta - id pasado:', id, ', receta?.id:', receta?.id, ', recetaId final:', recetaId);
      
      if (!recetaId) {
        console.error('No hay ID de receta para cargar');
        Alert.alert('Error', 'No se pudo cargar la receta');
        return;
      }
      
      const { data } = await apiClient.get(`/recetas/${recetaId}`);
      // Hacer merge con los datos existentes para preservar la imagen original
      setRecetaCompleta(prev => ({
        ...prev,
        ...data,
        imagen: data.imagen || prev.imagen // Asegurar que la imagen se preserva
      }));
      // Actualizar estados de like y saved
      setLiked(data.user_liked || false);
      setSaved(data.user_saved || false);
      setSiguiendo(data.user_follows_author || false);
      console.log('Receta cargada:', data);
      console.log('user_liked:', data.user_liked, 'user_saved:', data.user_saved);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      Alert.alert('Error', 'No se pudo cargar la receta');
    }
  };

  const cargarComentarios = async (id = null) => {
    try {
      const recetaId = id || receta?.id || recetaCompleta?.id;
      console.log('cargarComentarios - id pasado:', id, ', receta?.id:', receta?.id, ', recetaCompleta?.id:', recetaCompleta?.id, ', recetaId final:', recetaId);
      
      if (!recetaId) {
        console.warn('No hay ID de receta para cargar comentarios');
        return;
      }
      
      const { data } = await apiClient.get(`/comentarios/${recetaId}`);
      console.log('Comentarios cargados:', data);
      setComentarios(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error cargando comentarios:', error.response?.status, error.message, error);
      setComentarios([]);
    }
  };

  const toggleLike = async () => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    try {
      // Actualizar estado local inmediatamente
      const nuevoEstadoLike = !liked;
      setLiked(nuevoEstadoLike);

      await apiClient.post(`/recetas/${receta.id}/like`);
      // Recargar receta para actualizar el contador de likes
      cargarDetalleReceta();
    } catch (error) {
      // Revertir el estado si hay error
      setLiked(!liked);
      console.error('Error dando like:', error);
      Alert.alert('Error', 'No se pudo dar like');
    }
  };

  const toggleSave = async () => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    try {
      // Actualizar estado local inmediatamente
      const nuevoEstadoSave = !saved;
      setSaved(nuevoEstadoSave);

      await apiClient.post(`/recetas/${receta.id}/save`);
      Alert.alert('Éxito', nuevoEstadoSave ? 'Receta guardada' : 'Receta eliminada de guardadas');
    } catch (error) {
      // Revertir el estado si hay error
      setSaved(!saved);
      console.error('Error guardando:', error);
      Alert.alert('Error', 'No se pudo guardar la receta');
    }
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }

    if (nuevaCalificacion === 0) {
      Alert.alert('Error', 'Debes dar una calificación');
      return;
    }

    try {
      await apiClient.post(`/comentarios/${receta.id}`, {
        contenido: nuevoComentario,
        calificacion: nuevaCalificacion,
      });

      setNuevoComentario('');
      setNuevaCalificacion(0);
      setMostrarModalResena(false);
      Alert.alert('Éxito', 'Comentario publicado');
      cargarComentarios();
      cargarDetalleReceta();
    } catch (error) {
      console.error('Error publicando comentario:', error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo publicar el comentario';
      Alert.alert('Error', msg);
    }
  };

  const compartirReceta = () => {
    setMostrarModalCompartir(true);
  };

  const handleCompartirOpcion = async (opcion) => {
    setMostrarModalCompartir(false);
    try {
      switch (opcion) {
        case 'whatsapp':
          await SharingService.compartirWhatsApp(recetaCompleta);
          break;
        case 'facebook':
          await SharingService.compartirFacebook(recetaCompleta);
          break;
        case 'instagram':
          await SharingService.compartirInstagram(recetaCompleta);
          break;
        case 'correo':
          await SharingService.compartirCorreo(recetaCompleta);
          break;
        case 'nativo':
          await SharingService.compartirReceta(recetaCompleta);
          break;
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo completar la acción');
    }
  };

  // ===== FUNCIONES DE ADMIN =====
  const handleDeleteReceta = useCallback(async () => {
    Alert.alert(
      'Eliminar Receta',
      '¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              setDeletingReceta(true);
              console.log('Eliminando receta:', recetaCompleta.id);
              await AdminService.deleteReceta(recetaCompleta.id);
              Alert.alert('Éxito', 'Receta eliminada', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error eliminando receta:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta');
            } finally {
              setDeletingReceta(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, [recetaCompleta.id, navigation]);

  const handleBlockReceta = useCallback(() => {
    console.log('handleBlockReceta ejecutada - is_blocked:', recetaCompleta.is_blocked);
    const isBlocked = recetaCompleta.is_blocked;
    
    if (isBlocked) {
      // Si ya está bloqueada, solo desbloquear
      Alert.alert(
        'Desbloquear Receta',
        '¿Desbloquear esta receta?',
        [
          { text: 'Cancelar' },
          {
            text: 'Desbloquear',
            onPress: async () => {
              try {
                setBlockingReceta(true);
                console.log('Desbloqueando receta:', recetaCompleta.id);
                await AdminService.unblockReceta(recetaCompleta.id);
                setRecetaCompleta({ ...recetaCompleta, is_blocked: false });
                Alert.alert('Éxito', 'Receta desbloqueada');
              } catch (error) {
                console.error('Error desbloqueando receta:', error);
                Alert.alert('Error', 'No se pudo desbloquear la receta');
              } finally {
                setBlockingReceta(false);
              }
            },
          },
        ]
      );
    } else {
      // Si no está bloqueada, abrir modal para pedir razón
      console.log('Abriendo modal de bloqueo');
      setBlockModalReason('');
      setBlockModalVisible(true);
    }
  }, [recetaCompleta.id, recetaCompleta.is_blocked]);

  const confirmBlockReceta = useCallback(async () => {
    if (!blockModalReason.trim()) {
      Alert.alert('Error', 'Ingresa una razón para bloquear la receta');
      return;
    }

    try {
      setBlockingReceta(true);
      console.log('Bloqueando receta:', recetaCompleta.id, 'Razón:', blockModalReason);
      await AdminService.blockReceta(recetaCompleta.id, blockModalReason);
      
      // Actualizar el estado de la receta
      setRecetaCompleta({ ...recetaCompleta, is_blocked: true });
      
      // Cerrar el modal
      setBlockModalVisible(false);
      setBlockModalReason('');
      
      Alert.alert('Éxito', 'Receta bloqueada correctamente');
    } catch (error) {
      console.error('Error bloqueando receta:', error);
      Alert.alert('Error', 'No se pudo bloquear la receta');
    } finally {
      setBlockingReceta(false);
    }
  }, [recetaCompleta.id, blockModalReason]);

  const openEditModal = () => {
    setEditTitulo(recetaCompleta.titulo || '');
    setEditDescripcion(recetaCompleta.descripcion || '');
    setEditTiempoPreparacion((recetaCompleta.tiempo_preparacion || '').toString());
    setEditPorciones((recetaCompleta.porciones || '').toString());
    setEditDificultad(recetaCompleta.dificultad || 'medio');
    setEditCategoria(recetaCompleta.categoria || '');
    setEditIngredientes(Array.isArray(recetaCompleta.ingredientes) 
      ? recetaCompleta.ingredientes.join('\n') 
      : typeof recetaCompleta.ingredientes === 'string'
      ? recetaCompleta.ingredientes
      : '');
    setEditPasos(Array.isArray(recetaCompleta.pasos) 
      ? recetaCompleta.pasos.join('\n') 
      : typeof recetaCompleta.pasos === 'string'
      ? recetaCompleta.pasos
      : '');
    setShowEditModal(true);
  };

  const handleEditReceta = async () => {
    if (!editTitulo.trim() || !editDescripcion.trim()) {
      Alert.alert('Error', 'Título y descripción son requeridos');
      return;
    }

    try {
      setEditLoading(true);
      const ingredientesArray = editIngredientes.split('\n').filter(i => i.trim());
      const pasosArray = editPasos.split('\n').filter(p => p.trim());
      const tiempoPreparacion = parseInt(editTiempoPreparacion) || null;
      const porciones = parseInt(editPorciones) || null;

      await AdminService.updateReceta(recetaCompleta.id, {
        titulo: editTitulo,
        descripcion: editDescripcion,
        tiempo_preparacion: tiempoPreparacion,
        porciones: porciones,
        dificultad: editDificultad,
        categoria: editCategoria,
        ingredientes: JSON.stringify(ingredientesArray),
        pasos: JSON.stringify(pasosArray),
      });

      Alert.alert('Éxito', 'Receta actualizada');
      setShowEditModal(false);
      
      // Recargar la receta
      await cargarDetalleReceta(token);
    } catch (error) {
      console.error('Error editando receta:', error);
      Alert.alert('Error', 'No se pudo actualizar la receta');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleSeguir = async () => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    try {
      const nuevoEstadoSeguimiento = !siguiendo;
      setSiguiendo(nuevoEstadoSeguimiento);

      if (siguiendo) {
        await apiClient.post(`/usuarios/${receta.user_id}/dejar-de-seguir`);
      } else {
        await apiClient.post(`/usuarios/${receta.user_id}/seguir`);
      }

      // Recargar para actualizar datos del usuario
      await cargarDetalleReceta(token);
    } catch (error) {
      setSiguiendo(!siguiendo);
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo completar la acción');
    }
  };

  const irAlPerfilUsuario = () => {
    navigation.navigate('UsuarioPerfil', { usuarioId: receta.user_id });
  };

  const iniciarChat = () => {
    if (!recetaCompleta.user) {
      Alert.alert('Error', 'No se puede contactar con el autor de esta receta');
      return;
    }
    navigation.navigate('Chat', {
      usuarioId: recetaCompleta.user.id,
      usuarioNombre: recetaCompleta.user.name,
      usuarioImagen: recetaCompleta.user.imagen_perfil,
    });
  };

  if (!recetaCompleta) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </SafeAreaView>
    );
  }

  const ingredientes = Array.isArray(recetaCompleta.ingredientes)
    ? recetaCompleta.ingredientes
    : JSON.parse(recetaCompleta.ingredientes || '[]');

  const pasos = Array.isArray(recetaCompleta.pasos)
    ? recetaCompleta.pasos
    : JSON.parse(recetaCompleta.pasos || '[]');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{recetaCompleta.titulo}</Text>
        {!esMiReceta && !isAdmin ? (
          <TouchableOpacity onPress={openReport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons
              name={hasReported ? 'flag' : 'flag-outline'}
              size={26}
              color={hasReported ? colors.error : colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ReportModal
        visible={showReportModal}
        title="Reportar receta"
        reasons={recetaReportReasons}
        submitting={reporting}
        onClose={() => setShowReportModal(false)}
        onSubmit={submitRecetaReport}
      />

      <ReportModal
        visible={showCommentReportModal}
        title="Reportar comentario"
        reasons={commentReportReasons}
        submitting={commentReporting}
        onClose={() => {
          setShowCommentReportModal(false);
          setCommentToReport(null);
        }}
        onSubmit={submitCommentReport}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Imagen */}
        <Image
          source={{ uri: recetaCompleta.imagen || recetaCompleta.imagen_url || 'https://via.placeholder.com/400x300' }}
          style={styles.recipeImage}
        />

        {/* Usuario */}
        <TouchableOpacity
          style={[styles.userSection, { borderBottomColor: colors.border }]}
          onPress={irAlPerfilUsuario}
        >
          <Image
            source={{ uri: recetaCompleta.user?.imagen_perfil || 'https://via.placeholder.com/48' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{recetaCompleta.user?.name || 'Usuario'}</Text>
            <Text style={[styles.userDate, { color: colors.textSecondary }]}>Receta</Text>
          </View>
          {!esMiReceta && (
            <View style={styles.userButtonsContainer}>
              <TouchableOpacity
                style={[styles.followButton, siguiendo && styles.followButtonActive]}
                onPress={toggleSeguir}
              >
                <Text style={[
                  styles.followButtonText,
                  siguiendo && styles.followButtonTextActive,
                ]}>
                  {siguiendo ? 'Siguiendo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={iniciarChat}
              >
                <MaterialCommunityIcons name="message-text-outline" size={18} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Contactar</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Acciones */}
        <View style={[styles.actionsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, liked && styles.actionBtnActive]}
            onPress={toggleLike}
          >
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? '#FF4757' : '#D4AF37'}
            />
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{recetaCompleta.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="comment-outline" size={24} color="#D4AF37" />
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{recetaCompleta.comentarios_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, saved && styles.actionBtnActive]}
            onPress={toggleSave}
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? '#D4AF37' : '#D4AF37'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={compartirReceta}>
            <MaterialCommunityIcons name="share-variant" size={24} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {/* Opciones Admin */}
        {isAdmin && (
          <View style={[styles.adminContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.adminTitle, { color: colors.text }]}>Opciones de Admin</Text>
            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: colors.primary }]}
                onPress={openEditModal}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                <Text style={styles.adminButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: recetaCompleta.is_blocked ? '#4caf50' : '#FFA500' }]}
                onPress={handleBlockReceta}
                disabled={blockingReceta}
              >
                {blockingReceta ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons 
                      name={recetaCompleta.is_blocked ? 'lock-open' : 'lock'} 
                      size={18} 
                      color="#fff" 
                    />
                    <Text style={styles.adminButtonText}>
                      {recetaCompleta.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: '#FF4757', opacity: deletingReceta ? 0.5 : 1 }]}
                onPress={handleDeleteReceta}
                disabled={deletingReceta}
              >
                {deletingReceta ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
                    <Text style={styles.adminButtonText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Opciones para el dueño de la receta */}
        {esMiReceta && !isAdmin && (
          <View style={[styles.adminContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.adminTitle, { color: colors.text }]}>Tus opciones</Text>
            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: colors.primary }]}
                onPress={openEditModal}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                <Text style={styles.adminButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: '#FF4757', opacity: deletingReceta ? 0.5 : 1 }]}
                onPress={handleDeleteReceta}
                disabled={deletingReceta}
              >
                {deletingReceta ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
                    <Text style={styles.adminButtonText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rating (estrellas) */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {recetaCompleta.id ? (
            <StarRating recetaId={recetaCompleta.id} />
          ) : (
            <ActivityIndicator size="small" color="#D4AF37" />
          )}
        </View>

        {/* Info rápida */}
        <View style={[styles.infoGrid, { backgroundColor: colors.surface }]}>
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#FF6B35" />
            <Text style={[styles.infoValue, { color: colors.text }]}>{recetaCompleta.tiempo_preparacion} min</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tiempo</Text>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="pot-mix" size={24} color="#4CAF50" />
            <Text style={[styles.infoValue, { color: colors.text }]}>{recetaCompleta.porciones}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Porciones</Text>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="fire" size={24} color="#2196F3" />
            <Text style={[styles.infoValue, { color: colors.text }]}>{recetaCompleta.dificultad}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dificultad</Text>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="leaf" size={24} color="#4CAF50" />
            <Text style={[styles.infoValue, { color: colors.text }]}>{recetaCompleta.tipo_dieta}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tipo Dieta</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{recetaCompleta.descripcion}</Text>
        </View>

        {/* Ingredientes */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredientes</Text>
          {ingredientes.map((ing, idx) => (
            <IngredienteItem key={idx} ingrediente={ing} index={idx} colors={colors} />
          ))}
        </View>

        {/* Pasos */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preparación</Text>
          {pasos.map((paso, idx) => (
            <PasoItem key={idx} paso={paso} index={idx} colors={colors} />
          ))}
        </View>

        {/* Reseñas */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <View style={styles.resenaHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reseñas</Text>
            <TouchableOpacity
              style={styles.agregarResenaBtn}
              onPress={() => setMostrarModalResena(true)}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.agregarResenaBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {comentarios.length === 0 ? (
            <View style={styles.sinComentariosContainer}>
              <MaterialCommunityIcons name="comment-outline" size={48} color="#DDD" />
              <Text style={[styles.sinComentariosText, { color: colors.text }]}>Aún no hay reseñas</Text>
              <Text style={[styles.sinComentariosSubtext, { color: colors.textSecondary }]}>¡Sé el primero en comentar!</Text>
            </View>
          ) : (
            <FlatList
              data={comentarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ComentarioItem
                  comentario={item}
                  colors={colors}
                  canReport={!!token && !isAdmin && currentUserId != null && item?.user_id !== currentUserId}
                  hasReported={!!reportedCommentMap?.[String(item?.id)]}
                  onReport={() => openCommentReport(item)}
                />
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal Agregar Reseña */}
      <Modal
        visible={mostrarModalResena}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalResena(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay} />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}> 
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}> 
              <Text style={[styles.modalTitle, { color: colors.text }]}>Agregar reseña</Text>
              <TouchableOpacity onPress={() => setMostrarModalResena(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Calificación</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNuevaCalificacion(star)}
                  >
                    <MaterialCommunityIcons
                      name={star <= nuevaCalificacion ? 'star' : 'star-outline'}
                      size={32}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tu comentario</Text>
              <TextInput
                style={[styles.commentInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="Comparte tu experiencia con esta receta..."
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMostrarModalResena(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPublishBtn}
                onPress={agregarComentario}
              >
                <Text style={styles.modalPublishBtnText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Edición */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Receta</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <Text style={[styles.labelText, { color: colors.text }]}>Título</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Título de la receta"
              placeholderTextColor={colors.textSecondary}
              value={editTitulo}
              onChangeText={setEditTitulo}
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Descripción</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border, minHeight: 80 }]}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              multiline
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Tiempo de Preparación (minutos)</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: 30"
              placeholderTextColor={colors.textSecondary}
              value={editTiempoPreparacion}
              onChangeText={setEditTiempoPreparacion}
              keyboardType="numeric"
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Porciones</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: 4"
              placeholderTextColor={colors.textSecondary}
              value={editPorciones}
              onChangeText={setEditPorciones}
              keyboardType="numeric"
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Dificultad</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={editDificultad}
                onValueChange={setEditDificultad}
                style={{ color: colors.text }}
              >
                <Picker.Item label="Fácil" value="fácil" />
                <Picker.Item label="Medio" value="medio" />
                <Picker.Item label="Difícil" value="difícil" />
              </Picker>
            </View>

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Categoría</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: Postres"
              placeholderTextColor={colors.textSecondary}
              value={editCategoria}
              onChangeText={setEditCategoria}
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Ingredientes (uno por línea)</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border, minHeight: 100 }]}
              placeholder="Ej: 2 huevos&#10;1 taza de harina"
              placeholderTextColor={colors.textSecondary}
              value={editIngredientes}
              onChangeText={setEditIngredientes}
              multiline
            />

            <Text style={[styles.labelText, { color: colors.text, marginTop: 16 }]}>Pasos (uno por línea)</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border, minHeight: 100 }]}
              placeholder="Ej: Mezclar ingredientes&#10;Cocinar a fuego medio"
              placeholderTextColor={colors.textSecondary}
              value={editPasos}
              onChangeText={setEditPasos}
              multiline
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalPublishBtn, { opacity: editLoading ? 0.5 : 1 }]}
              onPress={handleEditReceta}
              disabled={editLoading}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPublishBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal para bloquear receta */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={[styles.blockModalContent, { backgroundColor: colors.background }]}>
              <View style={styles.blockModalHeader}>
                <Text style={[styles.blockModalTitle, { color: colors.text }]}>Bloquear Receta</Text>
                <TouchableOpacity onPress={() => setBlockModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.blockModalLabel, { color: colors.text }]}>Razón de bloqueo</Text>
              <TextInput
                style={[
                  styles.blockModalInput,
                  { borderColor: colors.border, color: colors.text }
                ]}
                placeholder="Ingresa la razón del bloqueo..."
                placeholderTextColor={colors.textSecondary}
                value={blockModalReason}
                onChangeText={setBlockModalReason}
                multiline
                numberOfLines={4}
                editable={!blockingReceta}
              />

              <View style={styles.blockModalButtons}>
                <TouchableOpacity
                  style={[styles.blockModalCancelBtn, { opacity: blockingReceta ? 0.5 : 1 }]}
                  onPress={() => setBlockModalVisible(false)}
                  disabled={blockingReceta}
                >
                  <Text style={styles.blockModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.blockModalConfirmBtn,
                    { opacity: blockingReceta || !blockModalReason.trim() ? 0.5 : 1 }
                  ]}
                  onPress={confirmBlockReceta}
                  disabled={blockingReceta || !blockModalReason.trim()}
                >
                  {blockingReceta ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.blockModalConfirmText}>Bloquear</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Compartir Receta */}
      <Modal
        visible={mostrarModalCompartir}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalCompartir(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[styles.shareModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: colors.text }]}>Compartir Receta</Text>
              <TouchableOpacity onPress={() => setMostrarModalCompartir(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleCompartirOpcion('whatsapp')}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                  <MaterialCommunityIcons name="whatsapp" size={28} color="#fff" />
                </View>
                <Text style={[styles.shareOptionText, { color: colors.text }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleCompartirOpcion('facebook')}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#1877F2' }]}>
                  <MaterialCommunityIcons name="facebook" size={28} color="#fff" />
                </View>
                <Text style={[styles.shareOptionText, { color: colors.text }]}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleCompartirOpcion('instagram')}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#E4405F' }]}>
                  <MaterialCommunityIcons name="instagram" size={28} color="#fff" />
                </View>
                <Text style={[styles.shareOptionText, { color: colors.text }]}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleCompartirOpcion('correo')}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#EA4335' }]}>
                  <MaterialCommunityIcons name="email-outline" size={28} color="#fff" />
                </View>
                <Text style={[styles.shareOptionText, { color: colors.text }]}>Correo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleCompartirOpcion('nativo')}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: '#D4AF37' }]}>
                  <MaterialCommunityIcons name="share-variant" size={28} color="#fff" />
                </View>
                <Text style={[styles.shareOptionText, { color: colors.text }]}>Más opciones</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 16,
    color: '#000',
  },
  recipeImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  followButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  followButtonTextActive: {
    color: '#D4AF37',
  },
  userButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    gap: 6,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionBtnActive: {
    opacity: 1,
  },
  actionLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  ingredienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredienteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ingredienteNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ingredienteText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  pasoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pasoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pasoNumberText: {
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  pasoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  resenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agregarResenaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
  },
  agregarResenaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  sinComentariosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  sinComentariosText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    fontWeight: '600',
  },
  sinComentariosSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  comentarioItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comentarioAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  comentarioInfo: {
    marginLeft: 12,
    flex: 1,
  },
  comentarioUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  comentarioText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 52,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalPublishBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
  },
  modalPublishBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  adminButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  blockModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  blockModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  blockModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  blockModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  blockModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 100,
  },
  blockModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  blockModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  blockModalCancelText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  blockModalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
  },
  blockModalConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 20,
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    width: '30%',
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },});