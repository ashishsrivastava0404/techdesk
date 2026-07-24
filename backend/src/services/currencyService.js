/**
 * Currency Service
 * Handles multi-currency support, exchange rates, and conversions
 */

import db from '../db/index.js';

// Default exchange rates (relative to USD)
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

// Currency configurations
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, locale: 'en-GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, locale: 'zh-CN' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, locale: 'pt-BR' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2, locale: 'es-MX' }
];

export const currencyService = {
  /**
   * Get all supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const [rows] = await db.query(
        'SELECT * FROM currencies WHERE is_active = TRUE ORDER BY code'
      );
      
      // If no currencies in DB, return defaults
      if (rows.length === 0) {
        return CURRENCIES.map(c => ({
          ...c,
          exchangeRate: DEFAULT_RATES[c.code]
        }));
      }
      
      return rows.map(row => ({
        code: row.code,
        symbol: row.symbol,
        name: row.name,
        decimalPlaces: row.decimal_places,
        exchangeRate: parseFloat(row.exchange_rate_to_usd),
        isActive: row.is_active
      }));
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return CURRENCIES.map(c => ({
        ...c,
        exchangeRate: DEFAULT_RATES[c.code]
      }));
    }
  },

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1.0;
    
    const currencies = await this.getSupportedCurrencies();
    const from = currencies.find(c => c.code === fromCurrency);
    const to = currencies.find(c => c.code === toCurrency);
    
    if (!from || !to) {
      throw new Error('Unsupported currency');
    }
    
    // Convert from source to USD, then from USD to target
    const inUSD = 1 / from.exchangeRate;
    return inUSD * to.exchangeRate;
  },

  /**
   * Convert amount from one currency to another
   */
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  },

  /**
   * Convert amount to USD (base currency)
   */
  async convertToUSD(amount, fromCurrency) {
    return this.convert(amount, fromCurrency, 'USD');
  },

  /**
   * Convert amount from USD to target currency
   */
  async convertFromUSD(amount, toCurrency) {
    return this.convert(amount, 'USD', toCurrency);
  },

  /**
   * Format amount for display
   */
  format(amount, currencyCode, locale = 'en-US') {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    const finalLocale = currency?.locale || locale;
    
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  },

  /**
   * Get currency configuration by code
   */
  getCurrencyConfig(currencyCode) {
    return CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  },

  /**
   * Update exchange rate for a currency
   */
  async updateExchangeRate(currencyCode, newRate) {
    try {
      await db.execute(
        'UPDATE currencies SET exchange_rate_to_usd = ? WHERE code = ?',
        [newRate, currencyCode]
      );
      return true;
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      return false;
    }
  },

  /**
   * Store user's currency preference
   */
  async setUserPreference(userId, currencyCode) {
    try {
      await db.execute(
        'UPDATE users SET preferred_currency = ? WHERE id = ?',
        [currencyCode, userId]
      );
      return true;
    } catch (error) {
      console.error('Error setting user currency preference:', error);
      return false;
    }
  },

  /**
   * Get user's currency preference
   */
  async getUserPreference(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT preferred_currency FROM users WHERE id = ?',
        [userId]
      );
      return rows[0]?.preferred_currency || 'USD';
    } catch (error) {
      console.error('Error getting user currency preference:', error);
      return 'USD';
    }
  },

  /**
   * Initialize currencies table
   */
  async initializeCurrencies() {
    try {
      // Check if table exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS currencies (
          id INT PRIMARY KEY AUTO_INCREMENT,
          code VARCHAR(3) NOT NULL UNIQUE,
          symbol VARCHAR(10) NOT NULL,
          name VARCHAR(100) NOT NULL,
          decimal_places INT DEFAULT 2,
          exchange_rate_to_usd DECIMAL(15,8) DEFAULT 1.00000000,
          is_active BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Insert default currencies if table is empty
      const [existing] = await db.query('SELECT COUNT(*) as count FROM currencies');
      if (existing[0].count === 0) {
        for (const curr of CURRENCIES) {
          await db.execute(
            `INSERT INTO currencies (code, symbol, name, decimal_places, exchange_rate_to_usd) 
             VALUES (?, ?, ?, ?, ?)`,
            [curr.code, curr.symbol, curr.name, curr.decimalPlaces, DEFAULT_RATES[curr.code]]
          );
        }
      }
      
      console.log('Currencies initialized successfully');
    } catch (error) {
      console.error('Error initializing currencies:', error);
    }
  }
};

export default currencyService;
