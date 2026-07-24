import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand, CreateSecretCommand, ListSecretsCommand } from '@aws-sdk/client-secrets-manager';

/**
 * AWS Secrets Manager Service
 * 
 * Loads secrets from AWS Secrets Manager for production use.
 * Falls back to database settings if AWS is not configured.
 */

let secretsClient = null;

/**
 * Initialize AWS Secrets Manager client
 */
function getClient() {
  if (!secretsClient && process.env.AWS_SECRET_MANAGER_ENABLED === 'true') {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } : undefined,
    });
  }
  return secretsClient;
}

/**
 * Get secret from AWS Secrets Manager
 * @param {string} secretName - Name or ARN of the secret
 * @returns {Object|null} Secret value as object
 */
export async function getSecret(secretName) {
  const client = getClient();
  if (!client) return null;

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    return null;
  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error.message);
    return null;
  }
}

/**
 * Put (create or update) secret in AWS Secrets Manager
 * @param {string} secretName - Name of the secret
 * @param {Object} secretValue - Object to store as JSON
 */
export async function putSecret(secretName, secretValue) {
  const client = getClient();
  if (!client) {
    console.warn('AWS Secrets Manager not configured. Skipping sync.');
    return false;
  }

  try {
    // Check if secret exists
    const existingSecret = await getSecret(secretName);
    
    if (existingSecret) {
      // Update existing secret
      const command = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue),
      });
      await client.send(command);
    } else {
      // Create new secret
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
      });
      await client.send(command);
    }
    
    console.log(`✅ Synced secret to AWS Secrets Manager: ${secretName}`);
    return true;
  } catch (error) {
    console.error(`Failed to put secret ${secretName}:`, error.message);
    return false;
  }
}

/**
 * Load all integration secrets from AWS Secrets Manager
 * Maps database settings to AWS secret names
 */
export async function loadSecretsFromAWS() {
  const client = getClient();
  if (!client) {
    console.log('AWS Secrets Manager not enabled or not configured');
    return {};
  }

  const secrets = {};
  const secretMappings = [
    { key: 'stripe', dbKeys: ['stripe_api_key', 'stripe_secret_key', 'stripe_webhook_secret'] },
    { key: 'paypal', dbKeys: ['paypal_client_id', 'paypal_secret'] },
    { key: 'razorpay', dbKeys: ['razorpay_key_id', 'razorpay_key_secret'] },
    { key: 'google-oauth', dbKeys: ['google_client_id', 'google_client_secret'] },
    { key: 'smtp', dbKeys: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email'] },
    { key: 'sendgrid', dbKeys: ['sendgrid_api_key', 'sendgrid_from_email'] },
    { key: 'twilio', dbKeys: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'] },
    { key: 'openai', dbKeys: ['openai_api_key'] },
    { key: 'aws', dbKeys: ['aws_access_key_id', 'aws_secret_access_key', 'aws_region', 'aws_s3_bucket'] },
    { key: 'cloudinary', dbKeys: ['cloudinary_api_key', 'cloudinary_api_secret', 'cloudinary_cloud_name'] },
    { key: 'sentry', dbKeys: ['sentry_dsn'] },
  ];

  for (const mapping of secretMappings) {
    try {
      const secret = await getSecret(`promote/${mapping.key}`);
      if (secret) {
        secrets[mapping.key] = secret;
      }
    } catch (error) {
      console.warn(`Failed to load ${mapping.key} from AWS:`, error.message);
    }
  }

  return secrets;
}

/**
 * Sync all secrets to AWS Secrets Manager
 * @param {Object} allSettings - All platform settings from database
 */
export async function syncSecretsToAWS(allSettings) {
  const mappings = [
    {
      key: 'stripe',
      keys: ['stripe_api_key', 'stripe_secret_key', 'stripe_webhook_secret', 'stripe_publishable_key', 'stripe_currency', 'stripe_platform_account_id'],
    },
    {
      key: 'paypal',
      keys: ['paypal_client_id', 'paypal_secret', 'paypal_mode'],
    },
    {
      key: 'razorpay',
      keys: ['razorpay_key_id', 'razorpay_key_secret'],
    },
    {
      key: 'google-oauth',
      keys: ['google_client_id', 'google_client_secret'],
    },
    {
      key: 'smtp',
      keys: ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name'],
    },
    {
      key: 'sendgrid',
      keys: ['sendgrid_api_key', 'sendgrid_from_email', 'sendgrid_from_name'],
    },
    {
      key: 'twilio',
      keys: ['twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'],
    },
    {
      key: 'openai',
      keys: ['openai_api_key'],
    },
    {
      key: 'aws',
      keys: ['aws_access_key_id', 'aws_secret_access_key', 'aws_region', 'aws_s3_bucket'],
    },
    {
      key: 'cloudinary',
      keys: ['cloudinary_api_key', 'cloudinary_api_secret', 'cloudinary_cloud_name'],
    },
    {
      key: 'sentry',
      keys: ['sentry_dsn'],
    },
  ];

  const results = [];
  
  for (const mapping of mappings) {
    const secretData = {};
    for (const dbKey of mapping.keys) {
      if (allSettings[dbKey]) {
        secretData[dbKey] = allSettings[dbKey];
      }
    }
    
    if (Object.keys(secretData).length > 0) {
      const success = await putSecret(`promote/${mapping.key}`, secretData);
      results.push({ name: mapping.key, success });
    }
  }

  return results;
}

export default {
  getSecret,
  putSecret,
  loadSecretsFromAWS,
  syncSecretsToAWS,
};
