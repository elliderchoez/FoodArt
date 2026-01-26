import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AdminService } from '../services/AdminService';
import { useTheme } from '../context/ThemeContext';

export const AdminReports = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [recipeReports, setRecipeReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [commentReports, setCommentReports] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [filter, setFilter] = useState('todos'); // 'pendiente', 'resuelto', 'todos'
  const [reportType, setReportType] = useState('todos'); // 'todos', 'receta', 'usuario', 'comentario'
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const refreshIntervalRef = useRef(null);

  const [resolveStatus, setResolveStatus] = useState('resuelto');
  const [resolveAction, setResolveAction] = useState('none');
  const [adminResponse, setAdminResponse] = useState('');
  const [adminResponseTouched, setAdminResponseTouched] = useState(false);
  const [lastAutoResponse, setLastAutoResponse] = useState('');

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'inapropiado':
        return 'Contenido inapropiado';
      case 'spam':
        return 'Spam';
      case 'falso':
        return 'Información falsa';
      case 'plagios':
        return 'Plagio';
      case 'acoso':
        return 'Acoso';
      case 'suplantacion':
        return 'Suplantación';
      case 'otro':
      default:
        return 'Otro';
    }
  };

  const getReportTypeLabel = (type) => {
    if (type === 'usuario') return 'Usuario';
    if (type === 'comentario') return 'Comentario';
    return 'Receta';
  };

  const buildDefaultModerationMessage = (report, status, action) => {
    const reasonLabel = getReasonLabel(report?.reason);
    const subject = report?.type === 'usuario' ? 'Tu cuenta fue reportada.' : report?.type === 'comentario' ? 'Tu comentario fue reportado.' : 'Tu receta fue reportada.';

    let measure = 'Medida: sin acciones adicionales.';

    if (report?.type === 'usuario') {
      if (action === 'block_reported_user') measure = 'Medida: tu cuenta fue bloqueada.';
      else if (action === 'mute_reported_user_7d') measure = 'Medida: no podrás comentar durante 7 días.';
      else if (action === 'mute_reported_user_30d') measure = 'Medida: no podrás comentar durante 30 días.';
    } else if (report?.type === 'comentario') {
      if (action === 'delete_comentario') measure = 'Medida: tu comentario fue eliminado.';
      else if (action === 'block_comment_author') measure = 'Medida: tu cuenta fue bloqueada.';
      else if (action === 'mute_comment_author_7d') measure = 'Medida: no podrás comentar durante 7 días. Tu comentario fue eliminado.';
      else if (action === 'mute_comment_author_30d') measure = 'Medida: no podrás comentar durante 30 días. Tu comentario fue eliminado.';
    } else {
      if (action === 'delete_receta') measure = 'Medida: tu receta fue eliminada.';
      else if (action === 'block_recipe') measure = 'Medida: tu receta fue bloqueada.';
      else if (action === 'block_recipe_author') measure = 'Medida: tu cuenta fue bloqueada.';
      else if (action === 'mute_recipe_author_7d') measure = 'Medida: no podrás comentar durante 7 días.';
      else if (action === 'mute_recipe_author_30d') measure = 'Medida: no podrás comentar durante 30 días.';
    }

    return `${subject} Motivo: ${reasonLabel}. ${measure}`;
  };

  const confirmAsync = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }

    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirmar', onPress: () => resolve(true) },
      ]);
    });
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    // Evitar refrescos automáticos mientras el admin está leyendo un reporte.
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!showModal) {
      refreshIntervalRef.current = setInterval(() => {
        loadReports({ silent: true });
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [showModal]);

  const loadReports = async (options = {}) => {
    const silent = options?.silent === true;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      const [recetaResp, userResp, commentResp] = await Promise.all([
        AdminService.getReports(1, ''),
        AdminService.getUserReports(1, ''),
        AdminService.getCommentReports(1, ''),
      ]);

      const recetaData = recetaResp.data || recetaResp;
      const userData = userResp.data || userResp;
      const commentData = commentResp.data || commentResp;

      const recetaItemsRaw = Array.isArray(recetaData) ? recetaData : recetaData.data || [];
      const userItemsRaw = Array.isArray(userData) ? userData : userData.data || [];
      const commentItemsRaw = Array.isArray(commentData) ? commentData : commentData.data || [];

      const recetaItems = recetaItemsRaw.map((r) => ({
        ...r,
        type: r.type || 'receta',
      }));
      const userItems = userItemsRaw.map((r) => ({
        ...r,
        type: r.type || 'usuario',
      }));
      const commentItems = commentItemsRaw.map((r) => ({
        ...r,
        type: r.type || 'comentario',
      }));

      setRecipeReports(recetaItems);
      setUserReports(userItems);
      setCommentReports(commentItems);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      if (!silent) {
        Alert.alert('Error', 'No se pudieron cargar los reportes');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  const allReports = useMemo(() => {
    return [...recipeReports, ...userReports, ...commentReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [recipeReports, userReports, commentReports]);

  const visibleReportsBase = useMemo(() => {
    if (reportType === 'receta') return recipeReports;
    if (reportType === 'usuario') return userReports;
    if (reportType === 'comentario') return commentReports;
    return allReports;
  }, [reportType, recipeReports, userReports, commentReports, allReports]);

  const sortedReportsBase = useMemo(() => {
    const list = Array.isArray(visibleReportsBase) ? [...visibleReportsBase] : [];
    const dir = sortDirection === 'asc' ? 1 : -1;

    const asString = (value) => (value ?? '').toString().toLowerCase();
    const asDate = (value) => {
      const d = value ? new Date(value) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    };

    const getAuthorName = (r) => {
      if (r?.type === 'usuario') return r?.reportedUser?.name || '';
      if (r?.type === 'comentario') return r?.comentario?.user?.name || r?.reportedUser?.name || '';
      return r?.receta?.user?.name || '';
    };

    const getReporterName = (r) => {
      if (r?.type === 'usuario') return r?.reporter?.name || '';
      if (r?.type === 'comentario') return r?.reporter?.name || '';
      return r?.usuario?.name || '';
    };

    list.sort((a, b) => {
      if (sortKey === 'author') {
        return asString(getAuthorName(a)).localeCompare(asString(getAuthorName(b))) * dir;
      }

      if (sortKey === 'reporter') {
        return asString(getReporterName(a)).localeCompare(asString(getReporterName(b))) * dir;
      }

      if (sortKey === 'status') {
        return asString(a?.status).localeCompare(asString(b?.status)) * dir;
      }

      if (sortKey === 'reason') {
        return asString(getReasonLabel(a?.reason)).localeCompare(asString(getReasonLabel(b?.reason))) * dir;
      }

      // created_at (default)
      return (asDate(a?.created_at) - asDate(b?.created_at)) * dir;
    });

    return list;
  }, [visibleReportsBase, sortKey, sortDirection]);

  const filteredReports = useMemo(() => {
    if (filter === 'pendiente') {
      return sortedReportsBase.filter(r => r.status === 'pendiente');
    } else if (filter === 'resuelto') {
      return sortedReportsBase.filter(r => r.status === 'resuelto');
    }
    return sortedReportsBase;
  }, [filter, sortedReportsBase]);

  const sortKeyLabel = useMemo(() => {
    switch (sortKey) {
      case 'author':
        return 'Autor';
      case 'reporter':
        return 'Reportó';
      case 'status':
        return 'Estado';
      case 'reason':
        return 'Razón';
      case 'created_at':
      default:
        return 'Fecha';
    }
  }, [sortKey]);

  const cycleSortKey = () => {
    setSortKey((prev) => {
      if (prev === 'created_at') return 'author';
      if (prev === 'author') return 'reporter';
      if (prev === 'reporter') return 'status';
      if (prev === 'status') return 'reason';
      return 'created_at';
    });
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const getAvailableActions = (report) => {
    if (!report) return [];
    if (report.type === 'usuario') {
      return [
        { value: 'none', label: 'Sin acción' },
        { value: 'block_reported_user', label: 'Bloquear usuario reportado' },
        { value: 'mute_reported_user_7d', label: 'Prohibir comentar 7 días' },
        { value: 'mute_reported_user_30d', label: 'Prohibir comentar 30 días' },
      ];
    }
    if (report.type === 'comentario') {
      return [
        { value: 'none', label: 'Sin acción' },
        { value: 'delete_comentario', label: 'Eliminar comentario' },
        { value: 'block_comment_author', label: 'Bloquear autor del comentario' },
        { value: 'mute_comment_author_7d', label: 'Prohibir comentar 7 días' },
        { value: 'mute_comment_author_30d', label: 'Prohibir comentar 30 días' },
      ];
    }
    return [
      { value: 'none', label: 'Sin acción' },
      { value: 'block_recipe', label: 'Bloquear receta' },
      { value: 'delete_receta', label: 'Eliminar receta' },
      { value: 'block_recipe_author', label: 'Bloquear autor de la receta' },
      { value: 'mute_recipe_author_7d', label: 'Prohibir comentar 7 días' },
      { value: 'mute_recipe_author_30d', label: 'Prohibir comentar 30 días' },
    ];
  };

  const initResolveForm = (report) => {
    setResolveStatus('resuelto');
    const actions = getAvailableActions(report);
    const initialAction = actions[0]?.value || 'none';
    setResolveAction(initialAction);
    const auto = buildDefaultModerationMessage(report, 'resuelto', initialAction);
    setAdminResponse(auto);
    setLastAutoResponse(auto);
    setAdminResponseTouched(false);
  };

  useEffect(() => {
    if (!showModal || !selectedReport) return;
    // Mantener el mensaje predeterminado sincronizado con estado/acción
    // mientras el admin no lo haya reemplazado por un texto propio.
    const auto = buildDefaultModerationMessage(selectedReport, resolveStatus, resolveAction);
    const current = (adminResponse || '').trim();

    const shouldAutoUpdate =
      !adminResponseTouched ||
      current === '' ||
      adminResponse === lastAutoResponse;

    setLastAutoResponse(auto);
    if (shouldAutoUpdate) {
      setAdminResponse(auto);
    }
  }, [showModal, selectedReport, resolveStatus, resolveAction, adminResponseTouched, adminResponse, lastAutoResponse]);

  const submitResolve = async () => {
    if (!selectedReport) return;
    const trimmedResponse = (adminResponse || '').trim();

    const confirm = await confirmAsync(
      'Confirmar resolución',
      `Estado: ${resolveStatus}\nAcción: ${resolveAction}\n\n¿Deseas aplicar estos cambios?`
    );
    if (!confirm) return;

    try {
      setResolving(true);
      const payload = {
        status: resolveStatus,
        response: trimmedResponse,
        action: resolveAction,
      };

      if (selectedReport.type === 'usuario') {
        await AdminService.resolveUserReport(selectedReport.id, payload);
      } else if (selectedReport.type === 'comentario') {
        await AdminService.resolveCommentReport(selectedReport.id, payload);
      } else {
        await AdminService.resolveReport(selectedReport.id, payload);
      }

      await loadReports({ silent: true });
      setShowModal(false);
      Alert.alert('Éxito', 'Reporte actualizado');
    } catch (error) {
      console.error('Error resolviendo reporte:', error);
      Alert.alert('Error', 'No se pudo resolver el reporte');
    } finally {
      setResolving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return '#ff9800';
      case 'resuelto':
        return '#4caf50';
      case 'revisado':
        return '#2196f3';
      case 'rechazado':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return 'clock';
      case 'resuelto':
        return 'check-circle';
      case 'revisado':
        return 'clipboard-check';
      case 'rechazado':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedReport(item);
        initResolveForm(item);
        setShowModal(true);
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Icon
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={2}>
            {item.type === 'usuario'
              ? (item.reportedUser?.name || 'Usuario reportado')
              : item.type === 'comentario'
              ? (item.comentario?.contenido
                ? `Comentario: ${(item.comentario.contenido || '').slice(0, 60)}${(item.comentario.contenido || '').length > 60 ? '…' : ''}`
                : (item.receta?.titulo || 'Comentario'))
              : (item.receta?.titulo || 'Receta desconocida')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.typePill, { borderColor: colors.border }]}>
          <Text style={[styles.typePillText, { color: colors.textSecondary }]}>
            {getReportTypeLabel(item.type)}
          </Text>
        </View>
      </View>

      <Text style={[styles.reporterText, { color: colors.textSecondary }]}>
        Reportado por: {item.type === 'usuario'
          ? (item.reporter?.name || 'Usuario')
          : item.type === 'comentario'
          ? (item.reporter?.name || 'Usuario')
          : (item.usuario?.name || 'Usuario')}
      </Text>

      <Text
        style={[styles.reportReason, { color: colors.text }]}
        numberOfLines={2}
      >
        {getReasonLabel(item.reason)}
      </Text>

      {item.description ? (
        <Text style={[styles.reportReason, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (initialLoading && recipeReports.length === 0 && userReports.length === 0 && commentReports.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerTitle}>Reportes de Contenido</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme}>
            <Icon
              name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => loadReports({ silent: true })}
            style={{ marginLeft: 14 }}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="refresh" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: reportType === 'todos' ? colors.primary : colors.border,
              borderWidth: reportType === 'todos' ? 2 : 1,
            },
          ]}
          onPress={() => setReportType('todos')}
        >
          <Icon name="format-list-bulleted" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {allReports.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: reportType === 'receta' ? colors.primary : colors.border,
              borderWidth: reportType === 'receta' ? 2 : 1,
            },
          ]}
          onPress={() => setReportType('receta')}
        >
          <Icon name="chef-hat" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {recipeReports.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Recetas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: reportType === 'usuario' ? colors.primary : colors.border,
              borderWidth: reportType === 'usuario' ? 2 : 1,
            },
          ]}
          onPress={() => setReportType('usuario')}
        >
          <Icon name="account-alert" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {userReports.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Usuarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            {
              backgroundColor: colors.card,
              borderColor: reportType === 'comentario' ? colors.primary : colors.border,
              borderWidth: reportType === 'comentario' ? 2 : 1,
            },
          ]}
          onPress={() => setReportType('comentario')}
        >
          <Icon name="comment-alert" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {commentReports.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Comentarios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtro de estado (estilo AdminUsuarios) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor:
                filter === 'todos'
                  ? colors.primary
                  : (colors.cardBackground || colors.card),
              borderColor: colors.border,
            },
          ]}
          onPress={() => setFilter('todos')}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'todos' ? '#fff' : colors.text },
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor:
                filter === 'pendiente'
                  ? colors.primary
                  : (colors.cardBackground || colors.card),
              borderColor: colors.border,
            },
          ]}
          onPress={() => setFilter('pendiente')}
        >
          <Icon
            name="clock"
            size={16}
            color={filter === 'pendiente' ? '#fff' : colors.text}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'pendiente' ? '#fff' : colors.text },
            ]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor:
                filter === 'resuelto'
                  ? colors.primary
                  : (colors.cardBackground || colors.card),
              borderColor: colors.border,
            },
          ]}
          onPress={() => setFilter('resuelto')}
        >
          <Icon
            name="check-circle"
            size={16}
            color={filter === 'resuelto' ? '#fff' : colors.text}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'resuelto' ? '#fff' : colors.text },
            ]}
          >
            Resueltos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meta + orden (estilo AdminUsuarios) */}
      <View style={styles.listMetaRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {`Mostrando: ${filteredReports.length}`}
        </Text>
        <View style={styles.sortControls}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: (colors.cardBackground || colors.card),
                borderColor: colors.border,
              },
            ]}
            onPress={cycleSortKey}
            activeOpacity={0.85}
          >
            <Icon name="filter-variant" size={18} color={colors.text} />
            <Text style={[styles.sortButtonText, { color: colors.text }]} numberOfLines={1}>
              {sortKeyLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.directionButton,
              {
                backgroundColor: (colors.cardBackground || colors.card),
                borderColor: colors.border,
              },
            ]}
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

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox-multiple" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {filter === 'pendiente'
              ? 'No hay reportes pendientes'
              : filter === 'resuelto'
              ? 'No hay reportes resueltos'
              : 'No hay reportes'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => `${item.type || 'reporte'}-${item.id}`}
          contentContainerStyle={styles.listContent}
          style={{ flex: 1 }}
          scrollEnabled
        />
      )}

      {/* Modal de Detalle */}
      <Modal visible={showModal} transparent animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header Modal */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detalles del Reporte</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadgeLarge,
                  { backgroundColor: getStatusColor(selectedReport.status) },
                ]}
              >
                <Icon
                  name={getStatusIcon(selectedReport.status)}
                  size={32}
                  color="#fff"
                />
                <Text style={styles.statusTextLarge}>
                  {(selectedReport.status || 'pendiente').toUpperCase()}
                </Text>
              </View>

              {/* Contenido reportado */}
              {selectedReport.type === 'receta' ? (
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Receta Reportada
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="chef-hat" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.receta?.titulo}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Autor: {selectedReport.receta?.user?.name || 'Desconocido'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.viewRecetaButton, { borderColor: colors.primary }]}
                  onPress={() => {
                    setShowModal(false);
                    navigation.navigate('DetalleReceta', {
                      recetaId: selectedReport.receta_id,
                      receta: selectedReport.receta,
                      isAdmin: true,
                    });
                  }}
                >
                  <Icon name="eye" size={16} color={colors.primary} />
                  <Text style={[styles.viewRecetaText, { color: colors.primary }]}>
                    Ver Receta
                  </Text>
                </TouchableOpacity>
              </View>
              ) : selectedReport.type === 'usuario' ? (
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Usuario Reportado
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.reportedUser?.name || 'Usuario'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="email" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.reportedUser?.email || '—'}
                  </Text>
                </View>
              </View>
              ) : (
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Comentario Reportado</Text>

                <View style={styles.infoRow}>
                  <Icon name="comment" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]} numberOfLines={3}>
                    {selectedReport.comentario?.contenido || '—'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Autor: {selectedReport.comentario?.user?.name || selectedReport.reportedUser?.name || '—'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="chef-hat" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Receta: {selectedReport.receta?.titulo || '—'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.viewRecetaButton, { borderColor: colors.primary }]}
                  onPress={() => {
                    setShowModal(false);
                    navigation.navigate('DetalleReceta', {
                      recetaId: selectedReport.receta_id,
                      receta: selectedReport.receta,
                      isAdmin: true,
                    });
                  }}
                >
                  <Icon name="eye" size={16} color={colors.primary} />
                  <Text style={[styles.viewRecetaText, { color: colors.primary }]}>Ver Receta</Text>
                </TouchableOpacity>
              </View>
              )}

              {/* Reportador */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Reportado Por
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="account" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.type === 'usuario'
                      ? (selectedReport.reporter?.name || 'Usuario')
                      : selectedReport.type === 'comentario'
                      ? (selectedReport.reporter?.name || 'Usuario')
                      : (selectedReport.usuario?.name || 'Usuario')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="email" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    {selectedReport.type === 'usuario'
                      ? (selectedReport.reporter?.email || '—')
                      : selectedReport.type === 'comentario'
                      ? (selectedReport.reporter?.email || '—')
                      : (selectedReport.usuario?.email || '—')}
                  </Text>
                </View>
              </View>

              {/* Razón del Reporte */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Razón del Reporte
                </Text>
                <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                  {getReasonLabel(selectedReport.reason)}
                </Text>
                {selectedReport.description ? (
                  <Text style={[styles.descriptionText, { color: colors.text }]}>
                    {selectedReport.description}
                  </Text>
                ) : null}
              </View>

              {/* Detalles */}
              <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Información
                </Text>

                <View style={styles.infoRow}>
                  <Icon name="calendar" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Reportado: {new Date(selectedReport.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {selectedReport.reviewed_at && (
                  <View style={styles.infoRow}>
                    <Icon name="check" size={18} color="#4caf50" />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Revisado: {new Date(selectedReport.reviewed_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {selectedReport.reviewedBy && (
                  <View style={styles.infoRow}>
                    <Icon name="shield-account" size={18} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Por: {selectedReport.reviewedBy?.name}
                    </Text>
                  </View>
                )}

                {selectedReport.admin_response ? (
                  <View style={styles.infoRow}>
                    <Icon name="comment-text" size={18} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.text }]}>
                      Respuesta: {selectedReport.admin_response}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              {selectedReport.status === 'pendiente' && (
                <View style={styles.actionButtonsContainer}>
                  <View style={[styles.infoSection, { backgroundColor: colors.card, flex: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Resolver</Text>

                    <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Estado</Text>
                    <View style={styles.pillsRow}>
                      <TouchableOpacity
                        onPress={() => setResolveStatus('resuelto')}
                        style={[styles.pill, { borderColor: colors.border, backgroundColor: resolveStatus === 'resuelto' ? colors.primary : 'transparent' }]}
                      >
                        <Text style={[styles.pillText, { color: resolveStatus === 'resuelto' ? '#fff' : colors.text }]}>
                          Resuelto
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setResolveStatus('rechazado');
                          setResolveAction('none');
                        }}
                        style={[styles.pill, { borderColor: colors.border, backgroundColor: resolveStatus === 'rechazado' ? colors.primary : 'transparent' }]}
                      >
                        <Text style={[styles.pillText, { color: resolveStatus === 'rechazado' ? '#fff' : colors.text }]}>
                          Rechazado
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.smallLabel, { color: colors.textSecondary, marginTop: 10 }]}>Acción</Text>
                    <View style={styles.pillsRow}>
                      {getAvailableActions(selectedReport).map((a) => (
                        <TouchableOpacity
                          key={a.value}
                          onPress={() => setResolveAction(a.value)}
                          disabled={resolveStatus !== 'resuelto'}
                          style={[
                            styles.pill,
                            {
                              borderColor: colors.border,
                              backgroundColor: resolveAction === a.value ? colors.primary : 'transparent',
                              opacity: resolveStatus === 'resuelto' ? 1 : 0.5,
                            },
                          ]}
                        >
                          <Text style={[styles.pillText, { color: resolveAction === a.value ? '#fff' : colors.text }]}>
                            {a.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.smallLabel, { color: colors.textSecondary, marginTop: 10 }]}>Mensaje de moderación</Text>
                    <TextInput
                      value={adminResponse}
                      onChangeText={(t) => {
                        setAdminResponseTouched(true);
                        setAdminResponse(t);
                      }}
                      placeholder="Ej: Se revisó el reporte. Evita este comportamiento en el futuro..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      style={[styles.responseInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    />

                    <TouchableOpacity
                      style={[styles.applyButton, { backgroundColor: colors.primary, opacity: resolving ? 0.6 : 1 }]}
                      onPress={submitResolve}
                      disabled={resolving}
                    >
                      {resolving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.applyButtonText}>Aplicar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
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
  listMetaRow: {
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
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  reportCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reporterText: {
    fontSize: 12,
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  reportDate: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  typePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 12,
  },
  statusBadgeLarge: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTextLarge: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  infoSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewRecetaButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecetaText: {
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  responseInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  applyButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
