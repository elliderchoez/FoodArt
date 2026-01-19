import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  CheckBox,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { BottomNavBar } from '../components/BottomNavBar';

const ItemLista = ({ item, lista, onToggle, onDelete, colors }) => (
  <View style={[styles.itemContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
    <TouchableOpacity
      style={styles.checkbox}
      onPress={() => onToggle(item.id)}
    >
      <MaterialCommunityIcons
        name={item.comprado ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={24}
        color={item.comprado ? colors.primary : colors.textSecondary}
      />
    </TouchableOpacity>

    <View style={[styles.itemInfo, item.comprado && styles.itemComprado]}>
      <Text
        style={[
          styles.itemNombre,
          { color: colors.text },
          item.comprado && { textDecorationLine: 'line-through', color: colors.textSecondary },
        ]}
      >
        {item.ingrediente}
      </Text>
      <View style={styles.itemDetalles}>
        <Text style={[styles.itemCantidad, { color: colors.textSecondary }]}>
          {item.cantidad} {item.unidad}
        </Text>
        {item.precio_estimado && (
          <Text style={[styles.itemPrecio, { color: colors.textSecondary }]}>
            ${item.precio_estimado.toFixed(2)}
          </Text>
        )}
      </View>
    </View>

    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(item.id)}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4757" />
    </TouchableOpacity>
  </View>
);

const ListaItem = ({ lista, onPress, onDelete, colors }) => (
  <TouchableOpacity
    style={[styles.listaItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
    onPress={onPress}
  >
    <View style={styles.listaInfo}>
      <Text style={[styles.listaTitulo, { color: colors.text }]}>{lista.nombre}</Text>
      <View style={styles.listaStats}>
        <View style={styles.statItem}>
            <MaterialCommunityIcons name="cart-outline" size={16} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {lista.items?.length || 0} items
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="progress-check" size={16} color="#4caf50" />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {lista.progreso || 0}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="currency-usd" size={16} color="#D4AF37" />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            ${lista.total_estimado?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${lista.progreso || 0}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(lista.id)}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4757" />
    </TouchableOpacity>
  </TouchableOpacity>
);

export const ListadoComprasScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [listas, setListas] = useState([]);
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarAgregarItem, setMostrarAgregarItem] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ingrediente, setIngrediente] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [unidad, setUnidad] = useState('unidad');
  const [precio, setPrecio] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarListas();
      const interval = setInterval(cargarListas, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const cargarListas = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/shopping-lists');
      setListas(data.data || []);
    } catch (error) {
      console.error('Error cargando listas:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearLista = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la lista');
      return;
    }

    try {
      await apiClient.post('/shopping-lists', {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
      });
      
      setNombre('');
      setDescripcion('');
      setMostrarCrear(false);
      await cargarListas();
      Alert.alert('Éxito', 'Lista creada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la lista');
    }
  };

  const agregarItemALista = async () => {
    if (!ingrediente.trim() || !cantidad.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    try {
      await apiClient.post(`/shopping-lists/${listaSeleccionada.id}/items`, {
        ingrediente: ingrediente.trim(),
        cantidad: parseFloat(cantidad),
        unidad: unidad,
        precio_estimado: precio ? parseFloat(precio) : null,
      });

      setIngrediente('');
      setCantidad('1');
      setUnidad('unidad');
      setPrecio('');
      setMostrarAgregarItem(false);
      await cargarListas();
      Alert.alert('Éxito', 'Item agregado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el item');
    }
  };

  const toggleItem = async (itemId) => {
    try {
      const item = listaSeleccionada.items.find(i => i.id === itemId);
      if (item.comprado) {
        await apiClient.post(`/shopping-lists/${listaSeleccionada.id}/items/${itemId}/desmarcar`);
      } else {
        await apiClient.post(`/shopping-lists/${listaSeleccionada.id}/items/${itemId}/marcar-comprado`);
      }
      await cargarListas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el item');
    }
  };

  const eliminarLista = async (listaId) => {
    Alert.alert(
      'Eliminar Lista',
      '¿Estás seguro?',
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await apiClient.delete(`/shopping-lists/${listaId}`);
              setListaSeleccionada(null);
              await cargarListas();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const eliminarItem = async (itemId) => {
    try {
      await apiClient.delete(`/shopping-lists/${listaSeleccionada.id}/items/${itemId}`);
      await cargarListas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el item');
    }
  };

  if (loading && listas.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Listas de Compras</Text>
        <TouchableOpacity
          style={[styles.crearBtn, { backgroundColor: colors.primary }]}
          onPress={() => setMostrarCrear(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {listaSeleccionada ? (
          <View style={styles.detallesContainer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setListaSeleccionada(null)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.detallesHeader}>
              <Text style={[styles.detallesTitulo, { color: colors.text }]}>
                {listaSeleccionada.nombre}
              </Text>
              <TouchableOpacity
                style={[styles.agregarBtn, { backgroundColor: colors.primary }]}
                onPress={() => setMostrarAgregarItem(true)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {listaSeleccionada.items && listaSeleccionada.items.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={listaSeleccionada.items}
                renderItem={({ item }) => (
                  <ItemLista
                    item={item}
                    lista={listaSeleccionada}
                    onToggle={toggleItem}
                    onDelete={eliminarItem}
                    colors={colors}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.itemsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No hay items aún
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listasContainer}>
            {listas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="cart" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No hay listas
                </Text>
              </View>
            ) : (
              listas.map((lista) => (
                <ListaItem
                  key={lista.id}
                  lista={lista}
                  onPress={() => setListaSeleccionada(lista)}
                  onDelete={eliminarLista}
                  colors={colors}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Crear Lista */}
      <Modal visible={mostrarCrear} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva Lista</Text>
              <TouchableOpacity onPress={() => setMostrarCrear(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nombre"
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setMostrarCrear(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={crearLista}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Item */}
      <Modal visible={mostrarAgregarItem} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Agregar Item</Text>
              <TouchableOpacity onPress={() => setMostrarAgregarItem(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Ingrediente"
              placeholderTextColor={colors.textSecondary}
              value={ingrediente}
              onChangeText={setIngrediente}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
                placeholder="Cantidad"
                placeholderTextColor={colors.textSecondary}
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
                placeholder="Unidad"
                placeholderTextColor={colors.textSecondary}
                value={unidad}
                onChangeText={setUnidad}
              />
            </View>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Precio estimado (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setMostrarAgregarItem(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={agregarItemALista}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar />
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  crearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listasContainer: {
    padding: 16,
    gap: 12,
  },
  listaItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listaInfo: {
    flex: 1,
  },
  listaTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listaStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  deleteBtn: {
    padding: 8,
  },
  detallesContainer: {
    padding: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detallesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detallesTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  agregarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    padding: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemComprado: {
    opacity: 0.6,
  },
  itemNombre: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetalles: {
    flexDirection: 'row',
    gap: 12,
  },
  itemCantidad: {
    fontSize: 12,
  },
  itemPrecio: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnText: {
    fontWeight: 'bold',
  },
});
