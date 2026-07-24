# Global Expansion Architecture

## Overview

This document outlines the architecture for making TechDesk a truly global platform supporting multiple languages, currencies, and communication channels.

---

## 1. Internationalization (i18n) System

### Supported Languages (MVP)

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English | en | LTR | Default |
| Spanish | es | LTR | Planned |
| French | fr | LTR | Planned |
| German | de | LTR | Planned |
| Portuguese | pt | LTR | Planned |
| Arabic | ar | RTL | Planned |
| Chinese (Simplified) | zh | LTR | Planned |
| Hindi | hi | LTR | Planned |
| Japanese | ja | LTR | Planned |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     i18n SYSTEM ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Frontend   │    │   Backend    │    │   Email/SMS      │   │
│  │             │    │              │    │   Templates       │   │
│  │ ┌─────────┐ │    │ ┌──────────┐ │    │ ┌──────────────┐ │   │
│  │ │i18next  │ │    │ │ Language │ │    │ │ Template      │ │   │
│  │ │ Library │ │    │ │ Middleware│ │   │ │ Engine        │ │   │
│  │ └─────────┘ │    │ └──────────┘ │    │ └──────────────┘ │   │
│  │ ┌─────────┐ │    │ ┌──────────┐ │    │ ┌──────────────┐ │   │
│  │ │ Locale   │ │    │ │ User     │ │    │ │ Notification │ │   │
│  │ │ Provider │ │    │ │ Preference│ │   │ │ Service      │ │   │
│  │ └─────────┘ │    │ └──────────┘ │    │ └──────────────┘ │   │
│  └──────┬──────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                   │                      │              │
│         └───────────────────┴──────────────────────┘              │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Translation    │                          │
│                    │  API Endpoint   │                          │
│                    │  /api/i18n/*    │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- User language preference
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Organization language settings
ALTER TABLE organizations ADD COLUMN default_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE organizations ADD COLUMN supported_languages JSON DEFAULT '["en"]';
```

### Frontend Implementation

```javascript
// frontend/src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
```

### Translation File Structure

```json
// frontend/src/i18n/locales/en.json
{
  "common": {
    "welcome": "Welcome to {{appName}}",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "loading": "Loading..."
  },
  "nav": {
    "dashboard": "Dashboard",
    "tickets": "My Tickets",
    "available": "Available Tickets",
    "earnings": "Earnings",
    "settings": "Settings"
  },
  "tickets": {
    "submit_new": "Submit New Ticket",
    "priority": {
      "low": "Low",
      "normal": "Normal",
      "high": "High",
      "urgent": "Urgent",
      "critical": "Critical"
    }
  },
  "settings": {
    "language": "Language",
    "currency": "Currency",
    "notifications": "Notification Preferences"
  }
}
```

---

## 2. Multi-Currency System

### Supported Currencies (MVP)

| Currency | Code | Symbol | Decimal Places |
|----------|------|--------|----------------|
| US Dollar | USD | $ | 2 |
| Euro | EUR | € | 2 |
| British Pound | GBP | £ | 2 |
| Indian Rupee | INR | ₹ | 2 |
| Japanese Yen | JPY | ¥ | 0 |
| Chinese Yuan | CNY | ¥ | 2 |
| Brazilian Real | BRL | R$ | 2 |
| Mexican Peso | MXN | $ | 2 |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  MULTI-CURRENCY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐        ┌──────────────┐        ┌───────────┐ │
│  │   Frontend   │        │    Backend   │        │  Payment  │ │
│  │              │        │              │        │  Gateway  │ │
│  │ ┌──────────┐ │        │ ┌──────────┐ │        │           │ │
│  │ │ Currency │ │        │ │ Currency │ │        │ ┌───────┐ │ │
│  │ │ Selector │ │        │ │ Service  │ │        │ │Stripe │ │ │
│  │ └──────────┘ │        │ └──────────┘ │        │ │PayPal │ │ │
│  │ ┌──────────┐ │        │ ┌──────────┐ │        │ │Square │ │ │
│  │ │ Price    │ │◄──────►│ │ Converter│ │◄──────►│ └───────┘ │ │
│  │ │ Display  │ │        │ │          │ │        │           │ │
│  │ └──────────┘ │        │ └──────────┘ │        └───────────┘ │
│  └──────────────┘        └──────┬───────┘                      │
│                                 │                               │
│                    ┌────────────▼────────────┐                  │
│                    │    Exchange Rate API    │                  │
│                    │  (Open Exchange Rates) │                  │
│                    └─────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Currencies table
CREATE TABLE currencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(3) NOT NULL UNIQUE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  decimal_places INT DEFAULT 2,
  exchange_rate_to_usd DECIMAL(15,8) DEFAULT 1.00000000,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User currency preference
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD';

-- Organization currency settings
ALTER TABLE organizations ADD COLUMN default_currency VARCHAR(3) DEFAULT 'USD';

-- Ticket prices in base currency
ALTER TABLE tickets ADD COLUMN price_usd DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tickets ADD COLUMN price_display DECIMAL(10,2) GENERATED ALWAYS AS (price_usd) STORED;

-- Payment tracking
ALTER TABLE payments ADD COLUMN amount_original DECIMAL(10,2) NOT NULL;
ALTER TABLE payments ADD COLUMN currency_original VARCHAR(3) DEFAULT 'USD';
ALTER TABLE payments ADD COLUMN exchange_rate_used DECIMAL(15,8) DEFAULT 1.00000000;
```

### Currency Service

```javascript
// backend/src/services/currencyService.js
export const currencyService = {
  // Convert amount from one currency to another
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = await this.getExchangeRates();
    const inUSD = amount / rates[fromCurrency];
    return inUSD * rates[toCurrency];
  },
  
  // Format currency for display
  format(amount, currency, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  // Get supported currencies
  async getSupportedCurrencies() {
    return db.query('SELECT * FROM currencies WHERE is_active = TRUE');
  }
};
```

---

---

## 3. Timezone & Country Features

### Supported Regions

| Region | Timezone | Currency | Locale |
|--------|----------|----------|--------|
| United States | America/New_York | USD | en-US |
| United Kingdom | Europe/London | GBP | en-GB |
| India | Asia/Kolkata | INR | en-IN |
| Japan | Asia/Tokyo | JPY | ja-JP |
| China | Asia/Shanghai | CNY | zh-CN |
| Germany | Europe/Berlin | EUR | de-DE |
| Brazil | America/Sao_Paulo | BRL | pt-BR |
| Mexico | America/Mexico_City | MXN | es-MX |

### Timezone Detection

```javascript
// Auto-detect user's timezone
const detectTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Common timezones for selection
const commonTimezones = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (Brazil)' },
  { value: 'Europe/London', label: 'London (UK & Ireland)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin (Germany)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
];
```

### Country-Locale Mapping

```javascript
const countryLocaleMap = {
  'US': { timezone: 'America/New_York', currency: 'USD', locale: 'en-US' },
  'GB': { timezone: 'Europe/London', currency: 'GBP', locale: 'en-GB' },
  'IN': { timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN' },
  'JP': { timezone: 'Asia/Tokyo', currency: 'JPY', locale: 'ja-JP' },
  'CN': { timezone: 'Asia/Shanghai', currency: 'CNY', locale: 'zh-CN' },
  'DE': { timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE' },
  'BR': { timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' },
  'MX': { timezone: 'America/Mexico_City', currency: 'MXN', locale: 'es-MX' },
  'FR': { timezone: 'Europe/Paris', currency: 'EUR', locale: 'fr-FR' },
  'ES': { timezone: 'Europe/Madrid', currency: 'EUR', locale: 'es-ES' }
};
```

---

## 4. Communication System

### Features Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMMUNICATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   IN-APP MESSAGING                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │   │
│  │  │ Real-time  │  │ Message    │  │ Read Receipts  │   │   │
│  │  │ Chat       │  │ History    │  │ & Typing        │   │   │
│  │  └────────────┘  └────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   EMAIL NOTIFICATIONS                    │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │   │
│  │  │ i18n       │  │ HTML       │  │ Template       │   │   │
│  │  │ Templates  │  │ Templates  │  │ Engine         │   │   │
│  │  └────────────┘  └────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   SMS NOTIFICATIONS                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │   │
│  │  │ Twilio     │  │ Short      │  │ Multi-         │   │   │
│  │  │ Integration│  │ Codes      │  │ Language       │   │   │
│  │  └────────────┘  └────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                NOTIFICATION PREFERENCES                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │   │
│  │  │ Email      │  │ SMS        │  │ In-App          │   │   │
│  │  │ Settings   │  │ Settings   │  │ Settings        │   │   │
│  │  └────────────┘  └────────────┘  └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Conversations (one per ticket)
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  customer_id INT NOT NULL,
  tech_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (tech_id) REFERENCES users(id)
);

-- Messages
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_type ENUM('text', 'attachment', 'system') DEFAULT 'text',
  content TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'instant',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email templates with i18n
CREATE TABLE email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  subject_en TEXT,
  body_en TEXT,
  subject_es TEXT,
  body_es TEXT,
  subject_fr TEXT,
  body_fr TEXT,
  -- Additional languages...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 5. Test Coverage

### Backend Tests

| Test Suite | Tests | Description |
|------------|-------|-------------|
| Branding & Ecosystem | 60 | Brand settings, routing, pages |
| i18n & Currency | 50 | Translations, currency conversion |
| Regional Settings | 117 | Timezone, country mapping, search |
| Error Handler | 12 | Error middleware |
| Credit Service | 29 | Credit calculations |
| Redis Fallback | 28 | Cache fallback system |
| Category Hierarchy | 17 | Ticket categories |
| Threaded Comments | 20 | Comment system |

**Total Backend Tests: 333**

### Frontend Tests

| Test Suite | Tests | Description |
|------------|-------|-------------|
| Brand Components | 71 | Layout, ChatBot, BrandSEO, pages |

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Specific test suites
cd backend && npm test -- branding.test.js
cd backend && npm test -- i18n-currency.test.js
cd backend && npm test -- regional-settings.test.js
```

### Test Coverage Areas

- ✅ Timezone detection and formatting (35+ timezones)
- ✅ Country-locale mapping (20 countries)
- ✅ Search functionality
- ✅ LocalStorage persistence
- ✅ RTL language detection
- ✅ Currency conversion (8 currencies)
- ✅ Email template translations

---

## 6. API Contracts

### Timezone API

```
GET /api/i18n/timezones
Response: { timezones: [...] }

GET /api/i18n/user/preference/:userId
Response: { 
  timezone: 'Asia/Kolkata', 
  language: 'en',
  currency: 'INR',
  locale: 'en-IN'
}

PATCH /api/v1/settings/timezone
Body: { timezone: 'America/New_York' }
Response: { success: true }
```

### Troubleshooting

#### Invalid Timezone Handling
```javascript
// Graceful fallback for invalid timezones
const getTimezoneOffset = (timezone) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    return formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'UTC';
  } catch {
    return 'UTC';
  }
};
```

#### Browser Intl API Limitations
Some older browsers may not support all timezones. Implement feature detection:
```javascript
const supportsTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};
```

---

## 7. Message Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Regular message | Customer/tech communication |
| `attachment` | File attachment | Sharing screenshots, logs |
| `system` | Automated message | Status changes, assignments |

### Email Template System

```javascript
// Email template structure
const emailTemplates = {
  'ticket_created': {
    subject: {
      en: 'New Ticket #{{ticket_id}} Created',
      es: 'Ticket #{{ticket_id}} Creado'
    },
    body: {
      en: `
        <h1>Hello {{customer_name}}</h1>
        <p>Your ticket #{{ticket_id}} has been created.</p>
        <p><strong>Subject:</strong> {{ticket_subject}}</p>
        <p><strong>Priority:</strong> {{ticket_priority}}</p>
      `,
      es: `
        <h1>Hola {{customer_name}}</h1>
        <p>Su ticket #{{ticket_id}} ha sido creado.</p>
        <p><strong>Asunto:</strong> {{ticket_subject}}</p>
        <p><strong>Prioridad:</strong> {{ticket_priority}}</p>
      `
    }
  },
  'ticket_assigned': {
    subject: {
      en: 'Ticket #{{ticket_id}} Assigned to {{tech_name}}',
      es: 'Ticket #{{ticket_id}} Asignado a {{tech_name}}'
    },
    body: {
      en: `<p>Your ticket has been assigned to {{tech_name}}.</p>`,
      es: `<p>Su ticket ha sido asignado a {{tech_name}}.</p>`
    }
  },
  'ticket_resolved': {
    subject: {
      en: 'Ticket #{{ticket_id}} Resolved',
      es: 'Ticket #{{ticket_id}} Resuelto'
    },
    body: {
      en: `<p>Your ticket has been resolved. {{resolution_message}}</p>`,
      es: `<p>Su ticket ha sido resuelto. {{resolution_message}}</p>`
    }
  }
};
```

---

## 4. Implementation Priority

### Phase 1: Foundation (1-2 weeks)
1. ✅ i18n setup and first translations (English, Spanish)
2. ✅ Language selector component
3. ✅ User language preference storage
4. ✅ Basic currency table and service

### Phase 2: Core Features (2-3 weeks)
1. Multi-currency display and conversion
2. Email template system with i18n
3. Notification preferences UI
4. Basic in-app messaging

### Phase 3: Advanced Features (3-4 weeks)
1. Real-time chat with WebSocket
2. SMS notifications with Twilio i18n
3. RTL language support
4. Exchange rate API integration

### Phase 4: Polish (1-2 weeks)
1. Translation coverage audit
2. Currency formatting consistency
3. Notification delivery testing
4. Performance optimization

---

## 5. Environment Variables

```bash
# i18n
I18N_DEFAULT_LANGUAGE=en
I18N_SUPPORTED_LANGUAGES=en,es,fr,de,pt,ar,zh,hi,ja

# Currency
CURRENCY_BASE=USD
EXCHANGE_RATE_API_KEY=your_api_key
EXCHANGE_RATE_UPDATE_INTERVAL=3600

# Communication
EMAIL_FROM_NAME=TechDesk
SMS_ENABLED=true
TWILIO_FROM_NUMBER=+1234567890
```

---

## 6. Testing Strategy

### i18n Testing
```javascript
describe('Internationalization', () => {
  it('should render text in selected language', () => {
    render(<Dashboard />, { wrapper: withI18n('es') });
    expect(screen.getByText('Tablero')).toBeInTheDocument();
  });
  
  it('should handle missing translations gracefully', () => {
    render(<Component />, { wrapper: withI18n('xx') });
    expect(screen.getByText('fallback_key')).toBeInTheDocument();
  });
});
```

### Currency Testing
```javascript
describe('Currency Conversion', () => {
  it('should convert USD to EUR correctly', async () => {
    const result = await currencyService.convert(100, 'USD', 'EUR');
    expect(result).toBeGreaterThan(80);
    expect(result).toBeLessThan(100);
  });
  
  it('should format currency for locale', () => {
    const formatted = currencyService.format(1234.56, 'USD', 'en-US');
    expect(formatted).toBe('$1,234.56');
  });
});
```

---

## 7. Performance Considerations

1. **Translation Loading**: Lazy load non-essential languages
2. **Currency Rates**: Cache exchange rates, update hourly
3. **Real-time Messages**: Use WebSocket with reconnection logic
4. **Email Queue**: Process notifications asynchronously

---

## 8. Monitoring & Analytics

- Track language usage distribution
- Monitor currency conversion errors
- Measure message delivery success rates
- Analyze notification open rates
