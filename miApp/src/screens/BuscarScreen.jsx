import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';

// Componente de Post/Receta (similar al HomeScreen)
const PostItem = ({ post, navigation, colors }) => (
  <TouchableOpacity
    style={[styles.postCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
    onPress={() => navigation?.navigate('DetalleReceta', { receta: post })}
  >
    <View style={styles.postHeader}>
      <TouchableOpacity
        onPress={() => navigation?.navigate('UsuarioPerfil', { usuarioId: post.user_id })}
      >
        <Image source={{ uri: post.usuarioImagen }} style={styles.userAvatar} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => navigation?.navigate('UsuarioPerfil', { usuarioId: post.user_id })}
        >
          <Text style={[styles.userName, { color: colors.text }]}>{post.usuarioNombre}</Text>
        </TouchableOpacity>
      </View>
    </View>
    <Text style={[styles.postTitle, { color: colors.text }]}>{post.titulo}</Text>
    <Text style={[styles.postDescription, { color: colors.textSecondary }]}>{post.descripcion}</Text>
    <View style={styles.recipeInfo}>
      <View style={styles.infoItem}>
        <Icon name="clock-outline" size={14} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.tiempoPreparacion}</Text>
      </View>
      <View style={styles.infoItem}>
        <Icon name="chart-line" size={14} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{post.dificultad}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export const BuscarScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [allRecetas, setAllRecetas] = useState([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFiltroModal, setShowFiltroModal] = useState(false);
  const [token, setToken] = useState(null);

  const normalizeText = useCallback((value) => {
    if (!value) return '';
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const stemWord = useCallback((word) => {
    const w = normalizeText(word);
    if (!w) return '';

    // Stemming muy simple para español (plural):
    // - tacos -> taco
    // - postres -> postre
    // - tomates -> tomate
    if (w.length <= 3) return w;
    if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('s') && w.length > 3) return w.slice(0, -1);
    return w;
  }, [normalizeText]);

  const tokenize = useCallback((value) => {
    const n = normalizeText(value);
    if (!n) return [];
    return n.split(/[^a-z0-9]+/g).filter(Boolean);
  }, [normalizeText]);

  const buildSearchIndex = useCallback((receta) => {
    const ingredientes = Array.isArray(receta?.ingredientes) ? receta.ingredientes : [];
    const base = [receta?.titulo, receta?.descripcion, ...ingredientes].filter(Boolean).join(' ');
    const tokens = tokenize(base).map(stemWord);
    return ` ${tokens.join(' ')} `;
  }, [stemWord, tokenize]);

  const normalizeQueryForServer = useCallback((value) => {
    const tokens = tokenize(value).map(stemWord);
    return tokens.join(' ');
  }, [stemWord, tokenize]);

  // Estado de filtros
  const [ordenamiento, setOrdenamiento] = useState('Fecha de publicación');
  const [incluye, setIncluye] = useState('');
  const [excluye, setExcluye] = useState('');
  const [tiempoMax, setTiempoMax] = useState(null);
  const [dificultad, setDificultad] = useState('Cualquiera');

  const obtenerToken = useCallback(async () => {
    try {
      const tk = await AsyncStorage.getItem('authToken');
      setToken(tk);
      return tk;
    } catch (e) {
      setToken(null);
      return null;
    }
  }, []);

  const mapRecetaApiToPost = useCallback((receta) => {
    const tiempo = receta?.tiempo_preparacion;
    const tiempoPreparacion = tiempo ? `${tiempo} min` : '—';

    return {
      id: receta.id,
      user_id: receta.user_id,
      titulo: receta.titulo,
      descripcion: receta.descripcion,
      imagen: receta.imagen_url,
      usuarioNombre: receta.user?.name || 'Usuario',
      usuarioImagen: receta.user?.imagen_perfil || 'https://via.placeholder.com/40',
      tiempoPreparacion,
      dificultad: receta.dificultad,
      ingredientes: Array.isArray(receta.ingredientes) ? receta.ingredientes : [],
      fechaCreacion: receta.created_at ? new Date(receta.created_at).getTime() : 0,
      likes: receta.likes_count || 0,
      comentarios: receta.comentarios_count || 0,
      liked: receta.user_liked || false,
      saved: receta.user_saved || false,
    };
  }, []);

  const cargarRecetasDesdeApi = useCallback(async (tk, params) => {
    const query = new URLSearchParams(params);
    const { data } = await apiClient.get(`/recetas/search?${query.toString()}`);

    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(mapRecetaApiToPost);
  }, [mapRecetaApiToPost]);

  const cargarFeedRecetas = useCallback(async (tk) => {
    const { data } = await apiClient.get(`/recetas`);

    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(mapRecetaApiToPost);
  }, [mapRecetaApiToPost]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        setLoading(true);
        try {
          const tk = await obtenerToken();
          const posts = await cargarFeedRecetas(tk);
          if (!mounted) return;
          setAllRecetas(posts);
          setRecetasFiltradas(posts);
        } catch (error) {
          console.error('Error cargando recetas:', error);
          Alert.alert('Error', error?.message || 'No se pudieron cargar las recetas');
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [obtenerToken, cargarFeedRecetas])
  );

  const filtrarRecetas = (query) => {
    setBusqueda(query);
  };

  const serverOrden = useMemo(() => {
    // Back: recent | popular
    return ordenamiento === 'Fecha de publicación' ? 'recent' : 'recent';
  }, [ordenamiento]);

  useEffect(() => {
    // Debounce para no spamear el backend mientras escribe
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const tk = token ?? (await AsyncStorage.getItem('authToken'));

        let base = [];

        const hasServerSearch = busqueda.trim().length > 0 || (dificultad && dificultad !== 'Cualquiera') || !!tiempoMax;

        if (hasServerSearch) {
          base = await cargarRecetasDesdeApi(tk, {
            q: normalizeQueryForServer(busqueda.trim()),
            dificultad: dificultad,
            tiempo_max: tiempoMax ?? '',
            orden: serverOrden,
          });
        } else {
          base = await cargarFeedRecetas(tk);
        }

        setAllRecetas(base);
        // luego aplicamos filtros locales (incluye/excluye + orden por título)
        aplicarFiltros(busqueda, base);
      } catch (e) {
        console.error('Error en búsqueda:', e);
        Alert.alert('Error', e?.message || 'No se pudo buscar');
        setAllRecetas([]);
        setRecetasFiltradas([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, incluye, excluye, tiempoMax, dificultad, ordenamiento]);

  const aplicarFiltros = (query = busqueda, source = allRecetas) => {
    let resultado = Array.isArray(source) ? [...source] : [];

    const queryTokens = tokenize(query).map(stemWord);

    // Filtro por texto (local extra: ingredientes)
    if (queryTokens.length) {
      resultado = resultado.filter((receta) => {
        const index = buildSearchIndex(receta);
        return queryTokens.every((t) => t && index.includes(` ${t} `));
      });
    }

    // Filtro ingredientes a incluir
    if (incluye.trim()) {
      const ingredientesIncluir = incluye
        .split(',')
        .map((ing) => stemWord(ing))
        .filter(Boolean);
      resultado = resultado.filter(receta => {
        const ingredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : [];
        const idx = ` ${ingredientes.flatMap((i) => tokenize(i).map(stemWord)).join(' ')} `;
        return ingredientesIncluir.every((inc) => idx.includes(` ${inc} `));
      });
    }

    // Filtro ingredientes a excluir
    if (excluye.trim()) {
      const ingredientesExcluir = excluye
        .split(',')
        .map((ing) => stemWord(ing))
        .filter(Boolean);
      resultado = resultado.filter(receta => {
        const ingredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : [];
        const idx = ` ${ingredientes.flatMap((i) => tokenize(i).map(stemWord)).join(' ')} `;
        return ingredientesExcluir.every((exc) => !idx.includes(` ${exc} `));
      });
    }

    // Filtro tiempo de preparación
    if (tiempoMax) {
      resultado = resultado.filter(receta => {
        const minutos = parseInt(receta.tiempoPreparacion || '', 10);
        if (Number.isNaN(minutos)) return true;
        return minutos <= tiempoMax;
      });
    }

    // Filtro dificultad
    if (dificultad !== 'Cualquiera') {
      const diff = stemWord(dificultad);
      resultado = resultado.filter((receta) => stemWord(receta.dificultad).includes(diff));
    }

    // Ordenamiento
    if (ordenamiento === 'Título') {
      resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (ordenamiento === 'Fecha de publicación') {
      resultado.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
    }

    setRecetasFiltradas(resultado);
  };

  const abrirFiltro = () => {
    setShowFiltroModal(true);
  };

  const aceptarFiltro = () => {
    aplicarFiltros();
    setShowFiltroModal(false);
  };

  const resetearFiltros = () => {
    setOrdenamiento('Fecha de publicación');
    setIncluye('');
    setExcluye('');
    setTiempoMax(null);
    setDificultad('Cualquiera');
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    filtrarRecetas('');
  };

  const irA = (pantalla) => {
    navigation.navigate(pantalla);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con búsqueda y filtro */}
      <View style={[styles.headerSearch, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Buscar recetas..."
            placeholderTextColor={colors.textSecondary}
            value={busqueda}
            onChangeText={filtrarRecetas}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={limpiarBusqueda}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.btnFiltro} onPress={abrirFiltro}>
          <Icon name="tune" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : recetasFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="silverware-fork-knife" size={64} color="#D4AF37" />
          <Text style={styles.emptyText}>Busca recetas deliciosas</Text>
          <Text style={styles.emptySubtext}>Escribe el nombre de una receta</Text>
        </View>
      ) : (
        <FlatList
          data={recetasFiltradas}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <PostItem post={item} navigation={navigation} colors={colors} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de Filtro */}
      <Modal
        visible={showFiltroModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFiltroModal(false)}
        onShow={() => StatusBar.setBarStyle('dark-content', true)}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar recetas</Text>
              <TouchableOpacity onPress={() => setShowFiltroModal(false)}>
                <Icon name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBodyContent}
            >
              {/* Ordenamiento */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Ordenar por:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={ordenamiento}
                    onValueChange={setOrdenamiento}
                    style={styles.picker}
                  >
                    <Picker.Item label="Fecha de publicación" value="Fecha de publicación" />
                    <Picker.Item label="Título" value="Título" />
                  </Picker>
                </View>
              </View>

              {/* Ingredientes a incluir */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Ingredientes a incluir (separados por coma):</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="ej: tomate, queso, harina"
                  placeholderTextColor="#D1D5DB"
                  value={incluye}
                  onChangeText={setIncluye}
                  multiline
                />
              </View>

              {/* Ingredientes a excluir */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Ingredientes a excluir (separados por coma):</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="ej: nueces, marisco"
                  placeholderTextColor="#D1D5DB"
                  value={excluye}
                  onChangeText={setExcluye}
                  multiline
                />
              </View>

              {/* Tiempo de preparación */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tiempo de preparación máximo:</Text>
                <View style={styles.timeButtonsContainer}>
                  {[10, 20, 30, 60].map(minutos => (
                    <TouchableOpacity
                      key={minutos}
                      style={[
                        styles.timeButton,
                        tiempoMax === minutos && styles.timeButtonActive,
                      ]}
                      onPress={() => setTiempoMax(tiempoMax === minutos ? null : minutos)}
                    >
                      <Text
                        style={[
                          styles.timeButtonText,
                          tiempoMax === minutos && styles.timeButtonTextActive,
                        ]}
                      >
                        {minutos} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dificultad */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Dificultad:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={dificultad}
                    onValueChange={setDificultad}
                    style={styles.picker}
                  >
                    <Picker.Item label="Cualquiera" value="Cualquiera" />
                    <Picker.Item label="Fácil" value="Fácil" />
                    <Picker.Item label="Media" value="Media" />
                    <Picker.Item label="Difícil" value="Difícil" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnSecondary} onPress={resetearFiltros}>
                <Text style={styles.btnSecondaryText}>Resetear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={aceptarFiltro}>
                <Text style={styles.btnPrimaryText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Home')}>
          <Icon name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Buscar')}>
          <Icon name="magnify" size={24} color={colors.primary} />
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
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    height: 45,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  btnFiltro: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
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
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 180,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 55,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
