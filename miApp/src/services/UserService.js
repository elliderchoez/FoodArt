import apiClient from './apiClient';

class UserService {
  // ========== PERFIL Y SEGURIDAD ==========

  static async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    });
    return response.data;
  }

  static async deleteAccount(password) {
    const response = await apiClient.post('/user/delete-account', {
      password,
      confirmation: 'delete',
    });
    return response.data;
  }

  // ========== RECUPERAR CONTRASEÑA ==========

  static async requestPasswordReset(email) {
    const response = await apiClient.post('/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(email, token, newPassword) {
    const response = await apiClient.post('/reset-password', {
      email,
      token,
      password: newPassword,
      password_confirmation: newPassword,
    });
    return response.data;
  }

  // ========== CATEGORÍAS DE RECETAS ==========

  static async guardarRecetaEnCategoria(recetaId, nombre, descripcion = '') {
    const response = await apiClient.post(`/recetas/${recetaId}/categorizar`, {
      nombre,
      descripcion,
    });
    return response.data;
  }

  static async obtenerRecetasCategorias() {
    const response = await apiClient.get('/user/recetas-categorias');
    return response.data;
  }

  static async actualizarCategoria(categoriaId, nombre, descripcion) {
    const response = await apiClient.put(`/receta-categorias/${categoriaId}`, {
      nombre,
      descripcion,
    });
    return response.data;
  }

  static async eliminarCategoria(categoriaId) {
    const response = await apiClient.delete(`/receta-categorias/${categoriaId}`);
    return response.data;
  }

  // ========== RESEÑAS ==========

  static async crearOEditarResena(recetaId, calificacion, texto = '') {
    const response = await apiClient.post(`/recetas/${recetaId}/resenas`, {
      calificacion,
      texto,
    });
    return response.data;
  }

  static async obtenerResenas(recetaId, page = 1) {
    const response = await apiClient.get(`/recetas/${recetaId}/resenas?page=${page}`);
    return response.data;
  }

  static async eliminarResena(resenaId) {
    const response = await apiClient.delete(`/resenas/${resenaId}`);
    return response.data;
  }

  // ========== MENSAJERÍA ==========

  static async enviarMensaje(destinatarioId, contenido) {
    const response = await apiClient.post('/mensajes', {
      destinatario_id: destinatarioId,
      contenido,
    });
    return response.data;
  }

  static async obtenerConversacion(usuarioId, page = 1) {
    const response = await apiClient.get(`/mensajes/${usuarioId}?page=${page}`);
    return response.data;
  }

  static async obtenerConversaciones() {
    const response = await apiClient.get('/conversaciones');
    return response.data;
  }

  static async obtenerMensajesSinLeer() {
    const response = await apiClient.get('/mensajes/sin-leer/count');
    return response.data;
  }

  // ========== FILTROS AVANZADOS ==========

  static async filtrarRecetas(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.dificultad) params.append('dificultad', filtros.dificultad);
    if (filtros.tiempoMax) params.append('tiempo_max', filtros.tiempoMax);
    if (filtros.dieta) params.append('dieta', filtros.dieta);
    if (filtros.ingredientes && Array.isArray(filtros.ingredientes)) {
      filtros.ingredientes.forEach(ing => params.append('ingredientes[]', ing));
    }

    const response = await apiClient.get(`/recetas/filtrar/avanzado?${params}`);
    return response.data;
  }
}

export { UserService };
