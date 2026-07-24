import pool from '../db/index.js';
import { loadSecretsFromAWS, syncSecretsToAWS } from './awsSecretsManager.js';

/**
 * Maps database setting keys to environment variable names
 */
const SETTING_TO_ENV_MAP = {
  'stripe_api_key': 'STRIPE_SECRET_KEY',
  'stripe_secret_key': 'STRIPE_SECRET_KEY',
  'stripe_webhook_secret': 'STRIPE_WEBHOOK_SECRET',
  'paypal_client_id': 'PAYPAL_CLIENT_ID',
  'paypal_secret': 'PAYPAL_CLIENT_SECRET',
  'razorpay_key_id': 'RAZORPAY_KEY_ID',
  'razorpay_key_secret': 'RAZORPAY_KEY_SECRET',
  'google_client_id': 'GOOGLE_CLIENT_ID',
  'google_client_secret': 'GOOGLE_CLIENT_SECRET',
  'sentry_dsn': 'SENTRY_DSN',
  'openai_api_key': 'OPENAI_API_KEY',
  'aws_access_key_id': 'AWS_ACCESS_KEY_ID',
  'aws_secret_access_key': 'AWS_SECRET_ACCESS_KEY',
  'cloudinary_api_key': 'CLOUDINARY_API_KEY',
  'cloudinary_cloud_name': 'CLOUDINARY_CLOUD_NAME',
  'cloudinary_api_secret': 'CLOUDINARY_API_SECRET',
  'smtp_host': 'SMTP_HOST',
  'smtp_port': 'SMTP_PORT',
  'smtp_user': 'SMTP_USER',
  'smtp_pass': 'SMTP_PASS',
  'smtp_from_email': 'SMTP_FROM_EMAIL',
  'smtp_from_name': 'SMTP_FROM_NAME',
  'sendgrid_api_key': 'SENDGRID_API_KEY',
  'twilio_account_sid': 'TWILIO_ACCOUNT_SID',
  'twilio_auth_token': 'TWILIO_AUTH_TOKEN',
  'twilio_phone_number': 'TWILIO_PHONE_NUMBER',
  'stripe_publishable_key': 'STRIPE_PUBLISHABLE_KEY',
  'stripe_currency': 'STRIPE_CURRENCY',
  'stripe_platform_account_id': 'STRIPE_PLATFORM_ACCOUNT_ID',
  'paypal_mode': 'PAYPAL_MODE',
  'bank_api_key': 'BANK_API_KEY',
  'bank_api_secret': 'BANK_API_SECRET',
  'aws_secrets_manager_region': 'AWS_REGION',
};

/**
 * Keys that should be masked when returning to frontend
 */
const SECRET_KEYS = [
  'stripe_api_key',
  'stripe_secret_key', 
  'stripe_webhook_secret',
  'paypal_client_id',
  'paypal_secret',
  'razorpay_key_id',
  'razorpay_key_secret',
  'google_client_id',
  'google_client_secret',
  'sentry_dsn',
  'openai_api_key',
  'aws_access_key_id',
  'aws_secret_access_key',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'smtp_pass',
  'sendgrid_api_key',
  'twilio_auth_token',
  'bank_api_key',
  'bank_api_secret',
];

/**
 * Load API keys from database and set as environment variables
 * Called on server startup
 * 
 * Priority:
 * 1. AWS Secrets Manager (if enabled)
 * 2. Database platform_settings
 * 3. Environment variables (from .env)
 */
export async function loadApiKeysFromDatabase() {
  try {
    // First, load from database to get AWS Secrets Manager settings
    const [awsRows] = await pool.query(
      'SELECT key_name, value FROM platform_settings WHERE key_name LIKE ? OR key_name LIKE ?',
      ['%aws_secrets%', '%aws_region']
    );
    
    // Set AWS region if configured
    for (const row of awsRows) {
      if (row.key_name === 'aws_secrets_manager_region' && row.value) {
        process.env.AWS_REGION = row.value;
      }
      if (row.key_name === 'aws_access_key_id' && row.value) {
        process.env.AWS_ACCESS_KEY_ID = row.value;
      }
      if (row.key_name === 'aws_secret_access_key' && row.value) {
        process.env.AWS_SECRET_ACCESS_KEY = row.value;
      }
    }

    // Check if AWS Secrets Manager is enabled
    const [secretsEnabled] = await pool.query(
      'SELECT value FROM platform_settings WHERE key_name = ?',
      ['aws_secrets_manager_enabled']
    );
    
    const isAwsEnabled = secretsEnabled.length > 0 && secretsEnabled[0].value === 'true';

    if (isAwsEnabled) {
      console.log('🔐 Loading secrets from AWS Secrets Manager...');
      try {
        const awsSecrets = await loadSecretsFromAWS();
        
        // Load secrets from AWS into environment
        for (const [category, secrets] of Object.entries(awsSecrets)) {
          if (secrets && typeof secrets === 'object') {
            for (const [key, value] of Object.entries(secrets)) {
              if (value) {
                const envVar = SETTING_TO_ENV_MAP[key];
                if (envVar) {
                  process.env[envVar] = value;
                  console.log(`✅ Loaded ${key} from AWS Secrets Manager`);
                }
              }
            }
          }
        }
        console.log('✅ Successfully loaded secrets from AWS Secrets Manager');
        return;
      } catch (awsError) {
        console.warn('⚠️ Failed to load from AWS Secrets Manager, falling back to database:', awsError.message);
      }
    }

    // Fallback: Load from database
    const [rows] = await pool.query('SELECT key_name, value FROM platform_settings WHERE key_name IN (?)', 
      [Object.keys(SETTING_TO_ENV_MAP)]);
    
    for (const row of rows) {
      const envVar = SETTING_TO_ENV_MAP[row.key_name];
      // Don't override if already set (from .env)
      if (envVar && row.value && !process.env[envVar]) {
        process.env[envVar] = row.value;
        console.log(`✅ Loaded ${row.key_name} from database`);
      }
    }
    
    console.log('🔑 API keys loaded from database settings');
  } catch (error) {
    console.error('Error loading API keys from database:', error.message);
  }
}

/**
 * Sync settings to AWS Secrets Manager when saving
 * Called after admin saves new settings
 */
export async function syncToAWS(secrets) {
  try {
    const [enabled] = await pool.query(
      'SELECT value FROM platform_settings WHERE key_name = ?',
      ['aws_secrets_manager_enabled']
    );
    
    if (enabled.length > 0 && enabled[0].value === 'true') {
      await syncSecretsToAWS(secrets);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error syncing to AWS:', error.message);
    return false;
  }
}

/**
 * Mask a secret value for display
 */
export function maskSecret(value) {
  if (!value || value.length < 8) return '********';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

/**
 * Process settings before sending to frontend (mask secrets)
 */
export function maskSettingsForFrontend(settings) {
  const masked = { ...settings };
  
  for (const key of SECRET_KEYS) {
    if (masked[key] && masked[key].length > 0) {
      masked[key] = maskSecret(masked[key]);
    }
  }
  
  return masked;
}

/**
 * Check if a value is masked
 */
export function isMasked(value) {
  return value && value.includes('****');
}

export default {
  loadApiKeysFromDatabase,
  maskSettingsForFrontend,
  maskSecret,
  isMasked,
  syncToAWS,
};
