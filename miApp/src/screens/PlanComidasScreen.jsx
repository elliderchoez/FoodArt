import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { BottomNavBar } from '../components/BottomNavBar';

// Componente para mostrar recetas en el plan
const RecetaEnPlan = ({ item, colors, onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[styles.recetaItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
  >
    <Text style={[styles.recetaTitulo, { color: colors.text }]} numberOfLines={2}>
      {item.receta?.titulo || 'Sin asignar'}
    </Text>
  </TouchableOpacity>
);

// Card de plan de comida
const PlanCard = ({ plan, onDelete, colors, onPress, expanded, onRecetaPress }) => (
  <View>
    <TouchableOpacity
      style={[styles.planCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planCardTitulo}>
          <Text style={[styles.planTitulo, { color: colors.text }]}>{plan.titulo}</Text>
          <View style={styles.estiloRow}>
            <MaterialCommunityIcons name="leaf" size={14} color={colors.primary} />
            <Text style={[styles.estiloText, { color: colors.textSecondary }]}>
              {plan.estilo_comida}
            </Text>
          </View>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: plan.estado === 'activo' ? '#4caf50' : '#FFA500' }]}>
          <Text style={styles.estadoText}>{plan.estado}</Text>
        </View>
      </View>

      {plan.descripcion && (
        <Text style={[styles.planDescripcion, { color: colors.textSecondary }]} numberOfLines={2}>
          {plan.descripcion}
        </Text>
      )}

      <View style={styles.planStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {new Date(plan.fecha_inicio).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {Math.min(5, plan.items?.length || 0)} recetas
          </Text>
        </View>
      </View>

      <View style={styles.planActions}>
        <TouchableOpacity
          style={[styles.accionBtn, { backgroundColor: '#FF4757' }]}
          onPress={() => onDelete(plan.id)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>

    {/* Expandir para mostrar recetas */}
    {expanded && (
      <View style={[styles.expandedContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.expandedTitle, { color: colors.text }]}>Recetas Seleccionadas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recetasScroll}>
          <View style={styles.recetasHorizontal}>
            {plan.items?.length > 0 ? (
              plan.items.slice(0, 5).map((item) => (
                <RecetaEnPlan 
                  key={item.id} 
                  item={item} 
                  colors={colors}
                  onPress={() => {
                    console.log('RecetaEnPlan presionado - item:', item);
                    console.log('item.receta:', item.receta);
                    console.log('item.receta_id:', item.receta_id);
                    console.log('item.id:', item.id);
                    const recetaId = item.receta?.id || item.receta_id || item.id;
                    console.log('recetaId resuelto a:', recetaId);
                    onRecetaPress(recetaId);
                  }}
                />
              ))
            ) : (
              <Text style={[styles.noRecetasText, { color: colors.textSecondary }]}>
                Sin recetas en este plan
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    )}
  </View>
);

export const PlanComidasScreen = ({ navigation: navigationProp }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [paso, setPaso] = useState(1);

  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estiloComida, setEstiloComida] = useState('mixta');
  const [ingredientesIncluir, setIngredientesIncluir] = useState('');
  const [ingredientesExcluir, setIngredientesExcluir] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);

  useFocusEffect(
    useCallback(() => {
      cargarPlanes();
      const interval = setInterval(cargarPlanes, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/meal-plans');
      console.log('Planes cargados:', JSON.stringify(data.data?.[0], null, 2));
      setPlanes(data.data || []);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearPlan = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'Ingresa un título para el plan');
      return;
    }

    if (!estiloComida) {
      Alert.alert('Error', 'Selecciona un estilo de comida');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/meal-plans', {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        estilo_comida: estiloComida,
        ingredientes_incluir: ingredientesIncluir.trim() || null,
        ingredientes_excluir: ingredientesExcluir.trim() || null,
        fecha_inicio: fechaInicio,
      });

      // Reset formulario
      setTitulo('');
      setDescripcion('');
      setEstiloComida('mixta');
      setIngredientesIncluir('');
      setIngredientesExcluir('');
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setPaso(1);
      setMostrarCrear(false);

      await cargarPlanes();
      Alert.alert('✓ Éxito', 'Plan personalizado creado.\nLa app seleccionó automáticamente las recetas.');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el plan');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPlan = async (planId) => {
    Alert.alert(
      'Eliminar Plan',
      '¿Estás seguro de que deseas eliminar este plan?',
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await apiClient.delete(`/meal-plans/${planId}`);
              await cargarPlanes();
              Alert.alert('Éxito', 'Plan eliminado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el plan');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const generarListaCompras = async (plan) => {
    try {
      await apiClient.post(`/meal-plans/${plan.id}/generar-lista`, {
        nombre: `Compras de ${plan.titulo}`,
        descripcion: `Ingredientes para ${plan.titulo}`,
      });
      Alert.alert('✓ Lista generada', 'Las compras están listas para ver', [
        {
          text: 'Ver lista',
          onPress: () => navigation.navigate('ListadoCompras'),
        },
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo generar la lista');
    }
  };

  const handleRecetaPress = (recetaId) => {
    console.log('PlanComidasScreen.handleRecetaPress llamada con recetaId:', recetaId);
    console.log('Tipo de recetaId:', typeof recetaId);
    if (recetaId) {
      console.log('Navegando a DetalleReceta con parámetros:', { recetaId });
      navigation.navigate('DetalleReceta', { recetaId });
    } else {
      console.error('recetaId es falso o undefined');
      Alert.alert('Error', 'No se pudo obtener el ID de la receta');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Plan de Comidas</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personalizado para ti
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.crearBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            setPaso(1);
            setMostrarCrear(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {loading && planes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : planes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={80} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin planes aún
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Crea un plan personalizado y la app seleccionará recetas automáticamente según tus preferencias
            </Text>
          </View>
        ) : (
          <View style={styles.planesList}>
            {planes.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={eliminarPlan}
                colors={colors}
                onPress={() => setPlanSeleccionado(plan.id === planSeleccionado ? null : plan.id)}
                expanded={planSeleccionado === plan.id}
                onRecetaPress={handleRecetaPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Crear Plan */}
      <Modal visible={mostrarCrear} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {paso === 1 ? 'Nuevo Plan' : 'Preferencias'}
              </Text>
              <TouchableOpacity onPress={() => setMostrarCrear(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {paso === 1 ? (
                // PASO 1: INFORMACIÓN BÁSICA
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Título</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Ej: Menú Saludable Enero"
                    placeholderTextColor={colors.textSecondary}
                    value={titulo}
                    onChangeText={setTitulo}
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, height: 80 }]}
                    placeholder="Ej: Plan para empezar año con energía"
                    placeholderTextColor={colors.textSecondary}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Fecha de Inicio</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={fechaInicio}
                    onChangeText={setFechaInicio}
                  />
                </>
              ) : (
                // PASO 2: PREFERENCIAS
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Estilo de Comida</Text>
                  <View style={styles.estilosContainer}>
                    {['vegana', 'vegetariana', 'gimnasio', 'perdida_peso', 'mixta'].map((estilo) => (
                      <TouchableOpacity
                        key={estilo}
                        style={[
                          styles.estiloBtn,
                          {
                            backgroundColor: estiloComida === estilo ? colors.primary : colors.cardBackground,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setEstiloComida(estilo)}
                      >
                        <MaterialCommunityIcons
                          name={
                            estilo === 'vegana' ? 'leaf'
                              : estilo === 'vegetariana' ? 'sprout'
                              : estilo === 'gimnasio' ? 'dumbbell'
                              : estilo === 'perdida_peso' ? 'run'
                              : 'check-all'
                          }
                          size={20}
                          color={estiloComida === estilo ? '#fff' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.estiloBtnText,
                            { color: estiloComida === estilo ? '#fff' : colors.text },
                          ]}
                        >
                          {estilo === 'perdida_peso' ? 'Pérdida Peso' : estilo.charAt(0).toUpperCase() + estilo.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>Ingredientes a INCLUIR (opcional)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Ej: pechuga de pollo, espinaca"
                    placeholderTextColor={colors.textSecondary}
                    value={ingredientesIncluir}
                    onChangeText={setIngredientesIncluir}
                    multiline
                    numberOfLines={2}
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Ingredientes a EXCLUIR (opcional)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Ej: maní, pescado, huevo"
                    placeholderTextColor={colors.textSecondary}
                    value={ingredientesExcluir}
                    onChangeText={setIngredientesExcluir}
                    multiline
                    numberOfLines={2}
                  />

                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    💡 La app analizará todas las recetas y seleccionará automáticamente las que coincidan con tus preferencias.
                  </Text>
                </>
              )}
            </ScrollView>

            {/* Botones Modal */}
            <View style={styles.modalButtons}>
              {paso === 2 && (
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setPaso(1)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>← Atrás</Text>
                </TouchableOpacity>
              )}

              {paso === 1 ? (
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary, flex: paso === 1 ? 1 : undefined }]}
                  onPress={() => setPaso(2)}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Siguiente →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={crearPlan}
                  disabled={loading}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                    {loading ? 'Creando...' : 'Crear Plan'}
                  </Text>
                </TouchableOpacity>
              )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  crearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  planesList: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planCardTitulo: {
    flex: 1,
    marginRight: 12,
  },
  planTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  estiloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estiloText: {
    fontSize: 11,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  estadoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planDescripcion: {
    fontSize: 13,
    marginBottom: 10,
  },
  planStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
  },
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  accionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  accionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  expandedContainer: {
    borderRadius: 12,
    borderTopWidth: 1,
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recetasScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recetasHorizontal: {
    flexDirection: 'row',
    gap: 12,
  },
  recetaItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    minWidth: 160,
  },
  recetaHeader: {
    gap: 8,
  },
  diaComida: {
    marginBottom: 6,
  },
  diaText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  comidaText: {
    fontSize: 10,
  },
  recetaTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noRecetasText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 10,
    maxHeight: '90%',
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
  modalScroll: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    fontSize: 14,
  },
  estilosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  estiloBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '45%',
  },
  estiloBtnText: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
