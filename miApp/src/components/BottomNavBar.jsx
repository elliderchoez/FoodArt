import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationCount } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const NavButtonWithBadge = ({ icon, onPress, colors, badgeCount, isActive }) => {
  const safeColors = colors || { primary: '#D4AF37', textSecondary: '#999' };
  return (
    <View style={styles.navButtonContainer}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon 
          name={icon} 
          size={24} 
          color={isActive ? safeColors.primary : safeColors.textSecondary} 
        />
      </TouchableOpacity>
      {badgeCount > 0 && (
        <View style={[styles.badge, { borderColor: safeColors.cardBackground || '#FFFFFF' }]}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
};

const NavButton = ({ icon, onPress, colors, isActive }) => {
  const safeColors = colors || { primary: '#D4AF37', textSecondary: '#999' };
  return (
    <TouchableOpacity 
      style={styles.navButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon 
        name={icon} 
        size={24} 
        color={isActive ? safeColors.primary : safeColors.textSecondary} 
      />
    </TouchableOpacity>
  );
};

export const BottomNavBar = ({ navigation: navigationProp, currentRoute, colors: propsColors }) => {
  const navigation = useNavigation();
  const { notificationCount } = useNotificationCount();
  const { colors: themeColors } = useTheme();
  const colors = propsColors || themeColors;

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
        icon="magnify"
        onPress={() => handleNavigation('Buscar')}
        colors={colors}
        isActive={currentRoute === 'Buscar'}
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
      <NavButtonWithBadge
        icon="bell-outline"
        onPress={() => handleNavigation('Alertas')}
        colors={colors}
        badgeCount={notificationCount}
        isActive={currentRoute === 'Alertas'}
      />
      <NavButton
        icon="message-outline"
        onPress={() => handleNavigation('Mensajes')}
        colors={colors}
        isActive={currentRoute === 'Mensajes'}
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
