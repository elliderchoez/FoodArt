import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

export const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Limpiar token para forzar flujo: Splash → Login → Home
        await AsyncStorage.removeItem('authToken');
        
        const token = await AsyncStorage.getItem('authToken');
        console.log('Token en SplashScreen:', token ? 'Existe' : 'No existe');
        
        setTimeout(() => {
          if (token) {
            console.log('Validando token...');
            validateToken(token, navigation);
          } else {
            console.log('No hay token, ir a Login');
            navigation.replace('Login');
          }
        }, 1000);
      } catch (error) {
        console.error('Error verificando token:', error);
        navigation.replace('Login');
      }
    };

    checkToken();
  }, [navigation]);

  const validateToken = async (token, navigation) => {
    try {
      await apiClient.get(`/user`);
      console.log('Token válido, ir a Home');
      navigation.replace('Home');
    } catch (error) {
      console.error('Error validando token:', error);
      console.log('Error en validación, ir a Login');
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
