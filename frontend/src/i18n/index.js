import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';

// Get stored language or default to 'en'
const getStoredLanguage = () => {
  return localStorage.getItem('preferred_language') || 'en';
};

// Get stored currency or default to 'USD'
const getStoredCurrency = () => {
  return localStorage.getItem('preferred_currency') || 'USD';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

// Language change handler
export const changeLanguage = async (languageCode) => {
  await i18n.changeLanguage(languageCode);
  localStorage.setItem('preferred_language', languageCode);
  document.documentElement.dir = getDirection(languageCode);
  document.documentElement.lang = languageCode;
};

// Get text direction for language
export const getDirection = (languageCode) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
};

// Supported languages configuration
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' }
];

// Currency configuration
export const supportedCurrencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' }
];

// Currency formatting utility
export const formatCurrency = (amount, currencyCode = 'USD') => {
  const currency = supportedCurrencies.find(c => c.code === currencyCode);
  if (!currency) {
    return `$${amount.toFixed(2)}`;
  }
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
};

// Date formatting utility
export const formatDate = (date, options = {}, languageCode = null) => {
  const lang = languageCode || i18n.language;
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
  
  return new Intl.DateTimeFormat(localeMap[lang] || 'en-US', {
    dateStyle: 'medium',
    ...options
  }).format(new Date(date));
};

// Number formatting utility
export const formatNumber = (number, languageCode = null) => {
  const lang = languageCode || i18n.language;
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
  
  return new Intl.NumberFormat(localeMap[lang] || 'en-US').format(number);
};

// Relative time formatting
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  if (diffInSeconds < 60) {
    return i18n.t('time.just_now');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return i18n.t('time.minutes_ago', { count: diffInMinutes });
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return i18n.t('time.hours_ago', { count: diffInHours });
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return i18n.t('time.days_ago', { count: diffInDays });
};

// ============================================
// TIMEZONE UTILITIES
// ============================================

// Detect user's timezone automatically
export const detectUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return 'UTC';
  }
};

// Get timezone offset
export const getTimezoneOffset = (timezone) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || '';
  } catch {
    return '';
  }
};

// Format time for specific timezone
export const formatTimeForTimezone = (date, timezone, locale = null) => {
  try {
    const targetLocale = locale || getLocaleForLanguage(i18n.language);
    return new Intl.DateTimeFormat(targetLocale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      dateStyle: 'medium'
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
};

// Get locale string for a language
export const getLocaleForLanguage = (languageCode) => {
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
  return localeMap[languageCode] || 'en-US';
};

// Country to locale mapping
export const countryLocaleMap = {
  'US': { timezone: 'America/New_York', currency: 'USD', locale: 'en-US', language: 'en' },
  'GB': { timezone: 'Europe/London', currency: 'GBP', locale: 'en-GB', language: 'en' },
  'IN': { timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN', language: 'en' },
  'JP': { timezone: 'Asia/Tokyo', currency: 'JPY', locale: 'ja-JP', language: 'ja' },
  'CN': { timezone: 'Asia/Shanghai', currency: 'CNY', locale: 'zh-CN', language: 'zh' },
  'DE': { timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', language: 'de' },
  'BR': { timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR', language: 'pt' },
  'MX': { timezone: 'America/Mexico_City', currency: 'MXN', locale: 'es-MX', language: 'es' },
  'FR': { timezone: 'Europe/Paris', currency: 'EUR', locale: 'fr-FR', language: 'fr' },
  'ES': { timezone: 'Europe/Madrid', currency: 'EUR', locale: 'es-ES', language: 'es' },
  'IT': { timezone: 'Europe/Rome', currency: 'EUR', locale: 'it-IT', language: 'it' },
  'NL': { timezone: 'Europe/Amsterdam', currency: 'EUR', locale: 'nl-NL', language: 'nl' },
  'AU': { timezone: 'Australia/Sydney', currency: 'AUD', locale: 'en-AU', language: 'en' },
  'CA': { timezone: 'America/Toronto', currency: 'CAD', locale: 'en-CA', language: 'en' }
};

// Apply all regional settings from country
export const applyRegionalSettings = (countryCode) => {
  const settings = countryLocaleMap[countryCode];
  if (settings) {
    changeLanguage(settings.language);
    setPreferredCurrency(settings.currency);
    localStorage.setItem('preferred_timezone', settings.timezone);
    localStorage.setItem('preferred_locale', settings.locale);
  }
  return settings;
};

// Timezone preference management
export const setPreferredTimezone = (timezone) => {
  localStorage.setItem('preferred_timezone', timezone);
};

export const getPreferredTimezone = () => {
  return localStorage.getItem('preferred_timezone') || detectUserTimezone();
};

// Currency preference management
export const setPreferredCurrency = (currencyCode) => {
  localStorage.setItem('preferred_currency', currencyCode);
};

export const getPreferredCurrency = () => {
  return localStorage.getItem('preferred_currency') || 'USD';
};

export { getStoredLanguage, getStoredCurrency };

export default i18n;
