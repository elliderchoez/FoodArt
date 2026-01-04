# 🔔 GUÍA COMPLETA DE NOTIFICACIONES - FoodArt

## ✅ ¿QUÉ SE IMPLEMENTÓ?

Un sistema completo de **notificaciones push** que notifica a los usuarios cuando:
- ❤️ **Alguien da like** a su receta
- 💬 **Alguien comenta** su receta  
- 👥 **Alguien empieza a seguirlo**

Las notificaciones aparecen en el teléfono y se guardan en la pantalla de Alertas.

---

## 🚀 PASO A PASO: CÓMO FUNCIONA

### 1️⃣ **Instalación (Solo ejecutar UNA VEZ)**

En la carpeta `miApp/`:
```bash
npx expo install expo-notifications
```

### 2️⃣ **Primera vez que inicias la app**

Al abrir FoodArt:
- ✅ Solicita permisos de notificaciones
- ✅ Obtiene un token único del dispositivo
- ✅ Guarda el token localmente

### 3️⃣ **Cuando inicias sesión**

1. Colocas tu email y contraseña
2. App realiza login
3. **Automáticamente** envía tu token de notificaciones al backend
4. Backend guarda tu token en la BD

### 4️⃣ **Cuando alguien interactúa contigo**

**Ejemplo: Te dan like**
```
Usuario A da like a tu receta
     ↓
Backend detecta el like
     ↓
Backend envía notificación push a tu token
     ↓
Tu teléfono recibe: "❤️ Juan dio like a: Pastel de chocolate"
     ↓
Se guarda en tu historial de Alertas
```

---

## 📱 PANTALLA DE ALERTAS

Abre la app → Toca el ícono 🔔 (Alertas)

**Verás:**
- Lista de todas tus notificaciones
- Ícono con color según el tipo (❤️ rojo, 💬 azul, 👥 verde)
- Fecha y hora
- Botón para eliminar
- Opción para "Limpiar todo"

**Tocar una alerta te lleva:**
- Si es like/comentario → Detalle de la receta
- Si es seguidor → Perfil del usuario

---

## 🔧 ARQUITECTURA TÉCNICA

### Frontend (miApp/)
```
App.js                           ← Inicializa notificaciones
  ├─ notificationService.js      ← Maneja permisos, tokens, almacenamiento
  ├─ LoginScreen.jsx             ← Registra token después de login
  └─ AlertasScreen.jsx           ← Muestra todas las notificaciones
```

### Backend (backend/)
```
routes/api.php
  ├─ /notifications/register-token    ← Guarda token del usuario
  └─ /notifications/send-test         ← Enviar notificación de prueba

Services/ExpoNotificationService.php  ← Lógica de envío
  ├─ notifyLike()
  ├─ notifyComment()
  └─ notifyFollow()

Controllers/
  ├─ RecetaController.php        ← Envía notificación cuando dan like
  ├─ ComentarioController.php    ← Envía notificación cuando comentan
  ├─ SeguidorController.php      ← Envía notificación cuando siguen
  └─ AuthController.php          ← Registra y envía notificaciones
```

### Base de Datos
```
users table
  ├─ id
  ├─ name
  ├─ email
  ├─ ... otros campos ...
  └─ expo_push_token    ← NUEVO: Token del dispositivo
```

---

## 🧪 CÓMO PROBAR

### Test 1: Dar Like
1. Crea una receta con Usuario A
2. Inicia sesión con Usuario B
3. Ve a la receta de Usuario A
4. Toca el ❤️
5. Usuario A debe recibir notificación: "❤️ Usuario B dio like"

### Test 2: Comentar
1. Usuario B comenta la receta de Usuario A
2. Usuario A recibe: "💬 Usuario B comentó: [vista previa]"

### Test 3: Seguir
1. Usuario B sigue a Usuario A
2. Usuario A recibe: "👥 Usuario B empezó a seguirte"

### Test 4: Verificar Historial
1. Usuario A abre pantalla Alertas
2. Ve todas las notificaciones en orden cronológico
3. Puede tocar para ir a la receta/usuario
4. Puede eliminar notificaciones

