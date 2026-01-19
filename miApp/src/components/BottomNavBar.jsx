import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNotificationCount } from '../context/NotificationContext';

const NavButtonWithBadge = ({ icon, onPress, colors, badgeCount, isActive }) => (
  <View style={styles.navButtonContainer}>
    <TouchableOpacity 
      style={styles.navButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon 
        name={isActive ? icon.replace('-outline', '') : icon} 
        size={26} 
        color={isActive ? '#000000' : '#000000'} // Forzar negro siempre
      />
    </TouchableOpacity>
    {badgeCount > 0 && (
      <View style={[styles.badge, { borderColor: colors.cardBackground }]}>
        <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
      </View>
    )}
  </View>
);

const NavButton = ({ icon, onPress, colors, isActive }) => (
  <TouchableOpacity 
    style={styles.navButton} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Icon 
      name={isActive ? icon.replace('-outline', '') : icon} 
      size={26} 
      color={isActive ? '#000000' : '#000000'} // Forzar negro siempre
    />
  </TouchableOpacity>
);

export const BottomNavBar = ({ navigation, currentRoute, colors }) => {
  const { notificationCount } = useNotificationCount();

  const handleNavigation = (routeName) => {
    if (currentRoute !== routeName) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.cardBackground || '#FFFFFF', borderTopColor: colors.border }]}>
      <NavButton
        icon="home-outline"
        onPress={() => handleNavigation('Home')}
        colors={colors}
        isActive={currentRoute === 'Home'}
      />
      <NavButton
        icon="magnify"
        onPress={() => handleNavigation('Buscar')}
        colors={colors}
        isActive={currentRoute === 'Buscar'}
      />
      <NavButton
        icon="plus-circle-outline"
        onPress={() => handleNavigation('CrearReceta')}
        colors={colors}
        isActive={currentRoute === 'CrearReceta'}
      />
      <NavButtonWithBadge
        icon="bell-outline"
        onPress={() => handleNavigation('Alertas')}
        colors={colors}
        badgeCount={notificationCount}
        isActive={currentRoute === 'Alertas'}
      />
      <NavButton
        icon="account-outline"
        onPress={() => handleNavigation('Perfil')}
        colors={colors}
        isActive={currentRoute === 'Perfil'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65, // Más alto en iOS por el notch
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    // Sombras para que se vea sobre el fondo blanco
    elevation: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: '20%',
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
});