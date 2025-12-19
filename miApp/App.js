import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <>
        <AppNavigator />
        <StatusBar style="auto" />
      </>
    </ThemeProvider>
  );
}

