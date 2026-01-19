import apiClient from './apiClient';

class ReportService {
  static async reportReceta(recetaId, reason, description = '') {
    const response = await apiClient.post(`/reports/recetas/${recetaId}`, {
      reason,
      description: description?.trim() ? description.trim() : null,
    });
    return response.data;
  }

  static async reportUsuario(userId, reason, description = '') {
    const response = await apiClient.post(`/reports/usuarios/${userId}`, {
      reason,
      description: description?.trim() ? description.trim() : null,
    });
    return response.data;
  }
}

export { ReportService };
