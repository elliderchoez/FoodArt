# 📱 FUNCIONALIDADES DE USUARIO NORMAL - FOODART

## ✅ IMPLEMENTADAS (Backend + Rutas API)

### 1. **Eliminar Receta Propia** ✅
- Ya existe en `RecetaController::destroy()`
- Ruta: `DELETE /api/recetas/{id}`
- Solo el propietario puede eliminar

### 2. **Editar Receta Propia** ✅
- Ya existe en `RecetaController::update()`
- Ruta: `PUT /api/recetas/{id}`
- Solo el propietario puede editar

### 3. **Cambiar Contraseña** ✅
- Método: `UserController::changePassword()`
- Ruta: `POST /api/user/change-password`
- Requiere: contraseña actual + nueva contraseña confirmada
- Respuesta: Éxito o error si contraseña actual es incorrecta

### 4. **Eliminar Cuenta** ✅
- Método: `UserController::deleteAccount()`
- Ruta: `POST /api/user/delete-account`
- Requiere: contraseña + confirmación
- Elimina: Usuario, todos sus tokens, datos relacionados

### 5. **Recuperar Contraseña** ✅
- **Paso 1**: Solicitar restablecimiento
  - Método: `AuthController::requestPasswordReset()`
  - Ruta: `POST /api/forgot-password`
  - Requiere: email
  - Genera: token con validez de 1 hora
  
- **Paso 2**: Resetear con token
  - Método: `AuthController::resetPassword()`
  - Ruta: `POST /api/reset-password`
  - Requiere: email + token + nueva contraseña

### 6. **Validación de Email** ✅
- Nuevos campos en tabla `users`:
  - `email_verified` (boolean)
  - `email_verification_token` (string)
- Base para sistema de confirmación (implementar envío de email después)

### 7. **Guardar Recetas en Categorías** ✅
- Tabla: `receta_categorias`
- Métodos:
  - Crear: `POST /api/recetas/{id}/categorizar`
  - Listar: `GET /api/user/recetas-categorias`
  - Editar: `PUT /api/receta-categorias/{id}`
  - Eliminar: `DELETE /api/receta-categorias/{id}`
- Permite organizar favoritos por categorías personalizadas

### 8. **Reseñas Detalladas** ✅
- Tabla: `resenas`
- Campos: calificación (1-5) + texto (hasta 1000 caracteres)
- Métodos:
  - Crear/Editar: `POST /api/recetas/{id}/resenas`
  - Obtener: `GET /api/recetas/{id}/resenas`
  - Eliminar: `DELETE /api/resenas/{id}`
- Una reseña por usuario por receta

### 9. **Chat y Mensajería** ✅
- Tabla: `mensajes`
- Campos: remitente, destinatario, contenido, leído, fecha
- Métodos:
  - Enviar: `POST /api/mensajes`
  - Obtener conversación: `GET /api/mensajes/{usuarioId}`
  - Listar conversaciones: `GET /api/conversaciones`
  - Contar sin leer: `GET /api/mensajes/sin-leer/count`
- Marca automáticamente como leídos

### 10. **Filtros Avanzados** ✅
- Ruta: `GET /api/recetas/filtrar/avanzado`
- Parámetros:
  - `dificultad`: Fácil, Media, Difícil
  - `tiempo_max`: Máximo de minutos de preparación
  - `ingredientes[]`: Array de ingredientes a filtrar
  - `dieta`: Tipo de dieta
- Retorna recetas paginadas

---

## 📡 RUTAS API NUEVAS/ACTUALIZADAS

### Autenticación
```
POST   /api/forgot-password           - Solicitar reset de contraseña
POST   /api/reset-password            - Resetear contraseña con token
```

### Perfil y Seguridad
```
POST   /api/user/change-password       - Cambiar contraseña
POST   /api/user/delete-account        - Eliminar cuenta
```

### Categorías de Recetas
```
POST   /api/recetas/{id}/categorizar   - Guardar en categoría
GET    /api/user/recetas-categorias    - Obtener todas las categorías
PUT    /api/receta-categorias/{id}     - Actualizar categoría
DELETE /api/receta-categorias/{id}     - Eliminar categoría
```

### Reseñas
```
POST   /api/recetas/{id}/resenas       - Crear/editar reseña
GET    /api/recetas/{id}/resenas       - Obtener reseñas
DELETE /api/resenas/{id}               - Eliminar reseña
```

### Mensajería
```
POST   /api/mensajes                   - Enviar mensaje
GET    /api/mensajes/{usuarioId}       - Obtener conversación
GET    /api/conversaciones             - Listar conversaciones
GET    /api/mensajes/sin-leer/count   - Contar sin leer
```

### Filtros
```
GET    /api/recetas/filtrar/avanzado   - Filtrar recetas
```

---

## 🗄️ MIGRACIONES EJECUTADAS

```
✅ 2026_01_17_add_email_verification_fields
✅ 2026_01_17_create_receta_categorias_table
✅ 2026_01_17_create_resenas_table
✅ 2026_01_17_create_mensajes_table
```

---

## 📱 SERVICIOS FRONTEND

Creado: `miApp/src/services/UserService.js`

### Métodos Disponibles
```javascript
// Seguridad
UserService.changePassword(oldPass, newPass)
UserService.deleteAccount(password)

// Recuperar contraseña
UserService.requestPasswordReset(email)
UserService.resetPassword(email, token, newPassword)

// Categorías
UserService.guardarRecetaEnCategoria(recetaId, nombre, desc)
UserService.obtenerRecetasCategorias()
UserService.actualizarCategoria(catId, nombre, desc)
UserService.eliminarCategoria(catId)

// Reseñas
UserService.crearOEditarResena(recetaId, calificacion, texto)
UserService.obtenerResenas(recetaId, page)
UserService.eliminarResena(resenaId)

// Mensajería
UserService.enviarMensaje(destId, contenido)
UserService.obtenerConversacion(userId, page)
UserService.obtenerConversaciones()
UserService.obtenerMensajesSinLeer()

// Filtros
UserService.filtrarRecetas(filtros)
```

---

## 🎯 PRÓXIMAS PANTALLAS PARA IMPLEMENTAR EN FRONTEND

Para completar, necesitas crear las pantallas UI:

1. **CambiarContrasenaScreen** - Para cambiar contraseña desde perfil
2. **OlvidarContrasenaScreen** - Para recuperar contraseña
3. **ConfirmarEliminarCuentaScreen** - Para eliminar cuenta
4. **CategoriasScreen** - Para ver/gestionar categorías
5. **ResenasScreen** - Para ver reseñas de una receta
6. **ChatScreen** - Para mensajería
7. **FiltrosAvanzadosScreen** - Para filtros de búsqueda

---

## ⚠️ NOTAS IMPORTANTES

1. **Reset de Contraseña**: El token es válido por 1 hora
2. **Mensajes**: Se marcan automáticamente como leídos al obtener la conversación
3. **Reseñas**: Un usuario solo puede tener una reseña por receta (se actualiza)
4. **Categorías**: Las recetas pueden estar en múltiples categorías
5. **Filtros**: Retorna con paginación (15 por página)

---

## 🔧 PASOS FINALES

1. Crear las pantallas UI en frontend
2. Integrar `UserService` en los componentes
3. Agregar validaciones de formularios
4. Implementar paginación infinita en HomeScreen
5. Agregar indicadores de carga
6. Implementar manejo de errores

¿Quieres que empiece a crear las pantallas del frontend?
