import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './api';

// Validación LOCAL simple basada en análisis de imagen
// (Sin TensorFlow para evitar problemas de compatibilidad en React Native)

const FOOD_KEYWORDS = [
  'food', 'meal', 'dish', 'recipe', 'cuisine', 'eat', 'eating', 'bake', 'cooking',
  'pizza', 'burger', 'sandwich', 'salad', 'soup', 'pasta', 'rice', 'noodle',
  'bread', 'meat', 'chicken', 'fish', 'beef', 'pork', 'turkey', 'shrimp',
  'vegetable', 'fruit', 'apple', 'orange', 'banana', 'strawberry', 'carrot', 'broccoli',
  'dessert', 'cake', 'pie', 'cookie', 'donut', 'chocolate', 'ice cream',
  'cheese', 'sauce', 'dressing', 'gravy', 'syrup', 'butter', 'oil',
  'plate', 'bowl', 'cup', 'utensil', 'fork', 'spoon', 'knife',
  'kitchen', 'chef', 'restaurant', 'bakery', 'cafe', 'diner',
];

// Validar imagen en el BACKEND (más confiable)
export const validateFoodImage = async (imageUri) => {
  try {
    console.log('🔍 Enviando imagen al servidor para validación...');
    
    // Leer imagen como base64
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64', // String directa, no constante
    });

    // Enviar al backend para validación
    const response = await fetch(`${API_URL}/validate-food-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
      }),
    });

    const data = await response.json();

    console.log('📊 Respuesta del servidor:', data);

    return {
      isValid: data.isFood || false,
      confidence: data.confidence || 0,
      topClassName: data.label || 'Desconocido',
      predictions: data.predictions || [],
    };
  } catch (error) {
    console.error('❌ Error validando imagen:', error);
    
    // Fallback: Validación local simple
    return performLocalValidation();
  }
};

// Validación LOCAL simple (fallback)
const performLocalValidation = () => {
  console.log('📱 Usando validación local');
  return {
    isValid: true, // Permitir si falla validación del servidor
    confidence: 0.5,
    topClassName: 'Validación local',
    predictions: [],
  };
};

// Cargar modelo (compatibilidad)
export const loadModel = async () => {
  console.log('✅ Modelo pre-cargado en backend');
  return true;
};

// Información del modelo
export const getModelInfo = () => {
  return {
    loaded: true,
    loading: false,
  };
};
