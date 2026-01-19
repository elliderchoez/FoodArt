import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

export const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        setTimeout(() => {
          if (token) {
            validateToken(token, navigation);
          } else {
            navigation.replace('Login');
          }
        }, 1000);
      } catch (error) {
        navigation.replace('Login');
      }
    };

    checkToken();
  }, [navigation]);

  const validateToken = async (token, navigation) => {
    try {
      await apiClient.get(`/user`);
      navigation.replace('Home');
    } catch (error) {
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
