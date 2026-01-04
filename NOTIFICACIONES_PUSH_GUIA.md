# 🔔 Guía de Notificaciones Push - FoodArt

## ¿Cómo funcionan las notificaciones push?

Las notificaciones push permiten que tu aplicación envíe mensajes al dispositivo del usuario **incluso cuando la aplicación está cerrada o en background**.

## 📋 Requisitos

### 1. Proyecto Expo configurado ✅
```json
{
  "expo": {
    "projectId": "foodart-notifications"
  }
}
```

### 2. Token de Push del Dispositivo

Cuando el usuario inicia sesión, la app automáticamente:
1. Solicita permisos de notificaciones
2. Obtiene el token de Expo Push
3. Envía el token al backend

## 🚀 Cómo probar las notificaciones

### Opción 1: Botón de Prueba en la App (RECOMENDADO)

1. **Abre la app y inicia sesión**
2. **Ve a tu perfil** (icono de usuario en la esquina inferior derecha)
3. **Haz clic en "Probar notificación"**
4. **Verifica tu dispositivo** - deberías recibir una notificación en 3-5 segundos

### Opción 2: Prueba Manual con cURL

```bash
# 1. Obtén el token del dispositivo (verifica los logs de la app)
# Busca un log con formato: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx]"

# 2. Usa cURL para enviar una notificación
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[tu_token_aqui]",
    "title": "Test",
    "body": "Notificación de prueba",
    "badge": 1,
    "sound": "default"
  }'
```

## 📊 Flujo de Notificaciones

### Cuando alguien da LIKE a tu receta:

```
Usuario A da like → Backend (RecetaController)
    ↓
Se crea registro en BD (notifications table)
    ↓
Se obtiene el expo_push_token del Usuario B
    ↓
Se envía push via Expo API
    ↓
Usuario B recibe notificación en dispositivo ✅
    ↓
Se guarda en AlertasScreen para verla después
```

### Eventos que generan notificaciones:

| Evento | Quién recibe | Detalles |
|--------|-------------|---------|
| **Like** | Autor de la receta | "❤️ [Usuario] dio like" |
| **Comentario** | Autor de la receta | "💬 [Usuario] comentó" |
| **Seguir** | Usuario seguido | "👥 [Usuario] empezó a seguirte" |

## 🔍 Verificar que todo funciona

### 1. Ver el token registrado
```
📱 En la app: Abre DevTools → Console → Busca "Token de notificación:"
```

### 2. Ver logs del backend
```bash
# En la carpeta backend:
tail -f storage/logs/laravel.log | grep -i notif
```

Deberías ver logs como:
```
[2026-01-04] 📤 Enviando notificación Push a Expo...
[2026-01-04] ✅ Notificación enviada exitosamente a Expo
```

### 3. Verificar en la BD
```sql
-- Conecta a PostgreSQL y ejecuta:
SELECT * FROM notifications WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 5;
```

## ⚠️ Problemas Comunes

### ❌ "No tienes token registrado"
**Solución:** 
- Asegurate de haber iniciado sesión
- Verifica que los permisos de notificación fueron otorgados
- Revisa que `projectId` está correcto en `app.json`

### ❌ "Notificación no llega"
**Soluciones:**
1. Verifica logs: `tail -f storage/logs/laravel.log`
2. Abre la app y toca en "Probar notificación"
3. Asegúrate de que el dispositivo tiene conexión a internet
4. En iOS: Verifica Configuración → Notificaciones → FoodArt
5. En Android: Verifica Configuración → Aplicaciones → FoodArt → Notificaciones

### ❌ "Token inválido"
**Solución:** 
- El token puede expirar si cambias de dispositivo o actualizas la app
- La app automáticamente registra un nuevo token al iniciar sesión
- Si persiste, elimina la app y vuelve a instalar

### ❌ "Error 429" en logs
**Significa:** Enviando demasiadas notificaciones al servidor Expo
**Solución:** Reduce la frecuencia de pruebas o espera unos minutos

## 📲 Cómo se ve una notificación

### iOS
```
╔════════════════════════════╗
║ FOOD ART                   ║
║ ❤️ Bryan dio like         ║
║ Le gustó tu receta: P...   ║
╚════════════════════════════╝
```

### Android
```
┌─────────────────────────────┐
│ 🔔 FOOD ART                 │
│ ❤️ Bryan dio like           │
│ Le gustó tu receta: Pizza..│
└─────────────────────────────┘
```

## 🎯 Indicadores de éxito

✅ **Todo funciona correctamente cuando:**
- El botón "Probar notificación" muestra "Éxito"
- Recibes la notificación en tu dispositivo en 3-5 segundos
- Los logs del backend muestran "✅ Notificación enviada exitosamente"
- Las notificaciones aparecen en AlertasScreen

## 🔗 Links útiles

- [Documentación Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push API](https://docs.expo.dev/push-notifications/overview/)
- [Troubleshooting Guide](https://docs.expo.dev/push-notifications/troubleshooting/)

## 💡 Próximas mejoras (Opcional)

- [ ] Agrupar notificaciones similares
- [ ] Permitir que usuarios personaicen qué notificaciones reciben
- [ ] Enviar notificaciones en batches para no saturar
- [ ] Agregar sonidos personalizados por tipo de notificación

---

**¿Dudas?** Revisa los logs de la app y del backend para más detalles.
