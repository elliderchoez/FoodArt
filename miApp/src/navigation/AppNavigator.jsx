import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BuscarScreen } from '../screens/BuscarScreen';
import { AlertasScreen } from '../screens/AlertasScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { EditarPerfilScreen } from '../screens/EditarPerfilScreen';
import { UsuarioPerfilScreen } from '../screens/UsuarioPerfilScreen';
import CrearRecetaScreen from '../screens/CrearRecetaScreen';
import DetalleRecetaScreen from '../screens/DetalleRecetaScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Buscar" component={BuscarScreen} />
        <Stack.Screen name="Alertas" component={AlertasScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
        <Stack.Screen name="UsuarioPerfil" component={UsuarioPerfilScreen} />
        <Stack.Screen name="CrearReceta" component={CrearRecetaScreen} />
        <Stack.Screen name="DetalleReceta" component={DetalleRecetaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
