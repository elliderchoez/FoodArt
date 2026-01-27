import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
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
        name={icon} 
        size={24} 
        color={isActive ? colors.primary : colors.textSecondary} 
      />
    </TouchableOpacity>
    {badgeCount > 0 && (
      <View style={[styles.badge, { borderColor: colors.cardBackground }]}
      >
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
      name={icon} 
      size={24} 
      color={isActive ? colors.primary : colors.textSecondary} 
    />
  </TouchableOpacity>
);

export const AdminBottomNavBar = ({ navigation, currentRoute, colors }) => {
  const { notificationCount } = useNotificationCount();

  const handleNavigation = (routeName) => {
    if (currentRoute !== routeName) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      ]}
    >
      <NavButton
        icon="home-outline"
        onPress={() => handleNavigation('Home')}
        colors={colors}
        isActive={currentRoute === 'Home'}
      />
      <NavButton
        icon="calendar-outline"
        onPress={() => handleNavigation('PlanComidas')}
        colors={colors}
        isActive={currentRoute === 'PlanComidas'}
      />
      <NavButton
        icon="plus-circle-outline"
        onPress={() => handleNavigation('CrearReceta')}
        colors={colors}
        isActive={currentRoute === 'CrearReceta'}
      />
      <NavButton
        icon="message-outline"
        onPress={() => handleNavigation('Mensajes')}
        colors={colors}
        isActive={currentRoute === 'Mensajes'}
      />
      <NavButton
        icon="security"
        onPress={() => handleNavigation('AdminDashboard')}
        colors={colors}
        isActive={currentRoute === 'AdminDashboard'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
