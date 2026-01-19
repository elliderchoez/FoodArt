import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';
import StarRating from '../components/StarRating';

export const AdminRecetas = ({ navigation }) => {
  const { colors } = useTheme();
  const [recetas, setRecetas] = useState([]);
  const [totalRecetas, setTotalRecetas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredRecetas, setFilteredRecetas] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('todas'); // 'todas', 'bloqueadas'
  const [hasMore, setHasMore] = useState(true);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  useEffect(() => {
    loadRecetas();
  }, [page, filterType]);

  useEffect(() => {
    filterRecetas();
  }, [search, recetas, filterType]);

  const sortedRecetas = useMemo(() => {
    const list = Array.isArray(filteredRecetas) ? [...filteredRecetas] : [];
    const dir = sortDirection === 'asc' ? 1 : -1;

    const asString = (value) => (value ?? '').toString().toLowerCase();
    const asDate = (value) => {
      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    };
    const asNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    list.sort((a, b) => {
      if (sortKey === 'titulo') {
        return asString(a?.titulo).localeCompare(asString(b?.titulo)) * dir;
      }

      if (sortKey === 'autor') {
        return asString(a?.user?.name).localeCompare(asString(b?.user?.name)) * dir;
      }

      if (sortKey === 'likes') {
        const diff = asNumber(a?.likes_count) - asNumber(b?.likes_count);
        if (diff !== 0) return diff * dir;
        return asString(a?.titulo).localeCompare(asString(b?.titulo)) * dir;
      }

      if (sortKey === 'comentarios') {
        const diff = asNumber(a?.comentarios_count) - asNumber(b?.comentarios_count);
        if (diff !== 0) return diff * dir;
        return asString(a?.titulo).localeCompare(asString(b?.titulo)) * dir;
      }

      // created_at (default)
      return (asDate(a?.created_at) - asDate(b?.created_at)) * dir;
    });

    return list;
  }, [filteredRecetas, sortKey, sortDirection]);

  const sortKeyLabel = useMemo(() => {
    switch (sortKey) {
      case 'titulo':
        return 'Título';
      case 'autor':
        return 'Autor';
      case 'likes':
        return 'Más likes';
      case 'comentarios':
        return 'Más comentarios';
      case 'created_at':
      default:
        return 'Tiempo';
    }
  }, [sortKey]);

  const cycleSortKey = useCallback(() => {
    setSortKey((prev) => {
      if (prev === 'created_at') return 'titulo';
      if (prev === 'titulo') return 'autor';
      if (prev === 'autor') return 'likes';
      if (prev === 'likes') return 'comentarios';
      return 'created_at';
    });
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const refreshRecetas = async () => {
    try {
      const blocked = filterType === 'bloqueadas' ? true : (filterType === 'todas' ? false : null);
      const response = await AdminService.getRecetas(1, '', blocked);
      const recetasData = response.data || response;
      const items = Array.isArray(recetasData) ? recetasData : recetasData.data || [];

      setTotalRecetas(typeof recetasData?.total === 'number' ? recetasData.total : null);
      
      // Recargar la lista completa del servidor para sincronizar cambios de bloqueo
      setRecetas(items);
      setHasMore(items.length > 0);
    } catch (error) {
      console.error('Error refrescando recetas:', error);
    }
  };

  const loadRecetas = async () => {
    try {
      setLoading(true);
      const blocked = filterType === 'bloqueadas' ? true : (filterType === 'todas' ? false : null);
      const response = await AdminService.getRecetas(page, search, blocked);
      const recetasData = response.data || response;
      const items = Array.isArray(recetasData) ? recetasData : recetasData.data || [];

      setTotalRecetas(typeof recetasData?.total === 'number' ? recetasData.total : null);
      
      if (page === 1) {
        setRecetas(items);
      } else {
        setRecetas([...recetas, ...items]);
      }
      
      // Detectar si hay más páginas
      setHasMore(items.length > 0);
    } catch (error) {
      console.error('Error cargando recetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas');
    } finally {
      setLoading(false);
    }
  };

  const filterRecetas = () => {
    let filtered = recetas;
    
    // Filtrar por tipo de receta (bloqueadas o no)
    if (filterType === 'bloqueadas') {
      filtered = filtered.filter(r => r.is_blocked);
    } else {
      filtered = filtered.filter(r => !r.is_blocked);
    }
    
    // Filtrar por búsqueda
    if (!search.trim()) {
      setFilteredRecetas(filtered);
      return;
    }
    
    const filtered2 = filtered.filter(
      receta =>
        receta.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        receta.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        receta.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredRecetas(filtered2);
  };

  const handleDeleteReceta = async (recetaId) => {
    Alert.alert('Eliminar Receta', '¿Estás seguro de que deseas eliminar esta receta?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Eliminar',
        onPress: async () => {
          try {
            setDeleting(true);
            await AdminService.deleteReceta(recetaId);
            setRecetas(recetas.filter(r => r.id !== recetaId));
            Alert.alert('Éxito', 'Receta eliminada correctamente');
          } catch (error) {
            console.error('Error eliminando receta:', error);
            Alert.alert('Error', 'No se pudo eliminar la receta');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleToggleBloqueReceta = async (recetaId, currentBlocked) => {
    const action = currentBlocked ? 'desbloquear' : 'bloquear';
    const message = currentBlocked 
      ? '¿Desbloquear esta receta?' 
      : '¿Bloquear esta receta?';
    
    Alert.alert('Confirmar', message, [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: action.charAt(0).toUpperCase() + action.slice(1),
        onPress: async () => {
          try {
            setBlocking(true);
            await AdminService.toggleBlockReceta(recetaId, !currentBlocked);
            
            // Actualizar recetas localmente
            const recetasActualizadas = recetas.map(receta =>
              receta.id === recetaId 
                ? { ...receta, is_blocked: !currentBlocked }
                : receta
            );
            setRecetas(recetasActualizadas);
            
            const mensaje = currentBlocked ? 'Receta desbloqueada' : 'Receta bloqueada';
            Alert.alert('Éxito', mensaje);
          } catch (error) {
            console.error('Error bloqueando receta:', error);
            Alert.alert('Error', 'No se pudo cambiar el estado de la receta');
          } finally {
            setBlocking(false);
          }
        },
      },
    ]);
  };

  const renderRecetaItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        navigation.navigate('DetalleReceta', {
          receta: item,
          isAdmin: true,
        });
      }}
    >
      {(item.imagen || item.imagen_url) && (
        <Image
          source={{ uri: item.imagen || item.imagen_url }}
          style={styles.cardImage}
        />
      )}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Por: {item.user?.name || 'Desconocido'}
        </Text>
       
      </View>
    </TouchableOpacity>
  );

  if (loading && page === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Recetas</Text>
        <TouchableOpacity onPress={refreshRecetas}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: filterType === 'todas' ? colors.primary : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            setFilterType('todas');
            setPage(1);
            setSearch('');
          }}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filterType === 'todas' ? '#fff' : colors.text },
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: filterType === 'bloqueadas' ? colors.primary : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            setFilterType('bloqueadas');
            setPage(1);
            setSearch('');
          }}
        >
          <Icon
            name="lock"
            size={16}
            color={filterType === 'bloqueadas' ? '#fff' : colors.text}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: filterType === 'bloqueadas' ? '#fff' : colors.text },
            ]}
          >
            Bloqueadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por título o autor..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {typeof totalRecetas === 'number'
            ? `Total: ${totalRecetas} • Mostrando: ${sortedRecetas.length}`
            : `Mostrando: ${sortedRecetas.length}`}
        </Text>
        <View style={styles.sortControls}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={cycleSortKey}
            activeOpacity={0.85}
          >
            <Icon name="filter-variant" size={18} color={colors.text} />
            <Text style={[styles.sortButtonText, { color: colors.text }]} numberOfLines={1}>
              {sortKeyLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={toggleSortDirection}
            activeOpacity={0.85}
          >
            <Icon
              name={sortDirection === 'asc' ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recetas List */}
      {sortedRecetas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chef-hat" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay recetas disponibles
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedRecetas}
          renderItem={renderRecetaItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          onEndReached={() => {
            if (hasMore && !loading) {
              setPage(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 190,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  directionButton: {
    width: 40,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  statsContainer: {
    marginHorizontal: 12,
    marginVertical: 12,
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
