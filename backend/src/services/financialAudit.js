import pool from '../db/index.js';

/**
 * Financial Audit Service
 * 
 * Logs all financial transactions for compliance and tracking.
 * Captures: payments, payouts, refunds, disputes, credits, fees
 */

export const TransactionTypes = {
  PAYMENT: 'payment',
  PAYOUT: 'payout',
  REFUND: 'refund',
  DISPUTE: 'dispute',
  CREDIT: 'credit',
  FEE: 'fee',
  ADJUSTMENT: 'adjustment'
};

export const TransactionActions = {
  // Payment actions
  PAYMENT_CREATED: 'payment_created',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_HELD: 'payment_held',
  PAYMENT_RELEASED: 'payment_released',
  PAYMENT_DISPUTED: 'payment_disputed',
  PAYMENT_RESOLVED: 'payment_resolved',
  
  // Payout actions
  PAYOUT_REQUESTED: 'payout_requested',
  PAYOUT_APPROVED: 'payout_approved',
  PAYOUT_REJECTED: 'payout_rejected',
  PAYOUT_PROCESSING: 'payout_processing',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
  
  // Refund actions
  REFUND_INITIATED: 'refund_initiated',
  REFUND_COMPLETED: 'refund_completed',
  REFUND_FAILED: 'refund_failed',
  
  // Credit actions
  CREDIT_ISSUED: 'credit_issued',
  CREDIT_USED: 'credit_used',
  CREDIT_REFUNDED: 'credit_refunded',
  
  // Fee actions
  FEE_COLLECTED: 'fee_collected',
  FEE_REVERSED: 'fee_reversed',
  
  // Adjustment actions
  ADJUSTMENT_MADE: 'adjustment_made'
};

/**
 * Log a financial transaction
 */
export async function logFinancialTransaction({
  transactionType,
  transactionId,
  action,
  previousStatus = null,
  newStatus = null,
  amount = null,
  currency = 'USD',
  platformFee = 0,
  techAmount = 0,
  customerId = null,
  techId = null,
  adminId = null,
  adminName = null,
  details = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO financial_audit_logs (
        transaction_type, transaction_id, action, previous_status, new_status,
        amount, currency, platform_fee, tech_amount,
        customer_id, tech_id, admin_id, admin_name,
        details, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionType,
        transactionId,
        action,
        previousStatus,
        newStatus,
        amount,
        currency,
        platformFee,
        techAmount,
        customerId,
        techId,
        adminId,
        adminName,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      ]
    );
    
    console.log(`📒 Financial Audit: ${transactionType} #${transactionId} - ${action} - $${amount || 0}`);
    return result.insertId;
  } catch (error) {
    console.error('Failed to log financial transaction:', error);
    throw error;
  }
}

/**
 * Get financial audit trail for a specific transaction
 */
export async function getAuditTrail(transactionType, transactionId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM financial_audit_logs 
       WHERE transaction_type = ? AND transaction_id = ?
       ORDER BY created_at DESC`,
      [transactionType, transactionId]
    );
    return rows;
  } catch (error) {
    console.error('Failed to get audit trail:', error);
    throw error;
  }
}

/**
 * Get financial audit logs with filters
 */
export async function getFinancialAuditLogs({
  transactionType = null,
  transactionId = null,
  techId = null,
  customerId = null,
  adminId = null,
  startDate = null,
  endDate = null,
  limit = 100,
  offset = 0
}) {
  try {
    let query = 'SELECT * FROM financial_audit_logs WHERE 1=1';
    const params = [];

    if (transactionType) {
      query += ' AND transaction_type = ?';
      params.push(transactionType);
    }
    if (transactionId) {
      query += ' AND transaction_id = ?';
      params.push(transactionId);
    }
    if (techId) {
      query += ' AND tech_id = ?';
      params.push(techId);
    }
    if (customerId) {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (adminId) {
      query += ' AND admin_id = ?';
      params.push(adminId);
    }
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Failed to get financial audit logs:', error);
    throw error;
  }
}

/**
 * Get financial summary for a period
 */
export async function getFinancialSummary({ startDate, endDate }) {
  try {
    const [paymentSummary] = await pool.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        SUM(platform_fee) as total_fees,
        SUM(CASE WHEN new_status = 'completed' THEN amount ELSE 0 END) as completed_volume,
        SUM(CASE WHEN new_status = 'disputed' THEN amount ELSE 0 END) as disputed_volume,
        SUM(CASE WHEN new_status = 'failed' THEN amount ELSE 0 END) as failed_volume
       FROM financial_audit_logs 
       WHERE transaction_type = 'payment'
       AND action IN ('payment_completed', 'payment_failed', 'payment_disputed')
       AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [payoutSummary] = await pool.query(
      `SELECT 
        COUNT(*) as total_payouts,
        SUM(amount) as total_payout_volume
       FROM financial_audit_logs 
       WHERE transaction_type = 'payout'
       AND action = 'payout_completed'
       AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    return {
      payments: paymentSummary[0],
      payouts: payoutSummary[0]
    };
  } catch (error) {
    console.error('Failed to get financial summary:', error);
    throw error;
  }
}

/**
 * Get all tech earnings audit trail
 */
export async function getTechEarningsAudit(techId, limit = 100) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM financial_audit_logs 
       WHERE tech_id = ? AND transaction_type IN ('payment', 'payout')
       ORDER BY created_at DESC LIMIT ?`,
      [techId, limit]
    );
    return rows;
  } catch (error) {
    console.error('Failed to get tech earnings audit:', error);
    throw error;
  }
}

export default {
  logFinancialTransaction,
  getAuditTrail,
  getFinancialAuditLogs,
  getFinancialSummary,
  getTechEarningsAudit,
  TransactionTypes,
  TransactionActions
};
