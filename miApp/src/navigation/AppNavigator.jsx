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
import { AdminDashboard } from '../screens/AdminDashboard';
import { AdminUsuarios } from '../screens/AdminUsuarios';
import { AdminRecetas } from '../screens/AdminRecetas';
import { AdminReports } from '../screens/AdminReports';
import { AdminLogs } from '../screens/AdminLogs';
import { AdminParameters } from '../screens/AdminParameters';
import { AdminBackups } from '../screens/AdminBackups';
import { AdminAccessScreen } from '../screens/AdminAccessScreen';
import { CambiarContrasenaScreen } from '../screens/CambiarContrasenaScreen';
import { OlvidarContrasenaScreen } from '../screens/OlvidarContrasenaScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          animation: 'none',
        }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegisterScreen} />
        <Stack.Screen name="OlvidarContrasena" component={OlvidarContrasenaScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Buscar" component={BuscarScreen} />
        <Stack.Screen name="Alertas" component={AlertasScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
        <Stack.Screen name="CambiarContrasena" component={CambiarContrasenaScreen} />
        <Stack.Screen name="UsuarioPerfil" component={UsuarioPerfilScreen} />
        <Stack.Screen name="CrearReceta" component={CrearRecetaScreen} />
        <Stack.Screen name="DetalleReceta" component={DetalleRecetaScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminAccess" component={AdminAccessScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminUsuarios" component={AdminUsuarios} />
        <Stack.Screen name="AdminRecetas" component={AdminRecetas} />
        <Stack.Screen name="AdminReports" component={AdminReports} />
        <Stack.Screen name="AdminLogs" component={AdminLogs} />
        <Stack.Screen name="AdminParameters" component={AdminParameters} />
        <Stack.Screen name="AdminBackups" component={AdminBackups} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
