import { Share, Linking } from 'react-native';

/**
 * Servicio para compartir recetas en redes sociales
 */
export const SharingService = {
  /**
   * Compartir receta con el Share API nativo
   */
  compartirReceta: async (receta) => {
    try {
      const titulo = receta.titulo || 'Mi receta';
      const mensaje = `🍽️ *${titulo}*\n\n${receta.descripcion || ''}\n\n⏱️ Tiempo: ${receta.tiempo_preparacion}min\n👥 Porciones: ${receta.porciones}`;

      await Share.share({
        message: mensaje,
        title: titulo,
        url: receta.imagen || undefined,
      });
    } catch (error) {
      console.error('Error compartiendo:', error);
      throw error;
    }
  },

  /**
   * Compartir a WhatsApp
   */
  compartirWhatsApp: async (receta) => {
    try {
      const titulo = receta.titulo || 'Mi receta';
      const mensaje = `🍽️ *${titulo}*\n\n${receta.descripcion || ''}\n\n⏱️ Tiempo: ${receta.tiempo_preparacion}min\n👥 Porciones: ${receta.porciones}\n\n¡Pruébala en FoodArt!`;
      
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        throw new Error('WhatsApp no está instalado');
      }
    } catch (error) {
      console.error('Error compartiendo a WhatsApp:', error);
      throw error;
    }
  },

  /**
   * Compartir a Facebook
   */
  compartirFacebook: async (receta) => {
    try {
      const titulo = receta.titulo || 'Mi receta';
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://foodart.app&quote=${encodeURIComponent(titulo)}`;
      
      const canOpen = await Linking.canOpenURL(facebookUrl);
      if (canOpen) {
        await Linking.openURL(facebookUrl);
      } else {
        throw new Error('No se puede abrir Facebook');
      }
    } catch (error) {
      console.error('Error compartiendo a Facebook:', error);
      throw error;
    }
  },

  /**
   * Compartir a Instagram
   */
  compartirInstagram: async (receta) => {
    try {
      // Instagram web
      const instagramUrl = `https://www.instagram.com/`;
      
      const canOpen = await Linking.canOpenURL(instagramUrl);
      if (canOpen) {
        await Linking.openURL(instagramUrl);
      } else {
        throw new Error('Instagram no está disponible');
      }
    } catch (error) {
      console.error('Error compartiendo a Instagram:', error);
      throw error;
    }
  },

  /**
   * Copiar enlace de receta
   */
  copiarEnlace: async (receta) => {
    try {
      const enlace = `https://foodart.app/receta/${receta.id}`;
      
      // En React Native, simulamos copiar al portapapeles
      return enlace;
    } catch (error) {
      console.error('Error copiando enlace:', error);
      throw error;
    }
  },

  /**
   * Enviar por correo
   */
  compartirCorreo: async (receta) => {
    try {
      const titulo = receta.titulo || 'Mi receta';
      const asunto = `Te comparto esta receta: ${titulo}`;
      const body = `
Hola,

Te comparto esta deliciosa receta:

🍽️ ${titulo}

${receta.descripcion || ''}

⏱️ Tiempo de preparación: ${receta.tiempo_preparacion} minutos
👥 Porciones: ${receta.porciones}

¡Descárgalo en FoodArt!
      `.trim();

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(body)}`;
      
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error('Error compartiendo por correo:', error);
      throw error;
    }
  },
};
