import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';

export const BlockedWallScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { logout, blockedReason } = useAppContext();

  const handleSalir = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <Icon name="lock" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Cuenta bloqueada</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tu cuenta ha sido bloqueada por moderación.</Text>

        {!!blockedReason && (
          <View style={[styles.reasonBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.reasonLabel, { color: colors.text }]}>Motivo</Text>
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{blockedReason}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSalir}>
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  reasonBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
