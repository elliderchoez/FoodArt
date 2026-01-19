import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';

export const AdminUsuarios = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user: currentUser } = useAppContext();
  const [usuarios, setUsuarios] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [filterType, setFilterType] = useState('todos'); // 'todos', 'bloqueados'
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    // Si viene desde route params con filtro bloqueados
    if (route?.params?.blocked) {
      setFilterType('bloqueados');
    }
  }, [route?.params?.blocked]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsuarios();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search, filterType]);

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const blocked = filterType === 'bloqueados' ? true : null;
      const response = await AdminService.getUsuarios(1, search, '', blocked);
      const usuariosData = response.data || response;
      const items = Array.isArray(usuariosData) ? usuariosData : usuariosData.data || [];

      setTotalUsuarios(
        typeof usuariosData?.total === 'number' ? usuariosData.total : null
      );
      setUsuarios(items);
      setFilteredUsuarios(items);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  const sortedUsuarios = useMemo(() => {
    const list = Array.isArray(filteredUsuarios) ? [...filteredUsuarios] : [];
    const dir = sortDirection === 'asc' ? 1 : -1;

    const asString = (value) => (value ?? '').toString().toLowerCase();
    const asDate = (value) => {
      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    };

    list.sort((a, b) => {
      if (sortKey === 'name') {
        return asString(a?.name).localeCompare(asString(b?.name)) * dir;
      }

      if (sortKey === 'email') {
        return asString(a?.email).localeCompare(asString(b?.email)) * dir;
      }

      if (sortKey === 'role') {
        const roleOrder = (u) => (u?.role === 'admin' ? 0 : 1);
        const diff = roleOrder(a) - roleOrder(b);
        if (diff !== 0) return diff * dir;
        return asString(a?.name).localeCompare(asString(b?.name)) * dir;
      }

      if (sortKey === 'status') {
        const statusOrder = (u) => (u?.is_blocked ? 0 : 1);
        const diff = statusOrder(a) - statusOrder(b);
        if (diff !== 0) return diff * dir;
        return asString(a?.name).localeCompare(asString(b?.name)) * dir;
      }

      // created_at (default)
      return (asDate(a?.created_at) - asDate(b?.created_at)) * dir;
    });

    return list;
  }, [filteredUsuarios, sortKey, sortDirection]);

  const sortKeyLabel = useMemo(() => {
    switch (sortKey) {
      case 'name':
        return 'Nombre';
      case 'email':
        return 'Correo';
      case 'role':
        return 'Rol';
      case 'created_at':
      default:
        return 'Tiempo';
    }
  }, [sortKey]);

  const cycleSortKey = useCallback(() => {
    setSortKey((prev) => {
      if (prev === 'created_at') return 'name';
      if (prev === 'name') return 'email';
      if (prev === 'email') return 'role';
      return 'created_at';
    });
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleDeleteUser = (user) => {
    if (currentUser?.id && user?.id === currentUser.id) {
      Alert.alert('Acción no permitida', 'No puedes eliminar tu propia cuenta desde aquí.');
      return;
    }

    if (user?.role === 'admin') {
      Alert.alert('Acción no permitida', 'No puedes eliminar cuentas de administrador.');
      return;
    }

    const doDelete = async () => {
      try {
        await AdminService.deleteUsuario(user.id);
        Alert.alert('Éxito', 'Usuario eliminado');
        loadUsuarios();
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'No se pudo eliminar el usuario';
        Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(
        `¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.`
      );
      if (ok) {
        void doDelete();
      }
      return;
    }

    Alert.alert('Eliminar usuario', `¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
      { text: 'Eliminar', onPress: doDelete, style: 'destructive' },
    ]);
  };

  const handleBlockUser = async () => {
    if (!blockReason.trim()) {
      Alert.alert('Error', 'Debes ingresar una razón');
      return;
    }

    try {
      await AdminService.blockUsuario(selectedUser.id, blockReason);
      Alert.alert('Éxito', 'Usuario bloqueado');
      setShowBlockModal(false);
      setBlockReason('');
      loadUsuarios();
    } catch (error) {
      Alert.alert('Error', 'No se pudo bloquear el usuario');
    }
  };

  const handleUnblockUser = async (user) => {
    const doUnblock = async () => {
      try {
        await AdminService.unblockUsuario(user.id);
        Alert.alert('Éxito', 'Usuario desbloqueado');
        loadUsuarios();
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'No se pudo desbloquear el usuario';
        Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`¿Desbloquear a ${user.name}?`);
      if (ok) {
        void doUnblock();
      }
      return;
    }

    Alert.alert('Desbloquear usuario', `¿Desbloquear a ${user.name}?`, [
      { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
      { text: 'Desbloquear', onPress: doUnblock },
    ]);
  };

  const handleEditUser = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'El nombre y el correo son requeridos');
      return;
    }

    try {
      setEditLoading(true);
      await AdminService.updateUsuario(selectedUser.id, {
        name: editName,
        email: editEmail,
        descripcion: editDescription,
      });
      Alert.alert('Éxito', 'Usuario actualizado');
      setShowEditModal(false);
      loadUsuarios();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDescription(user.descripcion || '');
    setShowEditModal(true);
  };

  const UserCard = ({ user, onPress }) => (
    (() => {
      const isSelf = Boolean(currentUser?.id) && user?.id === currentUser.id;
      const isAdminTarget = user?.role === 'admin';
      const canDelete = !isSelf && !isAdminTarget;

      return (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.userHeader}>
        {user.imagen_perfil ? (
          <Image source={{ uri: user.imagen_perfil }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="account" size={22} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user.email}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.roleBadge,
              {
                borderColor: colors.border,
                backgroundColor:
                  user.role === 'admin' ? colors.primary + '20' : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                {
                  color: user.role === 'admin' ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {(user.role || 'usuario').toUpperCase()}
            </Text>
          </View>

          {user.is_blocked && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Icon name="lock" size={16} color="#fff" />
            </View>
          )}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          onPress={() => {
            openEditModal(user);
          }}
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
        >
          <Icon name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>

        {user.is_blocked ? (
          <TouchableOpacity
            onPress={() => handleUnblockUser(user)}
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
          >
            <Icon name="lock-open" size={18} color={colors.success} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setSelectedUser(user);
              setShowBlockModal(true);
            }}
            style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
          >
            <Icon name="lock" size={18} color={colors.warning} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => handleDeleteUser(user)}
          style={[
            styles.actionButton,
            { backgroundColor: colors.error + '20', opacity: canDelete ? 1 : 0.45 },
          ]}
        >
          <Icon name="delete" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
      );
    })()
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>
          Gestionar Usuarios
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
          <Icon name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: filterType === 'todos' ? colors.primary : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            setFilterType('todos');
            setSearch('');
          }}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filterType === 'todos' ? '#fff' : colors.text },
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: filterType === 'bloqueados' ? colors.primary : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            setFilterType('bloqueados');
            setSearch('');
          }}
        >
          <Icon
            name="lock"
            size={16}
            color={filterType === 'bloqueados' ? '#fff' : colors.text}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: filterType === 'bloqueados' ? '#fff' : colors.text },
            ]}
          >
            Bloqueados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Meta + orden */}
      <View style={styles.metaRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {typeof totalUsuarios === 'number'
            ? `Total: ${totalUsuarios} • Mostrando: ${sortedUsuarios.length}`
            : `Mostrando: ${sortedUsuarios.length}`}
        </Text>
        <View style={styles.sortControls}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={cycleSortKey}
            activeOpacity={0.85}
          >
            <Icon name="filter-variant" size={18} color={colors.text} />
            <Text style={[styles.sortButtonText, { color: colors.text }]} numberOfLines={1}>
              {sortKeyLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.directionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={toggleSortDirection}
            activeOpacity={0.85}
          >
            <Icon
              name={sortDirection === 'asc' ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de usuarios */}
      <FlatList
        data={sortedUsuarios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <UserCard user={item} onPress={() => {}} />}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay usuarios
            </Text>
          </View>
        }
      />

      {/* Modal de edición */}
      <Modal visible={showEditModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Editar usuario
            </Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.label, { color: colors.text }]}>Correo</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.textSecondary}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              
              placeholderTextColor={colors.textSecondary}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: editLoading ? 0.5 : 1 }]}
                onPress={handleEditUser}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de bloqueo */}
      <Modal visible={showBlockModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Bloquear usuario
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Razón del bloqueo..."
              placeholderTextColor={colors.textSecondary}
              value={blockReason}
              onChangeText={setBlockReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                }}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.warning }]}
                onPress={handleBlockUser}
              >
                <Text style={styles.confirmButtonText}>Bloquear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 190,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  directionButton: {
    width: 40,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
