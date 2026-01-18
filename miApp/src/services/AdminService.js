import apiClient from './apiClient';

class AdminService {
  // ========== USUARIOS ==========

  static async getUsuarios(page = 1, search = '', role = '', blocked = null) {
    const params = new URLSearchParams({
      page,
      ...(search && { search }),
      ...(role && { role }),
      ...(blocked !== null && { blocked }),
    });

    const response = await apiClient.get(`/admin/usuarios?${params}`);
    return response.data;
  }

  static async createUsuario(data) {
    const response = await apiClient.post('/admin/usuarios', data);
    return response.data;
  }

  static async updateUsuario(userId, data) {
    const response = await apiClient.put(`/admin/usuarios/${userId}`, data);
    return response.data;
  }

  static async blockUsuario(userId, reason) {
    const response = await apiClient.post(`/admin/usuarios/${userId}/block`, { reason });
    return response.data;
  }

  static async unblockUsuario(userId) {
    const response = await apiClient.post(`/admin/usuarios/${userId}/unblock`);
    return response.data;
  }

  static async deleteUsuario(userId) {
    const response = await apiClient.delete(`/admin/usuarios/${userId}`);
    return response.data;
  }

  static async resetPassword(userId, password) {
    const response = await apiClient.post(`/admin/usuarios/${userId}/reset-password`, { password });
    return response.data;
  }

  // ========== RECETAS ==========

  static async getRecetas(page = 1, search = '', blocked = null) {
    const params = new URLSearchParams({
      page,
    });

    if (search) {
      params.append('search', search);
    }

    if (blocked !== null) {
      params.append('blocked', blocked ? 1 : 0);
    }

    const response = await apiClient.get(`/admin/recetas?${params}`);
    return response.data;
  }

  static async updateReceta(recetaId, data) {
    const response = await apiClient.put(`/admin/recetas/${recetaId}`, data);
    return response.data;
  }

  static async deleteReceta(recetaId) {
    const response = await apiClient.delete(`/admin/recetas/${recetaId}`);
    return response.data;
  }

  static async blockReceta(recetaId, reason) {
    const response = await apiClient.post(`/admin/recetas/${recetaId}/block`, { reason });
    return response.data;
  }

  static async unblockReceta(recetaId) {
    const response = await apiClient.post(`/admin/recetas/${recetaId}/unblock`);
    return response.data;
  }

  static async toggleBlockReceta(recetaId, blocked) {
    if (blocked) {
      return this.blockReceta(recetaId, 'Bloqueada por admin');
    } else {
      return this.unblockReceta(recetaId);
    }
  }

  // ========== REPORTES ==========

  static async getReports(page = 1, status = '') {
    const params = new URLSearchParams({
      page,
      ...(status && { status }),
    });

    const response = await apiClient.get(`/admin/reports?${params}`);
    return response.data;
  }

  static async createReport(data) {
    const response = await apiClient.post('/admin/reports', data);
    return response.data;
  }

  static async resolveReport(reportId, data) {
    const response = await apiClient.put(`/admin/reports/${reportId}`, data);
    return response.data;
  }

  // ========== LOGS ==========

  static async getLogs(page = 1, filters = '') {
    const params = new URLSearchParams({
      page,
    });

    // Map filter names to entity types
    if (filters && filters !== 'todos') {
      let entityType = '';
      switch (filters) {
        case 'usuarios':
          entityType = 'User';
          break;
        case 'recetas':
          entityType = 'Receta';
          break;
        case 'sistema':
          entityType = 'System';
          break;
        default:
          entityType = '';
      }
      if (entityType) {
        params.append('entity_type', entityType);
      }
    }

    const response = await apiClient.get(`/admin/logs?${params}`);
    return response.data;
  }

  // ========== PARÁMETROS ==========

  static async getParameters() {
    const response = await apiClient.get('/admin/parameters');
    return response.data;
  }

  static async createParameter(data) {
    const response = await apiClient.post('/admin/parameters', data);
    return response.data;
  }

  static async updateParameter(parameterId, data) {
    const response = await apiClient.put(`/admin/parameters/${parameterId}`, { valor: data });
    return response.data;
  }

  // ========== BACKUPS ==========

  static async createBackup() {
    const response = await apiClient.post('/admin/backup/create');
    return response.data;
  }

  static async listBackups() {
    const response = await apiClient.get('/admin/backup/list');
    return response.data;
  }

  // ========== ESTADÍSTICAS ==========

  static async getStatistics() {
    const response = await apiClient.get('/admin/statistics');
    return response.data;
  }
}

export { AdminService };
