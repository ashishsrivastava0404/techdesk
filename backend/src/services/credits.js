import pool from '../db/index.js';

/**
 * Credit System Service
 * Manages user credits for high/critical priority tickets
 */

class CreditService {
  async getBalance(userName) {
    const [rows] = await pool.query(
      `SELECT value FROM platform_settings WHERE key_name = 'user_credits'`,
      []
    );
    let credits = {};
    if (rows[0]) {
      try { credits = JSON.parse(rows[0].value); } catch { credits = {}; }
    }
    return credits[userName] || 0;
  }

  async setBalance(userName, amount) {
    const [rows] = await pool.query(
      `SELECT value FROM platform_settings WHERE key_name = 'user_credits'`,
      []
    );
    let credits = {};
    if (rows[0]) {
      try { credits = JSON.parse(rows[0].value); } catch { credits = {}; }
    }
    credits[userName] = Math.max(0, amount);
    await pool.query(
      `INSERT INTO platform_settings (key_name, value) VALUES ('user_credits', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [JSON.stringify(credits)]
    );
    return credits[userName];
  }

  async addCredits(userName, amount, reason = 'credit_purchase') {
    const currentBalance = await this.getBalance(userName);
    const newBalance = currentBalance + amount;
    await this.setBalance(userName, newBalance);
    await pool.query(
      `INSERT INTO credit_transactions (user_name, type, amount, balance_after, reason)
       VALUES (?, 'credit', ?, ?, ?)`,
      [userName, amount, newBalance, reason]
    );
    return newBalance;
  }

  async deductCredits(userName, amount, reason = 'ticket_payment') {
    const currentBalance = await this.getBalance(userName);
    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }
    const newBalance = currentBalance - amount;
    await this.setBalance(userName, newBalance);
    await pool.query(
      `INSERT INTO credit_transactions (user_name, type, amount, balance_after, reason)
       VALUES (?, 'debit', ?, ?, ?)`,
      [userName, amount, newBalance, reason]
    );
    return newBalance;
  }

  async transferCredits(fromUser, toUser, amount, note = '') {
    if (fromUser === toUser) throw new Error('Cannot transfer to yourself');
    const fromBalance = await this.getBalance(fromUser);
    if (fromBalance < amount) throw new Error('Insufficient credits');
    const toBalance = await this.getBalance(toUser);

    await pool.query(
      `INSERT INTO credit_transactions (user_name, type, amount, balance_after, reason, related_user)
       VALUES (?, 'transfer_out', ?, ?, ?, ?)`,
      [fromUser, amount, fromBalance - amount, `Transfer to ${toUser}`, toUser]
    );
    await pool.query(
      `INSERT INTO credit_transactions (user_name, type, amount, balance_after, reason, related_user)
       VALUES (?, 'transfer_in', ?, ?, ?, ?)`,
      [toUser, amount, toBalance + amount, `Transfer from ${fromUser}`, fromUser]
    );

    const [rows] = await pool.query(`SELECT value FROM platform_settings WHERE key_name = 'user_credits'`, []);
    let credits = rows[0] ? JSON.parse(rows[0].value) : {};
    credits[fromUser] = fromBalance - amount;
    credits[toUser] = toBalance + amount;
    await pool.query(`INSERT INTO platform_settings (key_name, value) VALUES ('user_credits', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`, [JSON.stringify(credits)]);

    return { fromBalance: fromBalance - amount, toBalance: toBalance + amount };
  }

  async getTransactionHistory(userName, limit = 50) {
    const [rows] = await pool.query(
      `SELECT * FROM credit_transactions WHERE user_name = ? ORDER BY created_at DESC LIMIT ?`,
      [userName, limit]
    );
    return rows;
  }

  async calculateTicketCost(priority, basePay) {
    const costs = { low: 0, normal: 0, high: Math.ceil(basePay * 0.5), urgent: Math.ceil(basePay * 0.75), critical: basePay };
    return costs[priority] || 0;
  }

  async hasEnoughCredits(userName, priority, basePay) {
    const cost = await this.calculateTicketCost(priority, basePay);
    const balance = await this.getBalance(userName);
    return balance >= cost;
  }

  async processTicketPayment(userName, ticketId, priority, basePay) {
    const cost = await this.calculateTicketCost(priority, basePay);
    if (cost === 0) return { paid: false, reason: 'No credit cost for this priority' };
    const balance = await this.getBalance(userName);
    if (balance < cost) throw new Error(`Insufficient credits. Need ${cost}, have ${balance}`);
    await this.deductCredits(userName, cost, `Ticket #${ticketId} payment`);
    return { paid: true, amount: cost, remainingBalance: balance - cost, ticketId };
  }

  async getCreditSettings() {
    const defaults = { high_priority_cost_percent: 50, urgent_priority_cost_percent: 75, critical_priority_cost_percent: 100, normal_priority_agents: 20, min_transfer_amount: 1, max_balance: 10000 };
    const [rows] = await pool.query(`SELECT value FROM platform_settings WHERE key_name = 'credit_settings'`);
    if (rows[0]) {
      try { return { ...defaults, ...JSON.parse(rows[0].value) }; } catch { return defaults; }
    }
    return defaults;
  }

  async updateCreditSettings(settings) {
    const current = await this.getCreditSettings();
    const updated = { ...current, ...settings };
    await pool.query(`INSERT INTO platform_settings (key_name, value) VALUES ('credit_settings', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`, [JSON.stringify(updated)]);
    return updated;
  }
}

export const creditService = new CreditService();
export default creditService;
