import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import PayoutModal from '../components/PayoutModal.jsx';

export default function Earnings() {
  const { user, showToast } = useApp();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    if (user?.name && user?.role === 'tech') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [summaryData, txData, payoutData] = await Promise.all([
        api.earnings.getSummary(user.name),
        api.earnings.getTransactions(user.name),
        api.earnings.getPayouts(user.name)
      ]);
      setSummary(summaryData);
      setTransactions(txData);
      setPayouts(payoutData);
    } catch (error) {
      showToast('Failed to load earnings data');
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

  if (!user || user.role !== 'tech') {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Earnings Dashboard</div>
          <p>This page is only available for Tech accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading earnings...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">My Earnings</h2>
      <p className="view-sub">Track your income, request payouts, and manage your finances.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            {formatCurrency(summary?.totalEarned || 0)}
          </div>
          <div className="stat-label">Total Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {formatCurrency(summary?.availableBalance || 0)}
          </div>
          <div className="stat-label">Available Balance</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--blue)' }}>
            {formatCurrency(summary?.pendingPayments || 0)}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {formatCurrency(summary?.thisMonth || 0)}
          </div>
          <div className="stat-label">This Month</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowPayoutModal(true)}
          disabled={(summary?.availableBalance || 0) < 25}
        >
          Request Payout
        </button>
        {(summary?.availableBalance || 0) < 25 && (
          <span style={{ marginLeft: '12px', color: 'var(--muted)', fontSize: '13px' }}>
            Minimum payout is $25.00
          </span>
        )}
      </div>

      <h3 style={{ fontFamily: 'var(--display)', fontSize: '18px', marginBottom: '16px' }}>
        Transaction History
      </h3>

      {transactions.length === 0 ? (
        <div className="empty" style={{ padding: '30px' }}>
          <div className="empty-title">No transactions yet</div>
          <p>Complete tickets and production hires to start earning.</p>
        </div>
      ) : (
        <div className="panel">
          {transactions.map(tx => (
            <div key={tx.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--line)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{tx.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {formatDate(tx.created_at)} · <span className={`badge badge-status-${tx.status === 'available' ? 'open' : tx.status}`} style={{ fontSize: '10px' }}>{tx.status}</span>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '16px',
                fontWeight: 600,
                color: tx.amount >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontFamily: 'var(--display)', fontSize: '18px', margin: '24px 0 16px' }}>
        Payout History
      </h3>

      {payouts.length === 0 ? (
        <div className="empty" style={{ padding: '30px' }}>
          <div className="empty-title">No payouts yet</div>
          <p>Your payout history will appear here.</p>
        </div>
      ) : (
        <div className="panel">
          {payouts.map(payout => (
            <div key={payout.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--line)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {payout.method.charAt(0).toUpperCase() + payout.method.slice(1)} Payout
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {formatDate(payout.created_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--amber)'
                }}>
                  -{formatCurrency(payout.amount)}
                </div>
                <span className={`badge badge-status-${payout.status === 'completed' ? 'resolved' : payout.status}`} style={{ fontSize: '10px' }}>
                  {payout.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPayoutModal && (
        <PayoutModal
          availableBalance={summary?.availableBalance || 0}
          onSubmit={async (amount, method, details) => {
            try {
              await api.earnings.requestPayout({
                tech_name: user.name,
                amount,
                method,
                payout_details: details
              });
              showToast('Payout requested successfully!');
              setShowPayoutModal(false);
              loadData();
            } catch (error) {
              showToast(error.message || 'Failed to request payout');
            }
          }}
          onClose={() => setShowPayoutModal(false)}
        />
      )}
    </div>
  );
}
