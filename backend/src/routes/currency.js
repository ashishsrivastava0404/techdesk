/**
 * Currency Routes
 * Handles currency and exchange rate API endpoints
 */

import express from 'express';
import { currencyService } from '../services/currencyService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/currency
 * Get all supported currencies with exchange rates
 */
router.get('/', asyncHandler(async (req, res) => {
  const currencies = await currencyService.getSupportedCurrencies();
  res.json({ currencies });
}));

/**
 * GET /api/currency/convert
 * Convert amount between currencies
 * Query params: amount, from, to
 */
router.get('/convert', asyncHandler(async (req, res) => {
  const { amount, from = 'USD', to = 'USD' } = req.query;
  
  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const convertedAmount = await currencyService.convert(
    parseFloat(amount),
    from.toUpperCase(),
    to.toUpperCase()
  );

  const rate = await currencyService.getExchangeRate(
    from.toUpperCase(),
    to.toUpperCase()
  );

  res.json({
    original: {
      amount: parseFloat(amount),
      currency: from.toUpperCase()
    },
    converted: {
      amount: convertedAmount,
      currency: to.toUpperCase()
    },
    exchangeRate: rate,
    formatted: {
      original: currencyService.format(parseFloat(amount), from.toUpperCase()),
      converted: currencyService.format(convertedAmount, to.toUpperCase())
    }
  });
}));

/**
 * GET /api/currency/rate
 * Get exchange rate between two currencies
 * Query params: from, to
 */
router.get('/rate', asyncHandler(async (req, res) => {
  const { from = 'USD', to = 'USD' } = req.query;
  
  const rate = await currencyService.getExchangeRate(
    from.toUpperCase(),
    to.toUpperCase()
  );

  res.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate
  });
}));

/**
 * POST /api/currency/user/preference
 * Set user's currency preference
 */
router.post('/user/preference', asyncHandler(async (req, res) => {
  const { userId, currency } = req.body;
  
  if (!userId || !currency) {
    return res.status(400).json({ error: 'userId and currency are required' });
  }

  const currencies = await currencyService.getSupportedCurrencies();
  const isSupported = currencies.some(c => c.code === currency.toUpperCase());
  
  if (!isSupported) {
    return res.status(400).json({ 
      error: 'Unsupported currency',
      supported: currencies.map(c => c.code)
    });
  }

  await currencyService.setUserPreference(userId, currency.toUpperCase());
  
  res.json({ success: true, currency: currency.toUpperCase() });
}));

/**
 * GET /api/currency/user/preference/:userId
 * Get user's currency preference
 */
router.get('/user/preference/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currency = await currencyService.getUserPreference(userId);
  const config = currencyService.getCurrencyConfig(currency);
  
  res.json({ 
    userId, 
    currency,
    config
  });
}));

/**
 * GET /api/currency/format
 * Format amount in specific currency
 * Query params: amount, currency, locale
 */
router.get('/format', asyncHandler(async (req, res) => {
  const { amount, currency = 'USD', locale } = req.query;
  
  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const formatted = currencyService.format(
    parseFloat(amount),
    currency.toUpperCase(),
    locale
  );

  res.json({
    amount: parseFloat(amount),
    currency: currency.toUpperCase(),
    locale: locale || 'default',
    formatted
  });
}));

export default router;
