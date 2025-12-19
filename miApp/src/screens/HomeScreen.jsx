import React, { useState, useEffect } from 'react';
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
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';

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

// Componente de Categoría
const CategoriaItem = ({ categoria, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.categoriaItem,
      categoria.seleccionada && styles.categoriaSel,
      { backgroundColor: categoria.seleccionada ? colors.primary : colors.surface, borderColor: colors.border }
    ]}
    onPress={onPress}
  >
    <Text style={styles.categoriaEmoji}>{categoria.emoji}</Text>
    <Text style={[
      styles.categoriaNombre,
      categoria.seleccionada && styles.categoriaNombreSel,
      { color: categoria.seleccionada ? '#FFFFFF' : colors.text }
    ]}>
      {categoria.nombre}
    </Text>
  </TouchableOpacity>
);

// Componente de Post/Receta
const PostItem = ({ post, onPress, token, navigation, colors }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    try {
      const nuevoEstado = !liked;
      setLiked(nuevoEstado);
      setLikesCount(nuevoEstado ? likesCount + 1 : Math.max(0, likesCount - 1));

      const response = await fetch(`${API_URL}/recetas/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setLiked(!nuevoEstado);
        setLikesCount(!nuevoEstado ? likesCount + 1 : Math.max(0, likesCount - 1));
        Alert.alert('Error', 'No se pudo dar like');
      }
    } catch (error) {
      console.error('Error dando like:', error);
      setLiked(!liked);
      setLikesCount(!liked ? likesCount + 1 : Math.max(0, likesCount - 1));
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    try {
      const nuevoEstado = !saved;
      setSaved(nuevoEstado);

      const response = await fetch(`${API_URL}/recetas/${post.id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setSaved(!nuevoEstado);
        Alert.alert('Error', 'No se pudo guardar la receta');
      }
    } catch (error) {
      console.error('Error guardando:', error);
      setSaved(!saved);
    }
  };

  return (
    <TouchableOpacity style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={onPress}>
      <Image source={{ uri: post.imagen }} style={styles.postImage} />
      
      <View style={[styles.postContent, { backgroundColor: colors.cardBackground }]}>
        {/* Usuario */}
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => navigation.navigate('UsuarioPerfil', { usuarioId: post.user_id })}
        >
          <Image source={{ uri: post.usuarioImagen }} style={styles.userAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{post.usuarioNombre}</Text>
            <Text style={[styles.postTime, { color: colors.textSecondary }]}>Hace 2 horas</Text>
          </View>
        </TouchableOpacity>

        {/* Título y descripción */}
        <Text style={[styles.postTitle, { color: colors.text }]}>{post.titulo}</Text>
        <Text style={[styles.postDescription, { color: colors.textSecondary }]}>{post.descripcion}</Text>

        {/* Información de la receta */}
        <View style={styles.recipeInfo}>
          <View style={styles.infoItem}>
            <Icon name="clock-outline" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.tiempoPreparacion}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="chart-line" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.tiempoPreparacion}</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Icon name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#FF4757' : colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="comment-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.comentarios}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Icon name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [categoria, setCategoria] = useState('Todas');
  const [posts, setPosts] = useState([]);
  const [postsFiltrados, setPostsFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catList, setCatList] = useState(categorias);
  const [token, setToken] = useState(null);

  useEffect(() => {
    obtenerToken();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        cargarRecetas(token);
      }
      return () => {};
    }, [token])
  );

  const obtenerToken = async () => {
    try {
      const tk = await AsyncStorage.getItem('authToken');
      setToken(tk);
      cargarRecetas(tk);
    } catch (error) {
      console.error('Error obteniendo token:', error);
      cargarRecetas(null);
    }
  };

  const cargarRecetas = async (tk = null) => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (tk) {
        headers['Authorization'] = `Bearer ${tk}`;
      }

      const response = await fetch(`${API_URL}/recetas`, { headers });
      
      if (!response.ok) {
        throw new Error('Error al cargar recetas');
      }

      const data = await response.json();
      
      // Transformar datos de la API al formato esperado por el componente
      const recetasFormateadas = data.data.map(receta => ({
        id: receta.id,
        user_id: receta.user_id,
        titulo: receta.titulo,
        descripcion: receta.descripcion,
        imagen: receta.imagen_url,
        usuarioNombre: receta.user?.name || 'Usuario',
        usuarioImagen: receta.user?.imagen_perfil || 'https://via.placeholder.com/40',
        tiempoPreparacion: `${receta.tiempo_preparacion} min`,
        dificultad: receta.dificultad,
        likes: receta.likes_count || 0,
        comentarios: receta.comentarios_count || 0,
        liked: receta.user_liked || false,
        saved: receta.user_saved || false,
      }));

      setPosts(recetasFormateadas);
      setPostsFiltrados(recetasFormateadas);
      console.log('Recetas cargadas:', recetasFormateadas);
    } catch (error) {
      console.error('Error cargando recetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCategoria = (categoriaNombre) => {
    setCategoria(categoriaNombre);
    
    const nuevasCategorias = catList.map(cat => ({
      ...cat,
      seleccionada: cat.nombre === categoriaNombre
    }));
    setCatList(nuevasCategorias);

    if (categoriaNombre === 'Todas') {
      setPostsFiltrados(posts);
    } else {
      const filtrados = posts.filter(post => {
        const titulo = post.titulo.toLowerCase();
        
        switch (categoriaNombre) {
          case 'Pizza':
            return titulo.includes('pizza');
          case 'Mexicana':
            return ['taco', 'burrito', 'quesadilla', 'enchilada'].some(word => titulo.includes(word));
          case 'Postres':
            return ['postre', 'pastel', 'chocolate', 'brownie', 'galleta', 'cheesecake'].some(word => titulo.includes(word));
          case 'Saludable':
            return ['bowl', 'ensalada', 'vegano', 'light', 'poke'].some(word => titulo.includes(word));
          case 'Asiática':
            return ['sushi', 'ramen', 'pad thai', 'wok'].some(word => titulo.includes(word));
          case 'Hamburguesas':
            return ['hamburguesa', 'burger'].some(word => titulo.includes(word));
          case 'Pasta':
            return ['pasta', 'espagueti', 'lasaña', 'carbonara', 'pesto'].some(word => titulo.includes(word));
          case 'Ensaladas':
            return ['ensalada', 'césar', 'salad'].some(word => titulo.includes(word));
          default:
            return true;
        }
      });
      setPostsFiltrados(filtrados);
    }
  };

  const irA = (pantalla) => {
    navigation.navigate(pantalla);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>FOOD ART</Text>
      </View>

      {/* Categorías */}
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
        contentContainerStyle={styles.categoriasContainer}
      />

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : postsFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="silverware-fork-knife" size={64} color="#D4AF37" />
          <Text style={styles.emptyText}>No hay recetas aún</Text>
          <Text style={styles.emptySubtext}>Las recetas aparecerán aquí</Text>
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
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Home')}>
          <Icon name="home" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Buscar')}>
          <Icon name="magnify" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('CrearReceta')}>
          <Icon name="plus-circle" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Alertas')}>
          <Icon name="bell-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Perfil')}>
          <Icon name="account-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#D4AF37',
    letterSpacing: 1.5,
  },
  categoriasContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  categoriaItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  categoriaSel: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categoriaEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  categoriaNombre: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  categoriaNombreSel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  postContent: {
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    elevation: 0,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
