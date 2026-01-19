import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useNotificationCount } from '../context/NotificationContext';
import { useAppContext } from '../context/AppContext';
import { BottomNavBar } from '../components/BottomNavBar';
import { AdminBottomNavBar } from '../components/AdminBottomNavBar';

const categorias = [
  { id: 1, nombre: 'Todas', emoji: '🍽️', seleccionada: true },
  { id: 2, nombre: 'Pizza', emoji: '🍕', seleccionada: false },
  { id: 3, nombre: 'Mexicana', emoji: '🌮', seleccionada: false },
  { id: 4, nombre: 'Postres', emoji: '🍰', seleccionada: false },
  { id: 5, nombre: 'Saludable', emoji: '🥗', seleccionada: false },
  { id: 6, nombre: 'Asiática', emoji: '🍣', seleccionada: false },
  { id: 7, nombre: 'Hamburguesas', emoji: '🍔', seleccionada: false },
  { id: 8, nombre: 'Pasta', emoji: '🍝', seleccionada: false },
  { id: 9, nombre: 'Ensaladas', emoji: '🥙', seleccionada: false },
];

// --- Componente de Categoría ---
const CategoriaItem = ({ categoria, onPress, colors }) => {
  const isSelected = !!categoria.seleccionada;
  const bg = isSelected ? colors.primary : colors.surface;
  const border = isSelected ? colors.primary : colors.border;

  return (
    <TouchableOpacity
      style={[styles.categoriaItem, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        pointerEvents="none"
        style={[styles.bookmarkCutout, { borderBottomColor: colors.background }]}
      />

      <Text style={styles.categoriaEmoji}>{categoria.emoji}</Text>
      <Text
        numberOfLines={2}
        style={[
          styles.categoriaNombre,
          isSelected && styles.categoriaNombreSel,
          { color: isSelected ? '#FFFFFF' : colors.text }
        ]}
      >
        {categoria.nombre}
      </Text>
    </TouchableOpacity>
  );
};

// --- Componente de Post/Receta ---
const PostItem = ({ post, onPress, token, navigation, colors }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  // Imágenes por defecto para evitar errores
  const imagenReceta = post.imagen ? { uri: post.imagen } : { uri: 'https://via.placeholder.com/400x300?text=Sin+Imagen' };
  const imagenUsuario = post.usuarioImagen ? { uri: post.usuarioImagen } : { uri: 'https://via.placeholder.com/40' };

  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!token) {
      Alert.alert('Atención', 'Debes iniciar sesión para dar like.');
      return;
    }

    const estadoAnterior = liked;
    const nuevoEstado = !liked;
    
    setLiked(nuevoEstado);
    setLikesCount(nuevoEstado ? likesCount + 1 : Math.max(0, likesCount - 1));

    try {
      await apiClient.post(`/recetas/${post.id}/like`);
    } catch (error) {
      console.error('Error dando like:', error);
      setLiked(estadoAnterior);
      setLikesCount(estadoAnterior ? likesCount + 1 : Math.max(0, likesCount - 1));
      Alert.alert('Error', 'No se pudo registrar el like');
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    
    if (!token) {
      Alert.alert('Atención', 'Debes iniciar sesión para guardar.');
      return;
    }

    const estadoAnterior = saved;
    const nuevoEstado = !saved;
    setSaved(nuevoEstado);

    try {
      await apiClient.post(`/recetas/${post.id}/save`);
    } catch (error) {
      console.error('Error guardando:', error);
      setSaved(estadoAnterior);
      Alert.alert('Error', 'No se pudo guardar la receta');
    }
  };

  return (
    <TouchableOpacity style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={onPress}>
      <Image source={imagenReceta} style={styles.postImage} resizeMode="cover" />
      
      <View style={[styles.postContent, { backgroundColor: colors.cardBackground }]}>
        {/* Usuario */}
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => navigation.navigate('UsuarioPerfil', { usuarioId: post.user_id })}
        >
          <Image source={imagenUsuario} style={styles.userAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{post.usuarioNombre}</Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>Hace 2 horas</Text>
          </View>
        </TouchableOpacity>

        {/* Título y descripción */}
        <Text style={[styles.postTitle, { color: colors.text }]}>{post.titulo}</Text>
        <Text numberOfLines={3} style={[styles.postDescription, { color: colors.textSecondary }]}>{post.descripcion}</Text>

        {/* Información de la receta */}
        <View style={styles.recipeInfo}>
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.tiempoPreparacion}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="chart-line" size={16} color={colors.primary} />
            {/* CORREGIDO: Muestra Dificultad en vez de repetir tiempo */}
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.dificultad || 'Media'}</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Icon name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#FF4757' : colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="comment-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.comentarios}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Icon name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Pantalla Principal ---
export const HomeScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { unreadCount } = useNotificationCount();
  const { isAdmin } = useAppContext();
  const PAGE_SIZE = 10;

  const [categoria, setCategoria] = useState('Todas');
  const [posts, setPosts] = useState([]);
  const [postsFiltrados, setPostsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [catList, setCatList] = useState(categorias);
  const [token, setToken] = useState(null);

  useEffect(() => {
    obtenerToken();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarRecetas(token);
      if (token) {
        cargarNotificacionesPendientes(token);
      }
    }, [token])
  );

  const cargarNotificacionesPendientes = async (tk) => {
    try {
      const { data } = await apiClient.get(`/notifications`);
    } catch (error) {
      console.log('Error silenciado notificaciones:', error.message);
    }
  };

  const obtenerToken = async () => {
    try {
      const tk = await AsyncStorage.getItem('authToken');
      setToken(tk);
    } catch (error) {
      console.error('Error obteniendo token:', error);
      setToken(null);
    }
  };

  const aplicarFiltroCategoria = (items, categoriaNombre) => {
    if (!items) return [];
    if (categoriaNombre === 'Todas') return items;

    return items.filter(post => {
      const titulo = (post.titulo || '').toLowerCase();
      const terminos = {
        'Pizza': ['pizza'],
        'Mexicana': ['taco', 'burrito', 'quesadilla', 'enchilada', 'mexic'],
        'Postres': ['postre', 'pastel', 'chocolate', 'brownie', 'galleta', 'cheesecake', 'dulce'],
        'Saludable': ['bowl', 'ensalada', 'vegano', 'light', 'poke', 'fit'],
        'Asiática': ['sushi', 'ramen', 'pad thai', 'wok', 'arroz', 'chino', 'japon'],
        'Hamburguesas': ['hamburguesa', 'burger'],
        'Pasta': ['pasta', 'espagueti', 'lasaña', 'carbonara', 'pesto', 'macarron'],
        'Ensaladas': ['ensalada', 'césar', 'salad', 'lechuga']
      };

      const palabrasClave = terminos[categoriaNombre];
      return palabrasClave ? palabrasClave.some(word => titulo.includes(word)) : true;
    });
  };

  const cargarRecetas = async (tk = null, options = {}) => {
    const pageToLoad = options.page ?? 1;
    const append = options.append ?? false;
    const isRefresh = options.refresh ?? false;

    if (loading || (loadingMore && append) || (refreshing && isRefresh)) return;

    if (append) {
      setLoadingMore(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await apiClient.get(`/recetas?page=${pageToLoad}&per_page=${PAGE_SIZE}`);
      
      const recetasFormateadas = (data.data || []).map(receta => ({
        id: receta.id,
        user_id: receta.user_id,
        titulo: receta.titulo,
        descripcion: receta.descripcion,
        imagen: receta.imagen_url,
        usuarioNombre: receta.user?.name || 'Usuario',
        usuarioImagen: receta.user?.imagen_perfil,
        tiempoPreparacion: receta.tiempo_preparacion ? `${receta.tiempo_preparacion} min` : 'N/A',
        dificultad: receta.dificultad || 'Media',
        likes: receta.likes_count || 0,
        comentarios: receta.comentarios_count || 0,
        liked: receta.user_liked || false,
        saved: receta.user_saved || false,
      }));

      const lastPage = data.last_page ?? pageToLoad;
      const nextHasMore = pageToLoad < lastPage;
      setHasMore(nextHasMore);
      setPage(pageToLoad);

      if (append) {
        setPosts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const nuevos = recetasFormateadas.filter((p) => !prevIds.has(p.id));
          const merged = [...prev, ...nuevos];
          setPostsFiltrados(aplicarFiltroCategoria(merged, categoria));
          return merged;
        });
      } else {
        setPosts(recetasFormateadas);
        setPostsFiltrados(aplicarFiltroCategoria(recetasFormateadas, categoria));
      }
    } catch (error) {
      console.error('Error cargando recetas:', error);
      if(!append && !isRefresh) {
         Alert.alert('Error', 'No se pudieron cargar las recetas');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const seleccionarCategoria = (categoriaNombre) => {
    setCategoria(categoriaNombre);
    const nuevasCategorias = catList.map(cat => ({
      ...cat,
      seleccionada: cat.nombre === categoriaNombre
    }));
    setCatList(nuevasCategorias);
    setPostsFiltrados(aplicarFiltroCategoria(posts, categoriaNombre));
  };

  const cargarMas = () => {
    if (loading || loadingMore || !hasMore) return;
    cargarRecetas(token, { page: page + 1, append: true });
  };

  const refrescar = () => {
    cargarRecetas(token, { page: 1, append: false, refresh: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}> 
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.headerTitle, { color: '#D4AF37' }]}>FOOD ART</Text>
        </View>

        {/* Categorías */}
        <View>
            <FlatList
            data={catList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <CategoriaItem 
                categoria={item}
                colors={colors}
                onPress={() => seleccionarCategoria(item.nombre)}
                />
            )}
            style={styles.categoriasList}
            contentContainerStyle={styles.categoriasContainer}
            />
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

        {/* Feed */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : postsFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="silverware-fork-knife" size={64} color="#D4AF37" opacity={0.5} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No hay recetas</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {categoria !== 'Todas' ? `No hay resultados para ${categoria}` : 'Las recetas aparecerán aquí'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={postsFiltrados}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <PostItem
                post={item}
                token={token}
                navigation={navigation}
                colors={colors}
                onPress={() => navigation.navigate('DetalleReceta', { receta: item })}
              />
            )}
            style={styles.feedList}
            // AQUÍ ESTÁ EL CAMBIO CLAVE: paddingBottom grande para que no se tape con la barra flotante
            contentContainerStyle={[styles.feedContainer, { paddingBottom: 100 }]} 
            showsVerticalScrollIndicator={false}
            onEndReached={cargarMas}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={refrescar}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* --- AQUÍ ESTÁ EL CONTENEDOR FLOTANTE ABSOLUTO --- */}
      <View style={styles.bottomBarContainer}>
        {isAdmin ? (
            <AdminBottomNavBar navigation={navigation} currentRoute="Home" colors={colors} />
        ) : (
            <BottomNavBar navigation={navigation} currentRoute="Home" colors={colors} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative', // Necesario para el absoluto
  },
  contentContainer: {
    flex: 1,
  },
  // ESTILO DE LA BARRA FLOTANTE
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 10,
    zIndex: 100,
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  categoriasContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  categoriasList: {
    flexGrow: 0,
    marginBottom: 2,
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  feedList: {
    flex: 1,
  },
  categoriaItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 60, 
    height: 75,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 8,
    paddingBottom: 6,
  },
  bookmarkCutout: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    transform: [{ translateX: -10 }],
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  categoriaEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoriaNombre: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  categoriaNombreSel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  postImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
});