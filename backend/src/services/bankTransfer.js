/**
 * Bank Transfer Service
 * Handles ACH/wire transfers to bank accounts
 */

class BankTransferService {
  constructor() {
    this.configured = () => !!(
      process.env.BANK_API_KEY &&
      process.env.BANK_API_SECRET &&
      process.env.BANK_ACCOUNT_ID
    );
  }

  /**
   * Process ACH transfer to bank account
   */
  async processACHTransfer(toBankDetails, amount, techName, payoutId) {
    if (!this.configured()) {
      console.log('Bank API not configured, simulating ACH transfer');
      // Simulate for demo
      return this.simulateTransfer(toBankDetails, amount, techName, payoutId, 'ach');
    }

    try {
      // In production, integrate with services like:
      // - Plaid for bank account verification
      // - Stripe ACH
      // - Dwolla
      // - SynapsePay
      
      const transferId = `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        transferId,
        type: 'ach',
        amount,
        status: 'pending',
        estimatedArrival: this.getEstimatedArrival('ach'),
        bankName: toBankDetails.bankName,
        accountLast4: toBankDetails.accountNumber.slice(-4),
        message: 'ACH transfer initiated. Funds typically arrive in 1-3 business days.'
      };
    } catch (error) {
      console.error('Bank transfer error:', error);
      throw error;
    }
  }

  /**
   * Process Wire transfer
   */
  async processWireTransfer(toBankDetails, amount, techName, payoutId) {
    const transferId = `wire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      transferId,
      type: 'wire',
      amount,
      status: 'pending',
      estimatedArrival: this.getEstimatedArrival('wire'),
      bankName: toBankDetails.bankName,
      accountLast4: toBankDetails.accountNumber.slice(-4),
      routingNumber: toBankDetails.routingNumber,
      message: 'Wire transfer initiated. Funds typically arrive same day or next business day.'
    };
  }

  /**
   * Get estimated arrival date
   */
  getEstimatedArrival(type) {
    const days = type === 'wire' ? 1 : 3;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Verify bank account (via Plaid or similar)
   */
  async verifyBankAccount(accountId, routingNumber, accountNumber) {
    // In production, use Plaid, Stripe, or similar service
    // For demo, just validate format
    if (!routingNumber || routingNumber.length !== 9) {
      throw new Error('Invalid routing number');
    }
    if (!accountNumber || accountNumber.length < 4) {
      throw new Error('Invalid account number');
    }
    
    return {
      verified: true,
      accountLast4: accountNumber.slice(-4),
      routingNumber,
      message: 'Bank account verified'
    };
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId) {
    // In production, query the bank API for status
    return {
      transferId,
      status: 'completed', // Simulated
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simulate transfer for demo purposes
   */
  simulateTransfer(toBankDetails, amount, techName, payoutId, type) {
    const transferId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║           SIMULATED BANK TRANSFER                        ║
    ╠═══════════════════════════════════════════════════════════╣
    ║  Payout ID:      ${payoutId}
    ║  Tech Name:       ${techName}
    ║  Amount:          $${amount.toFixed(2)}
    ║  Transfer Type:   ${type.toUpperCase()}
    ║  Bank:            ${toBankDetails.bankName}
    ║  Account:         ****${toBankDetails.accountNumber.slice(-4)}
    ║  Status:          PENDING (Simulated)
    ║  Est. Arrival:    ${this.getEstimatedArrival(type)}
    ╚═══════════════════════════════════════════════════════════╝
    `);

    return {
      transferId,
      type,
      amount,
      status: 'pending',
      estimatedArrival: this.getEstimatedArrival(type),
      simulated: true,
      message: `Simulated ${type.toUpperCase()} transfer of $${amount.toFixed(2)} to ${toBankDetails.bankName} ****${toBankDetails.accountNumber.slice(-4)}`
    };
  }
}

export const bankTransferService = new BankTransferService();
export default bankTransferService;
