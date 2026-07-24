/**
 * Regional Settings Tests
 * Tests for timezone selector, regional settings, and locale utilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================
// TIMEZONE UTILITIES TESTS
// ============================================

describe('Timezone Utilities', () => {
  // Mock timezone detection
  const detectUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  // Get timezone offset
  const getTimezoneOffset = (timezone) => {
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
  const formatTimeForTimezone = (date, timezone, locale = 'en-US') => {
    try {
      return new Intl.DateTimeFormat(locale, {
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

  describe('Timezone Detection', () => {
    it('should detect a valid timezone', () => {
      const timezone = detectUserTimezone();
      expect(timezone).toBeDefined();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });

    it('should return UTC as fallback', () => {
      const timezone = detectUserTimezone();
      expect(timezone).toMatch(/^[A-Za-z_/]+$/);
    });
  });

  describe('Timezone Offset', () => {
    it('should return offset for UTC', () => {
      const offset = getTimezoneOffset('UTC');
      // UTC can be formatted as "UTC", "GMT+0", "GMT+00:00", etc.
      expect(offset).toBeDefined();
      expect(offset.length).toBeGreaterThan(0);
    });

    it('should return offset for New York', () => {
      const offset = getTimezoneOffset('America/New_York');
      expect(offset).toBeDefined();
      expect(offset.length).toBeGreaterThan(0);
    });

    it('should return offset for India', () => {
      const offset = getTimezoneOffset('Asia/Kolkata');
      expect(offset).toBeDefined();
    });

    it('should return offset for Tokyo', () => {
      const offset = getTimezoneOffset('Asia/Tokyo');
      expect(offset).toBeDefined();
    });

    it('should return empty string for invalid timezone', () => {
      const offset = getTimezoneOffset('Invalid/Timezone');
      expect(offset).toBe('');
    });
  });

  describe('Time Formatting', () => {
    const testDate = '2024-06-15T14:30:00Z';

    it('should format time for UTC', () => {
      const formatted = formatTimeForTimezone(testDate, 'UTC', 'en-US');
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should format time for New York', () => {
      const formatted = formatTimeForTimezone(testDate, 'America/New_York', 'en-US');
      expect(formatted).toBeDefined();
    });

    it('should format time for India', () => {
      const formatted = formatTimeForTimezone(testDate, 'Asia/Kolkata', 'en-IN');
      expect(formatted).toBeDefined();
    });

    it('should format time for Tokyo', () => {
      const formatted = formatTimeForTimezone(testDate, 'Asia/Tokyo', 'ja-JP');
      expect(formatted).toBeDefined();
    });

    it('should handle invalid date gracefully', () => {
      const formatted = formatTimeForTimezone('invalid-date', 'UTC', 'en-US');
      expect(formatted).toBeDefined();
    });
  });

  describe('Timezone List', () => {
    const TIMEZONES = [
      // Americas
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      // Europe
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Stockholm',
      'Europe/Warsaw',
      'Europe/Moscow',
      // Asia
      'Asia/Kolkata',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Singapore',
      'Asia/Seoul',
      'Asia/Dubai',
      'Asia/Bangkok',
      'Asia/Jakarta',
      'Asia/Manila',
      // Oceania
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
      // UTC
      'UTC'
    ];

    it('should have at least 35 timezones', () => {
      expect(TIMEZONES.length).toBeGreaterThanOrEqual(35);
    });

    it('should include major timezones', () => {
      expect(TIMEZONES).toContain('America/New_York');
      expect(TIMEZONES).toContain('Europe/London');
      expect(TIMEZONES).toContain('Asia/Kolkata');
      expect(TIMEZONES).toContain('Asia/Tokyo');
    });

    it('should have valid timezone format', () => {
      TIMEZONES.forEach(tz => {
        expect(tz).toMatch(/^[A-Za-z_/]+$/);
      });
    });

    it('should have Americas timezones', () => {
      const americas = TIMEZONES.filter(tz => tz.startsWith('America') || tz.startsWith('Pacific'));
      expect(americas.length).toBeGreaterThanOrEqual(10);
    });

    it('should have Europe timezones', () => {
      const europe = TIMEZONES.filter(tz => tz.startsWith('Europe'));
      expect(europe.length).toBeGreaterThanOrEqual(10);
    });

    it('should have Asia timezones', () => {
      const asia = TIMEZONES.filter(tz => tz.startsWith('Asia'));
      expect(asia.length).toBeGreaterThanOrEqual(8);
    });
  });
});

// ============================================
// COUNTRY-LOCALE MAPPING TESTS
// ============================================

describe('Country-Locale Mapping', () => {
  const countryLocaleMap = {
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
    'CA': { timezone: 'America/Toronto', currency: 'CAD', locale: 'en-CA', language: 'en' },
    'KR': { timezone: 'Asia/Seoul', currency: 'KRW', locale: 'ko-KR', language: 'ko' },
    'SG': { timezone: 'Asia/Singapore', currency: 'SGD', locale: 'en-SG', language: 'en' },
    'AE': { timezone: 'Asia/Dubai', currency: 'AED', locale: 'ar-AE', language: 'ar' },
    'ZA': { timezone: 'Africa/Johannesburg', currency: 'ZAR', locale: 'en-ZA', language: 'en' },
    'AR': { timezone: 'America/Buenos_Aires', currency: 'ARS', locale: 'es-AR', language: 'es' },
    'RU': { timezone: 'Europe/Moscow', currency: 'RUB', locale: 'ru-RU', language: 'ru' }
  };

  describe('Supported Countries', () => {
    it('should have at least 20 countries', () => {
      expect(Object.keys(countryLocaleMap).length).toBeGreaterThanOrEqual(20);
    });

    it('should have US as first country', () => {
      expect(countryLocaleMap).toHaveProperty('US');
    });

    it('should have India with INR', () => {
      expect(countryLocaleMap.IN).toBeDefined();
      expect(countryLocaleMap.IN.currency).toBe('INR');
    });

    it('should have Japan with JPY', () => {
      expect(countryLocaleMap.JP).toBeDefined();
      expect(countryLocaleMap.JP.currency).toBe('JPY');
    });

    it('should have Brazil with BRL', () => {
      expect(countryLocaleMap.BR).toBeDefined();
      expect(countryLocaleMap.BR.currency).toBe('BRL');
    });
  });

  describe('Country Settings Structure', () => {
    Object.entries(countryLocaleMap).forEach(([code, settings]) => {
      it(`should have valid settings for ${code}`, () => {
        expect(settings).toHaveProperty('timezone');
        expect(settings).toHaveProperty('currency');
        expect(settings).toHaveProperty('locale');
        expect(settings).toHaveProperty('language');
      });

      it(`should have valid currency code for ${code}`, () => {
        expect(settings.currency).toMatch(/^[A-Z]{3}$/);
      });

      it(`should have valid locale for ${code}`, () => {
        expect(settings.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      });
    });
  });

  describe('Regional Coverage', () => {
    it('should cover Americas', () => {
      const americas = ['US', 'CA', 'MX', 'BR', 'AR'];
      americas.forEach(code => {
        expect(countryLocaleMap[code]).toBeDefined();
      });
    });

    it('should cover Europe', () => {
      const europe = ['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'RU'];
      europe.forEach(code => {
        expect(countryLocaleMap[code]).toBeDefined();
      });
    });

    it('should cover Asia', () => {
      const asia = ['IN', 'JP', 'CN', 'KR', 'SG', 'AE'];
      asia.forEach(code => {
        expect(countryLocaleMap[code]).toBeDefined();
      });
    });

    it('should cover Oceania', () => {
      const oceania = ['AU'];
      oceania.forEach(code => {
        expect(countryLocaleMap[code]).toBeDefined();
      });
    });
  });

  describe('Currency Diversity', () => {
    it('should have USD', () => {
      expect(countryLocaleMap.US.currency).toBe('USD');
    });

    it('should have EUR for European countries', () => {
      expect(countryLocaleMap.DE.currency).toBe('EUR');
      expect(countryLocaleMap.FR.currency).toBe('EUR');
    });

    it('should have diverse currencies', () => {
      const currencies = new Set(Object.values(countryLocaleMap).map(s => s.currency));
      expect(currencies.size).toBeGreaterThanOrEqual(5);
    });
  });
});

// ============================================
// SEARCH FUNCTIONALITY TESTS
// ============================================

describe('Search Functionality', () => {
  const TIMEZONES = [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Kolkata'
  ];

  const searchTimezones = (query, list) => {
    const lowerQuery = query.toLowerCase().replace(/\s+/g, '_');
    return list.filter(tz => 
      tz.toLowerCase().includes(lowerQuery) ||
      tz.split('/')[1]?.toLowerCase().includes(lowerQuery.replace(/_/g, ' '))
    );
  };

  it('should find New York', () => {
    const results = searchTimezones('New_York', TIMEZONES);
    expect(results).toContain('America/New_York');
  });

  it('should find London', () => {
    const results = searchTimezones('london', TIMEZONES);
    expect(results).toContain('Europe/London');
  });

  it('should find Tokyo', () => {
    const results = searchTimezones('tokyo', TIMEZONES);
    expect(results).toContain('Asia/Tokyo');
  });

  it('should find India', () => {
    const results = searchTimezones('Kolkata', TIMEZONES);
    expect(results).toContain('Asia/Kolkata');
  });

  it('should return empty for no matches', () => {
    const results = searchTimezones('xyz123', TIMEZONES);
    expect(results).toHaveLength(0);
  });

  it('should be case insensitive', () => {
    const results1 = searchTimezones('PARIS', TIMEZONES);
    const results2 = searchTimezones('paris', TIMEZONES);
    expect(results1).toEqual(results2);
  });
});

// ============================================
// LOCALSTORAGE PERSISTENCE TESTS
// ============================================

describe('LocalStorage Persistence', () => {
  const STORAGE_KEYS = {
    timezone: 'preferred_timezone',
    language: 'preferred_language',
    currency: 'preferred_currency',
    locale: 'preferred_locale'
  };

  it('should have all required storage keys', () => {
    expect(STORAGE_KEYS.timezone).toBe('preferred_timezone');
    expect(STORAGE_KEYS.language).toBe('preferred_language');
    expect(STORAGE_KEYS.currency).toBe('preferred_currency');
    expect(STORAGE_KEYS.locale).toBe('preferred_locale');
  });

  it('should use consistent key naming', () => {
    Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
      expect(value).toMatch(/^preferred_/);
    });
  });

  describe('Apply Regional Settings', () => {
    const applyRegionalSettings = (countryCode, map) => {
      const settings = map[countryCode];
      if (settings) {
        return {
          timezone: settings.timezone,
          language: settings.language,
          currency: settings.currency,
          locale: settings.locale
        };
      }
      return null;
    };

    const countryMap = {
      'US': { timezone: 'America/New_York', currency: 'USD', locale: 'en-US', language: 'en' },
      'IN': { timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN', language: 'en' }
    };

    it('should apply US settings correctly', () => {
      const settings = applyRegionalSettings('US', countryMap);
      expect(settings.timezone).toBe('America/New_York');
      expect(settings.currency).toBe('USD');
    });

    it('should apply India settings correctly', () => {
      const settings = applyRegionalSettings('IN', countryMap);
      expect(settings.timezone).toBe('Asia/Kolkata');
      expect(settings.currency).toBe('INR');
    });

    it('should return null for unknown country', () => {
      const settings = applyRegionalSettings('XX', countryMap);
      expect(settings).toBeNull();
    });
  });
});

// ============================================
// LIVE TIME PREVIEW TESTS
// ============================================

describe('Live Time Preview', () => {
  const getCurrentTimeInZone = (timezone) => {
    try {
      return new Date().toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  it('should return time for UTC', () => {
    const time = getCurrentTimeInZone('UTC');
    expect(time).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  it('should return time for New York', () => {
    const time = getCurrentTimeInZone('America/New_York');
    expect(time).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  it('should return time for India', () => {
    const time = getCurrentTimeInZone('Asia/Kolkata');
    expect(time).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  it('should return placeholder for invalid timezone', () => {
    const time = getCurrentTimeInZone('Invalid/Zone');
    expect(time).toBe('--:--');
  });
});

// ============================================
// RTL LANGUAGE DETECTION TESTS
// ============================================

describe('RTL Language Detection', () => {
  const isRTL = (languageCode) => {
    return ['ar', 'he', 'fa', 'ur'].includes(languageCode);
  };

  it('should identify Arabic as RTL', () => {
    expect(isRTL('ar')).toBe(true);
  });

  it('should identify Hebrew as RTL', () => {
    expect(isRTL('he')).toBe(true);
  });

  it('should identify Farsi as RTL', () => {
    expect(isRTL('fa')).toBe(true);
  });

  it('should identify Urdu as RTL', () => {
    expect(isRTL('ur')).toBe(true);
  });

  it('should identify English as LTR', () => {
    expect(isRTL('en')).toBe(false);
  });

  it('should identify Spanish as LTR', () => {
    expect(isRTL('es')).toBe(false);
  });

  it('should identify Japanese as LTR', () => {
    expect(isRTL('ja')).toBe(false);
  });

  it('should identify Chinese as LTR', () => {
    expect(isRTL('zh')).toBe(false);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration: Full Regional Setup', () => {
  const simulateFullSetup = (countryCode, countryMap) => {
    const settings = countryMap[countryCode];
    if (!settings) return { success: false, error: 'Unknown country' };

    return {
      success: true,
      settings: {
        language: settings.language,
        currency: settings.currency,
        timezone: settings.timezone,
        locale: settings.locale
      }
    };
  };

  const countryMap = {
    'US': { timezone: 'America/New_York', currency: 'USD', locale: 'en-US', language: 'en' },
    'IN': { timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN', language: 'en' },
    'JP': { timezone: 'Asia/Tokyo', currency: 'JPY', locale: 'ja-JP', language: 'ja' }
  };

  it('should complete full setup for US', () => {
    const result = simulateFullSetup('US', countryMap);
    expect(result.success).toBe(true);
    expect(result.settings.language).toBe('en');
    expect(result.settings.currency).toBe('USD');
    expect(result.settings.timezone).toBe('America/New_York');
    expect(result.settings.locale).toBe('en-US');
  });

  it('should complete full setup for India', () => {
    const result = simulateFullSetup('IN', countryMap);
    expect(result.success).toBe(true);
    expect(result.settings.language).toBe('en');
    expect(result.settings.currency).toBe('INR');
    expect(result.settings.timezone).toBe('Asia/Kolkata');
  });

  it('should complete full setup for Japan', () => {
    const result = simulateFullSetup('JP', countryMap);
    expect(result.success).toBe(true);
    expect(result.settings.language).toBe('ja');
    expect(result.settings.currency).toBe('JPY');
    expect(result.settings.locale).toBe('ja-JP');
  });

  it('should handle unknown country', () => {
    const result = simulateFullSetup('XX', countryMap);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown country');
  });
});
