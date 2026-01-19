import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';

const MensajeItem = ({ mensaje, esPropio, colors, usuarioImagen }) => (
  <View
    style={[
      styles.mensajeContainer,
      esPropio ? styles.mensajePropio : styles.mensajeOtro,
    ]}
  >
    {!esPropio && (
      <Image source={{ uri: usuarioImagen }} style={styles.mensajeAvatar} />
    )}
    <View
      style={[
        styles.mensajeBubble,
        esPropio
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.mensajeTexto,
          { color: esPropio ? '#FFFFFF' : colors.text },
        ]}
      >
        {mensaje.contenido}
      </Text>
      <Text
        style={[
          styles.mensajeHora,
          { color: esPropio ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
        ]}
      >
        {new Date(mensaje.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  </View>
);

export const ChatScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAppContext();
  const { usuarioId, usuarioNombre } = route.params;
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [usuarioData, setUsuarioData] = useState(null);
  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      cargarMensajes();
      // Polling cada 15 segundos: menos intrusivo, mejor para conversación fluida
      const interval = setInterval(cargarMensajes, 15000);
      return () => clearInterval(interval);
    }, [usuarioId])
  );

  const cargarMensajes = async () => {
    try {
      if (loading) setLoading(true);
      const { data } = await apiClient.get(`/mensajes/${usuarioId}`);
      setMensajes(data.mensajes || []);
      setUsuarioData(data.usuario);
      
      // Marcar como leídos
      await apiClient.post(`/mensajes/${usuarioId}/marcar-leidos`).catch(() => {});
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) {
      Alert.alert('Error', 'Escribe un mensaje');
      return;
    }

    try {
      setEnviando(true);
      await apiClient.post(`/mensajes/${usuarioId}/enviar`, {
        contenido: nuevoMensaje.trim(),
      });
      setNuevoMensaje('');
      await cargarMensajes();
      // Scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {usuarioData?.imagen_perfil && (
            <Image source={{ uri: usuarioData.imagen_perfil }} style={styles.headerAvatar} />
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{usuarioNombre}</Text>
            {usuarioData && (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                @{usuarioData.email}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={cargarMensajes} disabled={loading}>
          <Icon name={loading ? 'loading' : 'refresh'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Mensajes */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mensajes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message-text-outline" size={64} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No hay mensajes aún
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Sé el primero en iniciar la conversación
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <MensajeItem
              mensaje={item}
              esPropio={item.remitente_id === user?.id}
              colors={colors}
              usuarioImagen={usuarioData?.imagen_perfil || 'https://via.placeholder.com/40'}
            />
          )}
          contentContainerStyle={styles.mensajesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input de mensaje */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={[styles.inputBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textSecondary}
            value={nuevoMensaje}
            onChangeText={setNuevoMensaje}
            multiline
            maxLength={500}
            editable={!enviando}
          />
          <TouchableOpacity
            style={[
              styles.btnEnviar,
              {
                backgroundColor: colors.primary,
                opacity: enviando || !nuevoMensaje.trim() ? 0.6 : 1,
              },
            ]}
            onPress={enviarMensaje}
            disabled={enviando || !nuevoMensaje.trim()}
          >
            {enviando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  mensajesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mensajeContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  mensajePropio: {
    justifyContent: 'flex-end',
  },
  mensajeOtro: {
    justifyContent: 'flex-start',
  },
  mensajeAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  mensajeBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  mensajeTexto: {
    fontSize: 14,
    color: '#1F2937',
  },
  mensajeHora: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    padding: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  btnEnviar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
  },
});
