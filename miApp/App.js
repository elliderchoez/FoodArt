import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <>
          <AppNavigator />
          <StatusBar style="auto" />
        </>
      </NotificationProvider>
    </ThemeProvider>
  );
}

