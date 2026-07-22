import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function CustomerBilling() {
  const { user, showToast } = useApp();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.name && user?.role === 'customer') {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    try {
      const data = await api.payments.list({ customer_name: user.name });
      setPayments(data);
    } catch (error) {
      showToast('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTotalSpent = () => {
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  };

  if (!user || user.role !== 'customer') {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Billing</div>
          <p>This page is only available for Customer accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading billing history...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">Billing & Payments</h2>
      <p className="view-sub">View your payment history and invoices.</p>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {formatCurrency(getTotalSpent())}
          </div>
          <div className="stat-label">Total Spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {payments.length > 0 ? formatCurrency(getTotalSpent() / payments.length) : '$0'}
          </div>
          <div className="stat-label">Average per Hire</div>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--display)', fontSize: '18px', margin: '32px 0 16px' }}>
        Payment History
      </h3>

      {payments.length === 0 ? (
        <div className="empty" style={{ padding: '40px' }}>
          <div className="empty-title">No payments yet</div>
          <p>Your payment history will appear here after hiring techs for production work.</p>
        </div>
      ) : (
        <div className="panel">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Description</th>
                <th style={{ padding: '12px' }}>Tech</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {formatDate(payment.created_at)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>
                      Production Hire {payment.hire_request_id ? `#${payment.hire_request_id}` : ''}
                    </div>
                    {payment.transaction_id && (
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                        {payment.transaction_id}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{payment.tech_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge badge-status-${payment.status === 'released' ? 'resolved' : payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--amber)' }}>
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel" style={{ marginTop: '32px' }}>
        <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Need Help?</h4>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          For billing inquiries, invoice discrepancies, or refund requests, please contact support.
        </p>
        <button className="btn btn-ghost">Contact Support</button>
      </div>
    </div>
  );
}
