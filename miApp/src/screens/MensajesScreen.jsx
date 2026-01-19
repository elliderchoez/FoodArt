import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { BottomNavBar } from '../components/BottomNavBar';

const ConversacionItem = ({ conversacion, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.conversacionItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
    onPress={onPress}
  >
    <Image
      source={{ uri: conversacion.usuario.imagen_perfil || 'https://via.placeholder.com/50' }}
      style={styles.avatar}
    />
    <View style={styles.conversacionContent}>
      <View style={styles.conversacionHeader}>
        <Text style={[styles.conversacionNombre, { color: colors.text }]}>
          {conversacion.usuario.name}
        </Text>
        <Text style={[styles.conversacionFecha, { color: colors.textSecondary }]}>
          {new Date(conversacion.ultimo_mensaje_fecha).toLocaleDateString('es-ES')}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.conversacionPreview,
          {
            color: conversacion.no_leidos > 0 ? colors.text : colors.textSecondary,
            fontWeight: conversacion.no_leidos > 0 ? '600' : '400',
          },
        ]}
      >
        {conversacion.ultimo_mensaje}
      </Text>
    </View>
    {conversacion.no_leidos > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{conversacion.no_leidos}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const MensajesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAppContext();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [conversacionesFiltradas, setConversacionesFiltradas] = useState([]);

  useFocusEffect(
    useCallback(() => {
      cargarConversaciones();
      // Polling cada 10 segundos: menos intrusivo
      const interval = setInterval(cargarConversaciones, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const cargarConversaciones = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/mensajes/conversaciones');
      setConversaciones(data.data || []);
      aplicarFiltro(data.data || [], busqueda);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = (lista, termino) => {
    if (!termino.trim()) {
      setConversacionesFiltradas(lista);
      return;
    }

    const filtradas = lista.filter((conv) =>
      conv.usuario.name.toLowerCase().includes(termino.toLowerCase())
    );
    setConversacionesFiltradas(filtradas);
  };

  const handleBusqueda = (texto) => {
    setBusqueda(texto);
    aplicarFiltro(conversaciones, texto);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mensajes</Text>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar conversación..."
          placeholderTextColor={colors.textSecondary}
          value={busqueda}
          onChangeText={handleBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => handleBusqueda('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de conversaciones */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversacionesFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message-outline" size={64} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No hay conversaciones</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {busqueda ? 'No coinciden con tu búsqueda' : 'Inicia una nueva conversación'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversacionesFiltradas}
          keyExtractor={(item) => item.usuario.id.toString()}
          renderItem={({ item }) => (
            <ConversacionItem
              conversacion={item}
              colors={colors}
              onPress={() => navigation.navigate('Chat', { usuarioId: item.usuario.id, usuarioNombre: item.usuario.name })}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar navigation={navigation} currentRoute="Mensajes" colors={colors} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#F3F4F6',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
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
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  conversacionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  conversacionContent: {
    flex: 1,
  },
  conversacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversacionNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  conversacionFecha: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conversacionPreview: {
    fontSize: 13,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
