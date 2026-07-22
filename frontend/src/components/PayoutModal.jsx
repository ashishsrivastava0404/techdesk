import { useState } from 'react';

export default function PayoutModal({ availableBalance, onSubmit, onClose }) {
  const [amount, setAmount] = useState(Math.min(availableBalance, 100));
  const [method, setMethod] = useState('stripe');
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount > availableBalance || amount < 25) return;
    setLoading(true);
    await onSubmit(amount, method, details);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Payout</h3>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Available Balance</label>
            <div className="balance-display">
              ${availableBalance.toFixed(2)}
            </div>
          </div>
          <div className="form-group">
            <label>Amount to Withdraw</label>
            <input
              type="number"
              min="25"
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Minimum: $25.00
            </span>
          </div>
          <div className="form-group">
            <label>Payout Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          {method === 'stripe' && (
            <div className="form-group">
              <label>Stripe Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                onChange={e => setDetails({ ...details, email: e.target.value })}
                required
              />
            </div>
          )}
          {method === 'paypal' && (
            <div className="form-group">
              <label>PayPal Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                onChange={e => setDetails({ ...details, email: e.target.value })}
                required
              />
            </div>
          )}
          {method === 'bank' && (
            <>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  placeholder="Bank Name"
                  onChange={e => setDetails({ ...details, bankName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  onChange={e => setDetails({ ...details, accountNumber: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Routing Number</label>
                <input
                  type="text"
                  placeholder="Routing Number"
                  onChange={e => setDetails({ ...details, routingNumber: e.target.value })}
                  required
                />
              </div>
            </>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || amount < 25 || amount > availableBalance}
            >
              {loading ? 'Processing...' : 'Request Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
