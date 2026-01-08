import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Componente para mostrar un usuario en lista
const UsuarioListItem = ({ usuario, navigation, onPress, colors }) => (
  <TouchableOpacity style={[styles.usuarioListItem, { borderBottomColor: colors?.border }]} onPress={onPress}>
    <Image source={{ uri: usuario.imagen_perfil }} style={styles.listAvatar} />
    <View style={styles.listInfo}>
      <Text style={[styles.listName, { color: colors?.text }]}>{usuario.name}</Text>
      <Text style={[styles.listDescription, { color: colors?.textSecondary }]}>{usuario.descripcion || 'Sin descripción'}</Text>
    </View>
    <Icon name="chevron-right" size={24} color={colors?.primary || "#D4AF37"} />
  </TouchableOpacity>
);

// Componente de Receta en Grid
const RecetaGridItem = ({ receta, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress}>
    {receta.imagen_url ? (
      <Image
        source={{ uri: receta.imagen_url }}
        style={styles.gridImage}
      />
    ) : (
      <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
        <Icon name="image-off" size={40} color="#D1D5DB" />
      </View>
    )}
    <View style={styles.gridOverlay}>
      <Text style={styles.gridTitle} numberOfLines={2}>{receta.titulo}</Text>
    </View>
  </TouchableOpacity>
);

