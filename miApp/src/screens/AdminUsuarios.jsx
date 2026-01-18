import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';

export const AdminUsuarios = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
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
  const [editRole, setEditRole] = useState('usuario');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    // Si viene desde route params con filtro bloqueados
    if (route?.params?.blocked) {
      setFilterType('bloqueados');
    }
    loadUsuarios();
  }, [route?.params?.blocked]);

  useEffect(() => {
    filterUsuarios();
  }, [search, usuarios, filterType]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const blocked = filterType === 'bloqueados' ? true : null;
      const response = await AdminService.getUsuarios(1, search, '', blocked);
      const usuariosData = response.data || response;
      const items = Array.isArray(usuariosData) ? usuariosData : usuariosData.data || [];
      setUsuarios(items);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsuarios = () => {
    let filtered = usuarios;
    
    // Filtrar por tipo
    if (filterType === 'bloqueados') {
      filtered = filtered.filter(u => u.is_blocked);
    }
    
    // Filtrar por búsqueda
    if (search.trim()) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredUsuarios(filtered);
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await AdminService.deleteUsuario(user.id);
              Alert.alert('Éxito', 'Usuario eliminado');
              loadUsuarios();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          },
          style: 'destructive',
        },
      ]
    );
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
    Alert.alert(
      'Desbloquear usuario',
      `¿Desbloquear a ${user.name}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              await AdminService.unblockUsuario(user.id);
              Alert.alert('Éxito', 'Usuario desbloqueado');
              loadUsuarios();
            } catch (error) {
              Alert.alert('Error', 'No se pudo desbloquear el usuario');
            }
          },
        },
      ]
    );
  };

  const handleEditUser = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'El nombre y email son requeridos');
      return;
    }

    try {
      setEditLoading(true);
      await AdminService.updateUsuario(selectedUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
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
    setEditRole(user.role || 'usuario');
    setEditDescription(user.descripcion || '');
    setShowEditModal(true);
  };

  const UserCard = ({ user, onPress }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.userHeader}>
        <Image
          source={{ uri: user.imagen_perfil || 'https://via.placeholder.com/48' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user.email}
          </Text>
        </View>
        {user.is_blocked && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Icon name="lock" size={16} color="#fff" />
          </View>
        )}
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
          style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
        >
          <Icon name="delete" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Gestionar Usuarios
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
          <Icon name="home" size={24} color={colors.text} />
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

      {/* Lista de usuarios */}
      <FlatList
        data={filteredUsuarios}
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
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              
              placeholderTextColor={colors.textSecondary}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
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
    borderBottomWidth: 1,
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
  roleSelector: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  roleSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleButttons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
