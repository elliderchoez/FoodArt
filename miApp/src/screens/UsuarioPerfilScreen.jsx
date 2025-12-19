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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Componente para mostrar un usuario en lista
const UsuarioListItem = ({ usuario, navigation, onPress }) => (
  <TouchableOpacity style={styles.usuarioListItem} onPress={onPress}>
    <Image source={{ uri: usuario.imagen_perfil }} style={styles.listAvatar} />
    <View style={styles.listInfo}>
      <Text style={styles.listName}>{usuario.name}</Text>
      <Text style={styles.listDescription}>{usuario.descripcion || 'Sin descripción'}</Text>
    </View>
    <Icon name="chevron-right" size={24} color="#D4AF37" />
  </TouchableOpacity>
);

export const UsuarioPerfilScreen = ({ route, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { usuarioId } = route.params;
  const [usuario, setUsuario] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [siguiendo, setSiguiendo] = useState(false);
  const [esMiPerfil, setEsMiPerfil] = useState(false);
  const [tab, setTab] = useState('recetas');
  const [mostrarListaSeguidores, setMostrarListaSeguidores] = useState(false);
  const [tipoLista, setTipoLista] = useState('seguidores');
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);

  useEffect(() => {
    const inicializar = async () => {
      try {
        const tk = await AsyncStorage.getItem('authToken');
        setToken(tk);

        if (tk) {
          const responseActual = await fetch(`${API_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${tk}`,
            },
          });
          if (responseActual.ok) {
            const userData = await responseActual.json();
            setEsMiPerfil(userData.id === usuarioId);
          }
        }

        await cargarPerfilUsuario(tk);
      } catch (error) {
        console.error('Error inicializando:', error);
      }
    };

    inicializar();
  }, [usuarioId]);

  const cargarPerfilUsuario = async (tk) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/usuarios/${usuarioId}/perfil`);

      if (!response.ok) {
        throw new Error('Usuario no encontrado');
      }

      const data = await response.json();
      setUsuario(data.user);
      setRecetas(data.recetas || []);

      if (tk) {
        const responseFollow = await fetch(`${API_URL}/usuarios/${usuarioId}/verificar-seguimiento`, {
          headers: {
            'Authorization': `Bearer ${tk}`,
          },
        });
        if (responseFollow.ok) {
          const followData = await responseFollow.json();
          setSiguiendo(followData.following);
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const cargarListaSeguidores = async (tipo) => {
    setLoadingLista(true);
    try {
      const url = tipo === 'seguidores'
        ? `${API_URL}/usuarios/${usuarioId}/seguidores`
        : `${API_URL}/usuarios/${usuarioId}/siguiendo`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setListaUsuarios(data.data || []);
        setTipoLista(tipo);
        setMostrarListaSeguidores(true);
      }
    } catch (error) {
      console.error('Error cargando lista:', error);
      Alert.alert('Error', 'No se pudo cargar la lista');
    } finally {
      setLoadingLista(false);
    }
  };

  const handleSeguir = async () => {
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión para seguir usuarios');
      return;
    }

    try {
      const url = siguiendo
        ? `${API_URL}/usuarios/${usuarioId}/dejar-de-seguir`
        : `${API_URL}/usuarios/${usuarioId}/seguir`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const nuevoEstadoSiguiendo = !siguiendo;
        setSiguiendo(nuevoEstadoSiguiendo);
        
        // Actualizar el contador inmediatamente
        setUsuario(prev => ({
          ...prev,
          total_seguidores: nuevoEstadoSiguiendo 
            ? prev.total_seguidores + 1 
            : prev.total_seguidores - 1,
        }));
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'No se pudo completar la acción');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Usuario no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const RecetaCard = ({ receta }) => (
    <TouchableOpacity
      style={styles.recetaCard}
      onPress={() => navigation.navigate('DetalleReceta', { receta })}
    >
      <Image source={{ uri: receta.imagen_url }} style={styles.recetaImage} />
      <View style={styles.recetaInfo}>
        <Text style={styles.recetaTitulo} numberOfLines={1}>{receta.titulo}</Text>
        <View style={styles.recetaMeta}>
          <View style={styles.metaItem}>
            <Icon name="heart" size={14} color="#FF4757" />
            <Text style={styles.metaText}>{receta.likes_count || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="comment" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{receta.comentarios_count || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (tab === 'recetas') {
      return recetas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="silverware-fork-knife" size={48} color="#D4AF37" />
          <Text style={styles.emptyText}>Sin recetas aún</Text>
        </View>
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RecetaCard receta={item} />}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Perfil del usuario */}
      <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
        <Image
          source={{ uri: usuario.imagen_perfil }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{usuario.name}</Text>
        <Text style={styles.userDescription}>{usuario.descripcion || ''}</Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => cargarListaSeguidores('seguidores')}
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{usuario.total_seguidores || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{usuario.total_recetas || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recetas</Text>
          </View>
        </View>

        {/* Botón de seguir - solo mostrar si no es su propio perfil */}
        {!esMiPerfil && (
          <TouchableOpacity
            style={[
              styles.seguirButton,
              siguiendo && styles.siguiendoButton,
            ]}
            onPress={handleSeguir}
          >
            <Icon
              name={siguiendo ? 'check' : 'plus'}
              size={18}
              color={siguiendo ? colors.primary : '#FFFFFF'}
            />
            <Text style={[
              styles.seguirButtonText,
              siguiendo && styles.siguiendoButtonText,
            ]}>
              {siguiendo ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'recetas' && styles.tabActive]}
          onPress={() => setTab('recetas')}
        >
          <Text style={[styles.tabText, tab === 'recetas' && styles.tabTextActive, { color: tab === 'recetas' ? colors.primary : colors.textSecondary }]}>
            Recetas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {renderContent()}
      </View>

      {/* Modal de Lista de Seguidores */}
      <Modal
        visible={mostrarListaSeguidores}
        animationType="slide"
        onRequestClose={() => setMostrarListaSeguidores(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header Modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMostrarListaSeguidores(false)}>
              <Icon name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {tipoLista === 'seguidores' ? 'Seguidores' : 'Siguiendo'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {loadingLista ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          ) : listaUsuarios.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {tipoLista === 'seguidores' ? 'Sin seguidores' : 'Sin seguidos'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={listaUsuarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <UsuarioListItem
                  usuario={item}
                  navigation={navigation}
                  onPress={() => {
                    setMostrarListaSeguidores(false);
                    navigation.push('UsuarioPerfil', { usuarioId: item.id });
                  }}
                />
              )}
              contentContainerStyle={styles.listaContainer}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  seguirButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siguiendoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  seguirButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  siguiendoButtonText: {
    color: '#D4AF37',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  recetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    marginHorizontal: 4,
    width: '48%',
  },
  recetaImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  recetaInfo: {
    padding: 8,
  },
  recetaTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  recetaMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  listaContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  usuarioListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  listDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
