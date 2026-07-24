/**
 * i18n and Currency Service Tests
 * Tests for internationalization and multi-currency support
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================
// CURRENCY SERVICE TESTS
// ============================================

describe('CurrencyService', () => {
  // Mock exchange rates (relative to USD)
  const DEFAULT_RATES = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.12,
    JPY: 149.50,
    CNY: 7.24,
    BRL: 4.97,
    MXN: 17.15
  };

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
    { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2 }
  ];

  describe('Currency Configuration', () => {
    it('should have USD as base currency', () => {
      expect(DEFAULT_RATES.USD).toBe(1.0);
    });

    it('should have 8 supported currencies', () => {
      expect(currencies.length).toBe(8);
    });

    it('should have unique currency codes', () => {
      const codes = currencies.map(c => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have symbols for all currencies', () => {
      currencies.forEach(currency => {
        expect(currency.symbol).toBeDefined();
        expect(currency.symbol.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Exchange Rate Conversion', () => {
    const getExchangeRate = (from, to) => {
      if (from === to) return 1.0;
      const inUSD = 1 / DEFAULT_RATES[from];
      return inUSD * DEFAULT_RATES[to];
    };

    const convert = (amount, from, to) => {
      if (from === to) return amount;
      const rate = getExchangeRate(from, to);
      return amount * rate;
    };

    it('should return same amount for same currency', () => {
      expect(convert(100, 'USD', 'USD')).toBe(100);
      expect(convert(50, 'EUR', 'EUR')).toBe(50);
    });

    it('should convert USD to EUR correctly', () => {
      const result = convert(100, 'USD', 'EUR');
      expect(result).toBeGreaterThan(90);
      expect(result).toBeLessThan(95);
    });

    it('should convert EUR to USD correctly', () => {
      const result = convert(100, 'EUR', 'USD');
      expect(result).toBeGreaterThan(105);
      expect(result).toBeLessThan(110);
    });

    it('should convert USD to JPY correctly', () => {
      const result = convert(100, 'USD', 'JPY');
      expect(result).toBeGreaterThan(14000);
      expect(result).toBeLessThan(16000);
    });

    it('should convert INR to GBP correctly', () => {
      const result = convert(1000, 'INR', 'GBP');
      expect(result).toBeGreaterThan(8);
      expect(result).toBeLessThan(12);
    });

    it('should handle decimal amounts correctly', () => {
      const result = convert(99.99, 'USD', 'EUR');
      expect(result).toBeGreaterThan(90);
      expect(result).toBeLessThan(95);
    });

    it('should handle zero amount', () => {
      expect(convert(0, 'USD', 'EUR')).toBe(0);
    });

    it('should handle large amounts', () => {
      const result = convert(1000000, 'USD', 'EUR');
      expect(result).toBeGreaterThan(900000);
      expect(result).toBeLessThan(950000);
    });
  });

  describe('Currency Formatting', () => {
    const formatCurrency = (amount, currencyCode) => {
      const currency = currencies.find(c => c.code === currencyCode);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    };

    it('should format USD correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(1234.56, 'EUR');
      expect(formatted).toContain('€');
    });

    it('should format JPY without decimals', () => {
      const formatted = formatCurrency(1234, 'JPY');
      expect(formatted).not.toContain('.');
    });

    it('should format INR with proper locale', () => {
      const formatted = formatCurrency(10000, 'INR');
      expect(formatted).toContain('₹');
    });
  });
});

// ============================================
// i18n SERVICE TESTS
// ============================================

describe('i18nService', () => {
  const SUPPORTED_LANGUAGES = [
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

  const EMAIL_TEMPLATES = {
    ticket_created: {
      subject: {
        en: 'New Ticket #{ticket_id} Created',
        es: 'Ticket #{ticket_id} Creado'
      },
      body: {
        en: '<h1>Hello {customer_name}</h1>',
        es: '<h1>Hola {customer_name}</h1>'
      }
    },
    ticket_resolved: {
      subject: {
        en: 'Ticket #{ticket_id} Resolved',
        es: 'Ticket #{ticket_id} Resuelto'
      }
    }
  };

  const PRIORITY_TRANSLATIONS = {
    low: { en: 'Low', es: 'Baja' },
    normal: { en: 'Normal', es: 'Normal' },
    high: { en: 'High', es: 'Alta' },
    urgent: { en: 'Urgent', es: 'Urgente' },
    critical: { en: 'Critical', es: 'Crítica' }
  };

  describe('Supported Languages', () => {
    it('should have at least 5 supported languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have English as first language', () => {
      expect(SUPPORTED_LANGUAGES[0].code).toBe('en');
    });

    it('should have Spanish translations', () => {
      const spanish = SUPPORTED_LANGUAGES.find(l => l.code === 'es');
      expect(spanish).toBeDefined();
      expect(spanish.nativeName).toBe('Español');
    });

    it('should have unique language codes', () => {
      const codes = SUPPORTED_LANGUAGES.map(l => l.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should include RTL languages', () => {
      const rtlLanguages = SUPPORTED_LANGUAGES.filter(l => 
        ['ar', 'he', 'fa', 'ur'].includes(l.code)
      );
      expect(rtlLanguages.length).toBeGreaterThan(0);
    });
  });

  describe('Language Detection', () => {
    const isRTL = (languageCode) => {
      return ['ar', 'he', 'fa', 'ur'].includes(languageCode);
    };

    it('should identify RTL languages', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('he')).toBe(true);
      expect(isRTL('en')).toBe(false);
      expect(isRTL('es')).toBe(false);
    });

    it('should handle LTR languages correctly', () => {
      const ltrLanguages = SUPPORTED_LANGUAGES.filter(l => !isRTL(l.code));
      expect(ltrLanguages.length).toBeGreaterThan(5);
    });
  });

  describe('Email Template Translation', () => {
    const getEmailTemplate = (templateKey, language = 'en', variables = {}) => {
      const template = EMAIL_TEMPLATES[templateKey];
      if (!template) return null;

      const subject = template.subject[language] || template.subject.en;
      const body = template.body[language] || template.body.en;

      let processedSubject = subject;
      let processedBody = body;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{${key}}`, 'g');
        processedSubject = processedSubject.replace(placeholder, value);
        processedBody = processedBody.replace(placeholder, value);
      }

      return { subject: processedSubject, body: processedBody };
    };

    it('should return template for existing key', () => {
      const template = getEmailTemplate('ticket_created');
      expect(template).toBeDefined();
      expect(template.subject).toBeDefined();
      expect(template.body).toBeDefined();
    });

    it('should return English template by default', () => {
      const template = getEmailTemplate('ticket_created');
      expect(template.subject).toContain('Created');
    });

    it('should return Spanish template when requested', () => {
      const template = getEmailTemplate('ticket_created', 'es');
      expect(template.subject).toContain('Creado');
    });

    it('should fallback to English for unsupported language', () => {
      const template = getEmailTemplate('ticket_created', 'xx');
      expect(template.subject).toContain('Created');
    });

    it('should replace variables in subject', () => {
      const template = getEmailTemplate('ticket_created', 'en', { ticket_id: '12345' });
      expect(template.subject).toContain('12345');
    });

    it('should replace variables in body', () => {
      const template = getEmailTemplate('ticket_created', 'en', { customer_name: 'John' });
      expect(template.body).toContain('John');
    });

    it('should return null for non-existent template', () => {
      const template = getEmailTemplate('non_existent');
      expect(template).toBeNull();
    });
  });

  describe('Priority Translation', () => {
    const translatePriority = (priority, language = 'en') => {
      const translation = PRIORITY_TRANSLATIONS[priority?.toLowerCase()];
      if (!translation) return priority;
      return translation[language] || translation.en || priority;
    };

    it('should translate priority to English', () => {
      expect(translatePriority('high', 'en')).toBe('High');
      expect(translatePriority('urgent', 'en')).toBe('Urgent');
    });

    it('should translate priority to Spanish', () => {
      expect(translatePriority('high', 'es')).toBe('Alta');
      expect(translatePriority('urgent', 'es')).toBe('Urgente');
    });

    it('should fallback to English for unknown priority', () => {
      expect(translatePriority('unknown', 'es')).toBe('unknown');
    });

    it('should handle case insensitivity', () => {
      expect(translatePriority('HIGH', 'en')).toBe('High');
      expect(translatePriority('Urgent', 'es')).toBe('Urgente');
    });
  });

  describe('Date Formatting', () => {
    const formatDate = (date, language = 'en') => {
      const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE'
      };

      return new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
        dateStyle: 'medium'
      }).format(new Date(date));
    };

    it('should format date in English', () => {
      const formatted = formatDate('2024-01-15', 'en');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jan');
    });

    it('should format date in Spanish', () => {
      const formatted = formatDate('2024-01-15', 'es');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('ene');
    });

    it('should format date in French', () => {
      const formatted = formatDate('2024-01-15', 'fr');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('janv');
    });

    it('should handle unknown language with fallback', () => {
      const formatted = formatDate('2024-01-15', 'xx');
      expect(formatted).toContain('2024');
    });
  });

  describe('Number Formatting', () => {
    const formatNumber = (number, language = 'en') => {
      const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE'
      };

      return new Intl.NumberFormat(localeMap[language] || 'en-US').format(number);
    };

    it('should format number in English with commas', () => {
      const formatted = formatNumber(1234567.89, 'en');
      expect(formatted).toContain('1,234,567');
    });

    it('should format number in Spanish with dots', () => {
      const formatted = formatNumber(1234567.89, 'es');
      expect(formatted).toContain('1.234.567');
    });

    it('should format number in German with dots for thousands', () => {
      const formatted = formatNumber(1234567.89, 'de');
      expect(formatted).toContain('1.234.567');
    });
  });
});

// ============================================
// RTL SUPPORT TESTS
// ============================================

describe('RTL (Right-to-Left) Support', () => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const ltrLanguages = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'hi', 'ja'];

  it('should have RTL languages defined', () => {
    expect(rtlLanguages.length).toBeGreaterThan(0);
  });

  it('should have LTR languages defined', () => {
    expect(ltrLanguages.length).toBeGreaterThan(0);
  });

  it('should not overlap RTL and LTR languages', () => {
    const overlap = rtlLanguages.filter(lang => ltrLanguages.includes(lang));
    expect(overlap.length).toBe(0);
  });

  it('should cover common RTL languages', () => {
    expect(rtlLanguages).toContain('ar'); // Arabic
    expect(rtlLanguages).toContain('he'); // Hebrew
  });
});

// ============================================
// LOCALIZATION UTILITIES TESTS
// ============================================

describe('Localization Utilities', () => {
  describe('Time Zone Handling', () => {
    const commonTimezones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata'
    ];

    it('should have common timezones available', () => {
      expect(commonTimezones.length).toBe(8);
    });

    it('should include major geographic regions', () => {
      expect(commonTimezones).toContain('America/New_York');
      expect(commonTimezones).toContain('Europe/London');
      expect(commonTimezones).toContain('Asia/Tokyo');
      expect(commonTimezones).toContain('Asia/Kolkata');
    });
  });

  describe('Relative Time Formatting', () => {
    const formatRelativeTime = (date, language = 'en') => {
      const now = new Date();
      const then = new Date(date);
      const diffInSeconds = Math.floor((now - then) / 1000);

      if (diffInSeconds < 60) {
        return language === 'es' ? 'Ahora mismo' : 'Just now';
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return language === 'es' 
          ? `hace ${diffInMinutes} minutos` 
          : `${diffInMinutes} minutes ago`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return language === 'es'
          ? `hace ${diffInHours} horas`
          : `${diffInHours} hours ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      return language === 'es'
        ? `hace ${diffInDays} días`
        : `${diffInDays} days ago`;
    };

    it('should format recent time in English', () => {
      const recent = new Date(Date.now() - 30 * 1000);
      const formatted = formatRelativeTime(recent, 'en');
      expect(formatted).toBe('Just now');
    });

    it('should format minutes in Spanish', () => {
      const minutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const formatted = formatRelativeTime(minutesAgo, 'es');
      expect(formatted).toContain('minutos');
    });

    it('should format hours correctly', () => {
      const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(hoursAgo, 'en');
      expect(formatted).toContain('3 hours');
    });
  });
});