export const PerfilScreen = ({ navigation }) => {
  const { logout } = useAppContext();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [usuario, setUsuario] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [recetasGuardadas, setRecetasGuardadas] = useState([]);
  const [recetasConLike, setRecetasConLike] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingMisRecetas, setLoadingMisRecetas] = useState(false);
  const [loadingGuardadas, setLoadingGuardadas] = useState(false);
  const [loadingConLike, setLoadingConLike] = useState(false);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [tabActiva, setTabActiva] = useState(0);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [seguidores, setSeguidores] = useState(0);
  const [seguidos, setSeguidos] = useState(0);
  const [token, setToken] = useState(null);
  const [mostrarListaSeguidores, setMostrarListaSeguidores] = useState(false);
  const [tipoLista, setTipoLista] = useState('seguidores');
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      cargarPerfilUsuario(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const cargarPerfilUsuario = async (isCancelled = () => false) => {
    setLoading(true);
    setLoadingStats(true);
    setLoadingMisRecetas(true);
    setLoadingGuardadas(true);
    setLoadingConLike(true);
    try {
      // Obtener datos del usuario
      const datosUsuario = await apiClient.get('/user');
      if (!isCancelled()) {
        setUsuario(datosUsuario.data);
        setNewDescription(datosUsuario.data.descripcion || '');
        setLoading(false);
      }

      // Cargar stats y listas en paralelo (sin bloquear pantalla)
      const userId = datosUsuario.data.id;

      (async () => {
        try {
          const [resSeguidores, resSeguidos] = await Promise.allSettled([
            apiClient.get(`/usuarios/${userId}/seguidores`),
            apiClient.get(`/usuarios/${userId}/siguiendo`),
          ]);

          if (resSeguidores.status === 'fulfilled') {
            const datos = resSeguidores.value.data;
            if (!isCancelled()) setSeguidores(datos.total || 0);
          }

          if (resSeguidos.status === 'fulfilled') {
            const datos = resSeguidos.value.data;
            if (!isCancelled()) setSeguidos(datos.total || 0);
          }
        } catch (e) {
          // silencioso: no bloquea el perfil
        } finally {
          if (!isCancelled()) setLoadingStats(false);
        }
      })();

      (async () => {
        try {
          const datosRecetas = await apiClient.get('/user/recetas');
          if (!isCancelled()) setRecetas(datosRecetas.data.data || datosRecetas.data || []);
        } catch (e) {
          // silencioso
        } finally {
          if (!isCancelled()) setLoadingMisRecetas(false);
        }
      })();

      (async () => {
        try {
          const datos = await apiClient.get('/user/recetas-guardadas');
          if (!isCancelled()) setRecetasGuardadas(datos.data.data || datos.data || []);
        } catch (e) {
          // silencioso
        } finally {
          if (!isCancelled()) setLoadingGuardadas(false);
        }
      })();

      (async () => {
        try {
          const datos = await apiClient.get('/user/recetas-con-like');
          if (!isCancelled()) setRecetasConLike(datos.data.data || datos.data || []);
        } catch (e) {
          // silencioso
        } finally {
          if (!isCancelled()) setLoadingConLike(false);
        }
      })();
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'Error al cargar el perfil');
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const cerrarSesion = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Error al cerrar sesión');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const guardarDescripcion = async () => {
    if (!usuario) return;

    try {
      await apiClient.put('/user/update-description', {
        descripcion: newDescription,
      });

      setUsuario({ ...usuario, descripcion: newDescription });
      setEditingDescription(false);
      Alert.alert('Éxito', 'Descripción actualizada');
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar la descripción');
    }
  };

  const irA = (pantalla) => {
    navigation.navigate(pantalla);
  };

  const cargarListaSeguidores = async (tipo) => {
    setLoadingLista(true);
    try {
      if (!usuario) return;

      const { data } = await apiClient.get(`/usuarios/${usuario.id}/${tipo === 'seguidores' ? 'seguidores' : 'siguiendo'}`);
      setListaUsuarios(data.data || []);
      setTipoLista(tipo);
      setMostrarListaSeguidores(true);
    } catch (error) {
      console.error('Error cargando lista:', error);
      Alert.alert('Error', 'No se pudo cargar la lista');
    } finally {
      setLoadingLista(false);
    }
  };

  const mostrarRecetas = () => {
    switch (tabActiva) {
      case 0:
        return recetas;
      case 1:
        return recetasGuardadas;
      case 2:
        return recetasConLike;
      default:
        return [];
    }
  };

  const obtenerMensajeVacio = () => {
    switch (tabActiva) {
      case 0:
        return {
          titulo: 'Aún no hay recetas',
          subtitulo: 'Comparte tu primera receta con el mundo',
          icono: 'image-off',
        };
      case 1:
        return {
          titulo: 'No has guardado recetas',
          subtitulo: 'Guarda tus recetas favoritas para verlas después',
          icono: 'bookmark-outline',
        };
      case 2:
        return {
          titulo: 'No has dado like a nada',
          subtitulo: 'Da like a las recetas que te gusten',
          icono: 'heart-outline',
        };
      default:
        return {};
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
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error al cargar el perfil</Text>
        </View>
      </SafeAreaView>
    );
  }

  const recetasActuales = mostrarRecetas();
  const mensajeVacio = obtenerMensajeVacio();
  const loadingTab = tabActiva === 0 ? loadingMisRecetas : tabActiva === 1 ? loadingGuardadas : loadingConLike;

  // Estilos dinámicos basados en tema
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    scrollView: { backgroundColor: colors.background },
    headerSection: { backgroundColor: colors.background },
    infoSection: { backgroundColor: colors.background },
    userName: { color: colors.text },
    description: { color: colors.textSecondary },
    emptyTitle: { color: colors.text },
    emptySubtitle: { color: colors.textSecondary },
    tabText: { color: colors.textSecondary },
    tabTextActiva: { color: colors.primary },
    statNumber: { color: colors.text },
    statLabel: { color: colors.textSecondary },
    listName: { color: colors.text },
    listDescription: { color: colors.textSecondary },
    modalContainer: { backgroundColor: colors.background },
    modalHeader: { borderBottomColor: colors.border, backgroundColor: colors.background },
    modalTitle: { color: colors.text },
    usuarioListItem: { borderBottomColor: colors.border },
    divider: { backgroundColor: colors.border },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={[styles.scrollView, dynamicStyles.scrollView]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Perfil</Text>
          <TouchableOpacity
            style={[styles.topBarButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setMostrarMenuPerfil(true)}
          >
            <Icon name="dots-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Header con foto y stats */}
        <View style={[styles.headerSection, dynamicStyles.headerSection]}>
          <View style={styles.profileHeaderRow}>
            {/* Foto de perfil */}
            <View style={styles.profileImageContainer}>
              {usuario.imagen_perfil ? (
                <View style={styles.profileImageWrapper}>
                  <Image
                    source={{ uri: usuario.imagen_perfil }}
                    style={styles.profileImage}
                    onLoadStart={() => setProfileImageLoading(true)}
                    onLoadEnd={() => setProfileImageLoading(false)}
                    onError={() => setProfileImageLoading(false)}
                  />
                  {profileImageLoading && (
                    <View style={[styles.profileImageLoadingOverlay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Icon name="account-circle" size={90} color="#D1D5DB" />
                </View>
              )}
            </View>

            {/* Estadísticas */}
            <View style={styles.statsContainer}>
              {/* Recetas */}
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{recetas.length}</Text>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Recetas</Text>
              </View>

              {/* Seguidores */}
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => cargarListaSeguidores('seguidores')}
              >
                <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{loadingStats ? '—' : seguidores}</Text>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Seguidores</Text>
              </TouchableOpacity>

              {/* Seguidos */}
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => cargarListaSeguidores('siguiendo')}
              >
                <Text style={[styles.statNumber, dynamicStyles.statNumber]}>{loadingStats ? '—' : seguidos}</Text>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Seguidos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nombre */}
        <View style={[styles.infoSection, dynamicStyles.infoSection]}>
          <Text style={[styles.userName, dynamicStyles.userName]}>{usuario.name}</Text>

          {/* Descripción editable */}
          <View style={styles.descriptionContainer}>
            {editingDescription ? (
              <View style={styles.editDescriptionBox}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Añade una descripción..."
                  placeholderTextColor="#9CA3AF"
                  value={newDescription}
                  onChangeText={setNewDescription}
                  multiline
                  maxLength={150}
                />
                <View style={styles.editDescriptionButtons}>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => {
                      setEditingDescription(false);
                      setNewDescription(usuario.descripcion || '');
                    }}
                  >
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={guardarDescripcion}
                  >
                    <Text style={styles.btnSaveText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setEditingDescription(true)}
              >
                <Text style={[styles.description, dynamicStyles.description]}>
                  {usuario.descripcion || 'Sin descripción. Toca para agregar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Línea divisora */}
        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Mis recetas', 'Guardadas', 'Con like'].map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                tabActiva === index && styles.tabActiva,
              ]}
              onPress={() => setTabActiva(index)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tabActiva === index ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid de recetas o mensaje vacío */}
        {loadingTab ? (
          <View style={styles.loadingTabContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : recetasActuales.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name={mensajeVacio.icono} size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>{mensajeVacio.titulo}</Text>
            <Text style={[styles.emptySubtitle, dynamicStyles.emptySubtitle]}>{mensajeVacio.subtitulo}</Text>
            {tabActiva === 0 && (
              <TouchableOpacity
                style={styles.btnCrearReceta}
                onPress={() => irA('CrearReceta')}
              >
                <Icon name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.btnCrearRecetaText}>Crear receta</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            <FlatList
              data={recetasActuales}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <RecetaGridItem
                  receta={item}
                  onPress={() => navigation.navigate('DetalleReceta', { receta: item })}
                />
              )}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridWrapper}
            />
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Menú desplegable de perfil */}
      <Modal
        visible={mostrarMenuPerfil}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarMenuPerfil(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMostrarMenuPerfil(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[styles.menuSheet, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <Text style={[styles.menuTitle, { color: colors.text }]}>Opciones</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMostrarMenuPerfil(false);
                navigation.navigate('EditarPerfil', { usuario });
              }}
            >
              <Icon name="account-edit-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Editar perfil</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.menuItem}>
              <Icon
                name={isDarkMode ? 'moon-waning-crescent' : 'white-balance-sunny'}
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Temas</Text>
                <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
                  {isDarkMode ? 'Tema oscuro' : 'Tema claro'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? colors.primary : '#FFFFFF'}
              />
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMostrarMenuPerfil(false);
                cerrarSesion();
              }}
            >
              <Icon name="logout" size={22} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal para Seguidores/Siguiendo */}
      <Modal visible={mostrarListaSeguidores} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header Modal */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setMostrarListaSeguidores(false)}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {tipoLista === 'seguidores' ? 'Seguidores' : 'Siguiendo'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Contenido Modal */}
          {loadingLista ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : listaUsuarios.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="account-multiple-outline" size={64} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {tipoLista === 'seguidores' ? 'Sin seguidores' : 'No sigues a nadie'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {tipoLista === 'seguidores'
                  ? 'Aún no tienes seguidores'
                  : 'Aún no sigues a nadie'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={listaUsuarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <UsuarioListItem
                  usuario={item}
                  colors={colors}
                  onPress={() => {
                    setMostrarListaSeguidores(false);
                    navigation.push('UsuarioPerfil', { usuarioId: item.id });
                  }}
                />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Home')}>
          <Icon name="home" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Buscar')}>
          <Icon name="magnify" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('CrearReceta')}>
          <Icon name="plus-circle" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Alertas')}>
          <Icon name="bell-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => irA('Perfil')}>
          <Icon name="account-circle-outline" size={24} color="#D4AF37" />
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
  scrollView: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  topBarButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  menuSheet: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTabContainer: {
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  profileImageContainer: {
    width: 90,
    height: 90,
  },
  profileImageWrapper: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileImageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  editDescriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    padding: 0,
    textAlignVertical: 'top',
  },
  editDescriptionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  btnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  themeToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  btnEditarPerfil: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnEditarPerfilText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnCerrarSesion: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnCerrarSesionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActiva: {
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActiva: {
    color: '#D4AF37',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  btnCrearReceta: {
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnCrearRecetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gridContainer: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  gridWrapper: {
    gap: 8,
  },
  gridItem: {
    flex: 1,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  usuarioListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
});
