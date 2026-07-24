/**
 * i18n Routes
 * Handles language and localization API endpoints
 */

import express from 'express';
import { i18nService } from '../services/i18nService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/i18n/languages
 * Get list of supported languages
 */
router.get('/languages', asyncHandler(async (req, res) => {
  const languages = i18nService.getSupportedLanguages();
  res.json({ languages });
}));

/**
 * GET /api/i18n/translations/:language
 * Get all translations for a specific language (for frontend caching)
 */
router.get('/translations/:language', asyncHandler(async (req, res) => {
  const { language } = req.params;
  const supportedLanguages = i18nService.getSupportedLanguages();
  
  // Check if language is supported
  const isSupported = supportedLanguages.some(l => l.code === language);
  if (!isSupported) {
    return res.status(400).json({ 
      error: 'Unsupported language',
      supported: supportedLanguages.map(l => l.code)
    });
  }

  // Return basic translations structure
  // In production, this would load from translation files
  const translations = {
    common: {
      app_name: 'TechDesk',
      welcome: language === 'es' ? 'Bienvenido' : 'Welcome',
      submit: language === 'es' ? 'Enviar' : 'Submit',
      cancel: language === 'es' ? 'Cancelar' : 'Cancel',
      save: language === 'es' ? 'Guardar' : 'Save'
    },
    nav: {
      dashboard: language === 'es' ? 'Tablero' : 'Dashboard',
      tickets: language === 'es' ? 'Tickets' : 'Tickets',
      settings: language === 'es' ? 'Configuración' : 'Settings'
    },
    tickets: {
      title: language === 'es' ? 'Tickets' : 'Tickets',
      priority: {
        low: language === 'es' ? 'Baja' : 'Low',
        normal: language === 'es' ? 'Normal' : 'Normal',
        high: language === 'es' ? 'Alta' : 'High',
        urgent: language === 'es' ? 'Urgente' : 'Urgent',
        critical: language === 'es' ? 'Crítica' : 'Critical'
      }
    }
  };

  res.json({ translations, language });
}));

/**
 * POST /api/i18n/user/preference
 * Set user's language preference
 */
router.post('/user/preference', asyncHandler(async (req, res) => {
  const { userId, language } = req.body;
  
  if (!userId || !language) {
    return res.status(400).json({ error: 'userId and language are required' });
  }

  const supportedLanguages = i18nService.getSupportedLanguages();
  const isSupported = supportedLanguages.some(l => l.code === language);
  
  if (!isSupported) {
    return res.status(400).json({ 
      error: 'Unsupported language',
      supported: supportedLanguages.map(l => l.code)
    });
  }

  await i18nService.setUserLanguage(userId, language, req.db);
  
  res.json({ success: true, language });
}));

/**
 * GET /api/i18n/user/preference/:userId
 * Get user's language preference
 */
router.get('/user/preference/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const language = await i18nService.getUserLanguage(userId, req.db);
  
  res.json({ userId, language });
}));

export default router;
