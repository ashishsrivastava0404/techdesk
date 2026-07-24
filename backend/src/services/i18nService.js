/**
 * i18n Service
 * Handles internationalization for backend messages and templates
 */

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
];

// Email templates with translations
export const EMAIL_TEMPLATES = {
  ticket_created: {
    subject: {
      en: 'New Ticket #{ticket_id} Created',
      es: 'Ticket #{ticket_id} Creado'
    },
    body: {
      en: `
        <h1>Hello {customer_name},</h1>
        <p>Your support ticket has been successfully created.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Subject:</strong> {ticket_subject}</p>
          <p><strong>Priority:</strong> {ticket_priority}</p>
          <p><strong>Category:</strong> {ticket_category}</p>
        </div>
        
        <p>Our support team will review your ticket and get back to you as soon as possible.</p>
        
        <p>You can track your ticket status by logging into your account.</p>
        
        <p>Best regards,<br>{app_name} Support Team</p>
      `,
      es: `
        <h1>Hola {customer_name},</h1>
        <p>Tu ticket de soporte ha sido creado exitosamente.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Asunto:</strong> {ticket_subject}</p>
          <p><strong>Prioridad:</strong> {ticket_priority_es}</p>
          <p><strong>Categoría:</strong> {ticket_category}</p>
        </div>
        
        <p>Nuestro equipo de soporte revisará tu ticket y te responderá lo antes posible.</p>
        
        <p>Puedes seguir el estado de tu ticket iniciando sesión en tu cuenta.</p>
        
        <p>Saludos cordiales,<br>Equipo de Soporte de {app_name}</p>
      `
    }
  },
  
  ticket_assigned: {
    subject: {
      en: 'Ticket #{ticket_id} Assigned to {tech_name}',
      es: 'Ticket #{ticket_id} Asignado a {tech_name}'
    },
    body: {
      en: `
        <h1>Hello {customer_name},</h1>
        <p>Great news! Your ticket has been assigned to a support technician.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Assigned to:</strong> {tech_name}</p>
        </div>
        
        <p>{tech_name} will be working on resolving your issue. You can message them directly through the support portal.</p>
        
        <p>Best regards,<br>{app_name} Support Team</p>
      `,
      es: `
        <h1>Hola {customer_name},</h1>
        <p>¡Buenas noticias! Tu ticket ha sido asignado a un técnico de soporte.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Asignado a:</strong> {tech_name}</p>
        </div>
        
        <p>{tech_name} estará trabajando para resolver tu problema. Puedes enviarle mensajes directamente a través del portal de soporte.</p>
        
        <p>Saludos cordiales,<br>Equipo de Soporte de {app_name}</p>
      `
    }
  },
  
  ticket_resolved: {
    subject: {
      en: 'Ticket #{ticket_id} Resolved',
      es: 'Ticket #{ticket_id} Resuelto'
    },
    body: {
      en: `
        <h1>Hello {customer_name},</h1>
        <p>Your support ticket has been marked as resolved.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Resolution:</strong> {resolution}</p>
        </div>
        
        <p>If you have any additional questions or the issue persists, please don't hesitate to reopen the ticket.</p>
        
        <p>Thank you for using {app_name}!</p>
        
        <p>Best regards,<br>{app_name} Support Team</p>
      `,
      es: `
        <h1>Hola {customer_name},</h1>
        <p>Tu ticket de soporte ha sido marcado como resuelto.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Resolución:</strong> {resolution}</p>
        </div>
        
        <p>Si tienes alguna pregunta adicional o el problema persiste, no dudes en reabrir el ticket.</p>
        
        <p>¡Gracias por usar {app_name}!</p>
        
        <p>Saludos cordiales,<br>Equipo de Soporte de {app_name}</p>
      `
    }
  },
  
  new_message: {
    subject: {
      en: 'New message regarding Ticket #{ticket_id}',
      es: 'Nuevo mensaje relacionado al Ticket #{ticket_id}'
    },
    body: {
      en: `
        <h1>New Message</h1>
        <p>You have received a new message regarding your support ticket.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>From:</strong> {sender_name}</p>
          <p><strong>Ticket:</strong> #{ticket_id}</p>
          <p><strong>Message:</strong></p>
          <p>{message_content}</p>
        </div>
        
        <p>Log in to your account to reply.</p>
      `,
      es: `
        <h1>Nuevo Mensaje</h1>
        <p>Has recibido un nuevo mensaje relacionado a tu ticket de soporte.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>De:</strong> {sender_name}</p>
          <p><strong>Ticket:</strong> #{ticket_id}</p>
          <p><strong>Mensaje:</strong></p>
          <p>{message_content}</p>
        </div>
        
        <p>Inicia sesión en tu cuenta para responder.</p>
      `
    }
  }
};

// Priority translations
export const PRIORITY_TRANSLATIONS = {
  low: { en: 'Low', es: 'Baja' },
  normal: { en: 'Normal', es: 'Normal' },
  high: { en: 'High', es: 'Alta' },
  urgent: { en: 'Urgent', es: 'Urgente' },
  critical: { en: 'Critical', es: 'Crítica' }
};

export const i18nService = {
  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  },

  /**
   * Get user's preferred language
   */
  async getUserLanguage(userId, db) {
    try {
      const [rows] = await db.execute(
        'SELECT preferred_language FROM users WHERE id = ?',
        [userId]
      );
      return rows[0]?.preferred_language || 'en';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en';
    }
  },

  /**
   * Set user's preferred language
   */
  async setUserLanguage(userId, languageCode, db) {
    try {
      await db.execute(
        'UPDATE users SET preferred_language = ? WHERE id = ?',
        [languageCode, userId]
      );
      return true;
    } catch (error) {
      console.error('Error setting user language:', error);
      return false;
    }
  },

  /**
   * Get translated email template
   */
  getEmailTemplate(templateKey, language = 'en', variables = {}) {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Get subject and body for the requested language, fall back to English
    const subject = template.subject[language] || template.subject.en;
    const body = template.body[language] || template.body.en;

    // Replace variables
    let processedSubject = subject;
    let processedBody = body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{${key}}`, 'g');
      processedSubject = processedSubject.replace(placeholder, value);
      processedBody = processedBody.replace(placeholder, value);
    }

    return { subject: processedSubject, body: processedBody };
  },

  /**
   * Translate priority
   */
  translatePriority(priority, language = 'en') {
    const translation = PRIORITY_TRANSLATIONS[priority?.toLowerCase()];
    if (!translation) return priority;
    return translation[language] || translation.en || priority;
  },

  /**
   * Format date for locale
   */
  formatDate(date, language = 'en') {
    const localeMap = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      pt: 'pt-BR',
      zh: 'zh-CN',
      hi: 'hi-IN',
      ja: 'ja-JP',
      ar: 'ar-SA'
    };

    return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  },

  /**
   * Check if language is RTL
   */
  isRTL(languageCode) {
    return ['ar', 'he', 'fa', 'ur'].includes(languageCode);
  }
};

export default i18nService;