---

## ⚙️ ARCHIVOS CREADOS/MODIFICADOS

### ✅ Creados:
- `miApp/src/services/notificationService.js` - Servicio de notificaciones
- `backend/app/Services/ExpoNotificationService.php` - Envío de push
- `backend/database/migrations/2026_01_03_add_expo_push_token.php` - Nueva columna

### ✏️ Modificados:
- `miApp/App.js` - Inicializar notificaciones
- `miApp/src/screens/LoginScreen.jsx` - Registrar token
- `miApp/src/screens/AlertasScreen.jsx` - Mostrar notificaciones
- `backend/routes/api.php` - Nuevas rutas
- `backend/app/Http/Controllers/AuthController.php` - Registrar token
- `backend/app/Http/Controllers/RecetaController.php` - Notificar likes
- `backend/app/Http/Controllers/ComentarioController.php` - Notificar comentarios
- `backend/app/Http/Controllers/SeguidorController.php` - Notificar seguimiento
- `backend/app/Models/User.php` - Campo expo_push_token

---

## 🔑 FUNCIONES CLAVE

### Frontend

```javascript
// notificationService.js

// Solicitar permisos
requestNotificationPermissions()

// Obtener token del dispositivo
registerDeviceToken() → "ExponentPushToken[...]"

// Enviar notificación local (para pruebas)
sendLocalNotification({ title, body, data })

// Guardar en historial
saveNotificationToStorage(notification)

// Obtener todas las notificaciones
getStoredNotifications() → [...]

// Marcar como leída
markNotificationAsRead(id)

// Eliminar
deleteNotification(id)

// Contar no leídas
getUnreadCount() → número
```

### Backend

```php
// ExpoNotificationService.php

notifyLike($token, $userName, $recetaTitle, $recetaId)
notifyComment($token, $userName, $recetaTitle, $recetaId, $preview)
notifyFollow($token, $followerName, $followerId)
notifyNewRecipe($token, $authorName, $recetaTitle, $recetaId)
```

---

## 🚨 POSIBLES PROBLEMAS Y SOLUCIONES

### ❌ "No me llegan notificaciones"
**Solución:**
1. Verifica que hayas iniciado sesión
2. Abre App.js y verifica que `requestNotificationPermissions()` se ejecutó
3. En Settings del teléfono: Verifica que hayas dado permisos a FoodArt
4. Backend debe estar corriendo en `http://tuIP:8000`

### ❌ "El token no se registra"
**Solución:**
1. Verifica `LoginScreen.jsx` que llame a `registerDeviceToken()`
2. Ejecuta la migración: `php artisan migrate` en backend
3. Verifica que el usuario en la BD tiene `expo_push_token` no null

### ❌ "Migraciones no se ejecutan"
**Solución:**
```bash
cd backend
php artisan migrate:refresh --seed
```

---

## 📈 MEJORAS FUTURAS

- [ ] Notificaciones cuando se crea nueva receta de usuarios que sigues
- [ ] Desactivar notificaciones por tipo
- [ ] Notificaciones por email fallback
- [ ] Sonidos personalizados por tipo
- [ ] Agrupación de notificaciones ("10 personas dieron like")
- [ ] Deep linking más avanzado
- [ ] Analytics de notificaciones

---

## 📞 NOTAS IMPORTANTES

1. **Los tokens expiran**: Si un usuario desinstala/reinstala la app, obtiene nuevo token
2. **Almacenamiento local**: Las notificaciones se guardan en el dispositivo, no en BD
3. **Límite de notificaciones**: Se guardan máximo 50 (las más recientes)
4. **Expo Free Tier**: Permite envío de notificaciones sin límite
5. **Sin backend Expo**: Usamos Expo's API directamente desde nuestro backend

---

## ✨ ¡LISTO PARA USAR!

Todo está completamente funcional. Solo asegúrate de:
1. Ejecutar migrations en backend
2. Dar permisos de notificaciones en el teléfono
3. Iniciar sesión para registrar el token
4. Interactuar con otros usuarios para recibir notificaciones

**¡Disfruta del sistema de notificaciones! 🎉**
