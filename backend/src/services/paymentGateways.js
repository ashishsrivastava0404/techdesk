/**
 * Payment Gateway Service
 * Unified interface for Stripe, Razorpay, and PayPal
 */

import { stripeService } from './stripe.js';

// Gateway status helper
function isGatewayConfigured(gateway) {
  switch (gateway) {
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY;
    case 'razorpay':
      return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
    case 'paypal':
      return !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
    default:
      return false;
  }
}

// Get configured gateways
export function getConfiguredGateways() {
  const gateways = [];
  
  if (isGatewayConfigured('stripe')) gateways.push('stripe');
  if (isGatewayConfigured('razorpay')) gateways.push('razorpay');
  if (isGatewayConfigured('paypal')) gateways.push('paypal');
  
  return gateways;
}

// Create payment with specified gateway
export async function createPayment(gateway, amount, currency = 'usd', metadata = {}) {
  if (!isGatewayConfigured(gateway)) {
    throw new Error(`${gateway} is not configured`);
  }

  switch (gateway) {
    case 'stripe':
      return stripeService.createPaymentIntent(amount, currency, metadata);
    
    case 'razorpay':
      return createRazorpayOrder(amount, currency, metadata);
    
    case 'paypal':
      return createPaypalOrder(amount, currency, metadata);
    
    default:
      throw new Error(`Unknown gateway: ${gateway}`);
  }
}

// Confirm payment with specified gateway
export async function confirmPayment(gateway, paymentId) {
  switch (gateway) {
    case 'stripe':
      return stripeService.confirmPayment(paymentId);
    
    case 'razorpay':
      return confirmRazorpayPayment(paymentId);
    
    case 'paypal':
      return confirmPaypalPayment(paymentId);
    
    default:
      throw new Error(`Unknown gateway: ${gateway}`);
  }
}

// Create refund with specified gateway
export async function createRefund(gateway, paymentId, amount = null) {
  switch (gateway) {
    case 'stripe':
      return stripeService.createRefund(paymentId, amount);
    
    case 'razorpay':
      return createRazorpayRefund(paymentId, amount);
    
    case 'paypal':
      return createPaypalRefund(paymentId, amount);
    
    default:
      throw new Error(`Unknown gateway: ${gateway}`);
  }
}

// Get payment status
export async function getPaymentStatus(gateway, paymentId) {
  switch (gateway) {
    case 'stripe':
      return stripeService.getPaymentStatus(paymentId);
    
    case 'razorpay':
      return getRazorpayOrderStatus(paymentId);
    
    case 'paypal':
      return getPaypalOrderStatus(paymentId);
    
    default:
      throw new Error(`Unknown gateway: ${gateway}`);
  }
}

// ============================================
// RAZORPAY IMPLEMENTATION
// ============================================

async function createRazorpayOrder(amount, currency, metadata) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: currency.toUpperCase(),
      notes: metadata
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.description || 'Razorpay order creation failed');
  }

  const order = await response.json();
  
  return {
    orderId: order.id,
    amount: order.amount / 100,
    currency: order.currency.toLowerCase(),
    status: order.status
  };
}

async function confirmRazorpayPayment(orderId) {
  // Razorpay payments are confirmed on the client side via checkout
  // This just retrieves the order status
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64')
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Razorpay order');
  }

  return await response.json();
}

async function getRazorpayOrderStatus(orderId) {
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64')
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Razorpay order');
  }

  const order = await response.json();
  
  return {
    orderId: order.id,
    amount: order.amount / 100,
    currency: order.currency.toLowerCase(),
    status: order.status,
    payments: order.payments
  };
}

async function createRazorpayRefund(orderId, amount) {
  const payload = {
    amount: amount ? Math.round(amount * 100) : undefined // Partial or full refund
  };

  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.description || 'Razorpay refund failed');
  }

  return await response.json();
}

// ============================================
// PAYPAL IMPLEMENTATION
// ============================================

let paypalAccessToken = null;
let paypalTokenExpiry = 0;

async function getPayPalAccessToken() {
  if (paypalAccessToken && Date.now() < paypalTokenExpiry) {
    return paypalAccessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  paypalAccessToken = data.access_token;
  paypalTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early

  return paypalAccessToken;
}

async function createPaypalOrder(amount, currency, metadata) {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2)
        },
        custom_id: JSON.stringify(metadata)
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'PayPal order creation failed');
  }

  const order = await response.json();
  
  // Find approval URL
  const approvalLink = order.links.find(link => link.rel === 'approve');
  
  return {
    orderId: order.id,
    amount: parseFloat(order.purchase_units[0].amount.value),
    currency: order.purchase_units[0].amount.currency_code.toLowerCase(),
    status: order.status,
    approvalUrl: approvalLink?.href
  };
}

async function confirmPaypalPayment(orderId) {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'PayPal capture failed');
  }

  return await response.json();
}

async function getPaypalOrderStatus(orderId) {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch PayPal order');
  }

  return await response.json();
}

async function createPaypalRefund(orderId, amount) {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const accessToken = await getPayPalAccessToken();

  // First get the capture ID from the order
  const order = await getPaypalOrderStatus(orderId);
  const purchaseUnit = order.purchase_units[0];
  const captureId = purchaseUnit?.payments?.captures?.[0]?.id;

  if (!captureId) {
    throw new Error('No capture found for this order');
  }

  const payload = amount 
    ? { amount: { value: amount.toFixed(2), currency_code: order.purchase_units[0].amount.currency_code } }
    : {};

  const response = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'PayPal refund failed');
  }

  return await response.json();
}

// Webhook verification for PayPal
export async function verifyPayPalWebhook(event, webhookId) {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      auth_algo: event.auth_algo,
      cert_url: event.cert_url,
      transmission_id: event.transmission_id,
      transmission_sig: event.transmission_sig,
      transmission_time: event.transmission_time,
      webhook_id: webhookId,
      webhook_event: event.resource
    })
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

export default {
  getConfiguredGateways,
  createPayment,
  confirmPayment,
  createRefund,
  getPaymentStatus,
  verifyPayPalWebhook,
  isGatewayConfigured
};
