import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function AdminDashboard() {
  const { user, showToast } = useApp();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const data = await api.admin.getDashboard();
        setStats(data);
      } else if (tab === 'users') {
        const data = await api.admin.getUsers();
        setUsers(data);
      } else if (tab === 'payments') {
        const [payData, payoutData] = await Promise.all([
          api.admin.getPayments(),
          api.admin.getPayouts()
        ]);
        setPayments(payData);
        setPayouts(payoutData);
      } else if (tab === 'logs') {
        const data = await api.admin.getLogs({ limit: 50 });
        setLogs(data);
      } else if (tab === 'settings') {
        const data = await api.admin.getSettings();
        setSettings(data);
      }
    } catch (error) {
      showToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await api.admin.updateUser(userId, { status, admin_name: user.name });
      showToast('User updated successfully');
      loadData();
    } catch (error) {
      showToast('Failed to update user');
    }
  };

  const updatePayoutStatus = async (payoutId, status) => {
    try {
      await api.admin.updatePayout(payoutId, { status, admin_name: user.name });
      showToast('Payout updated successfully');
      loadData();
    } catch (error) {
      showToast('Failed to update payout');
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await api.admin.updateSettings(newSettings);
      showToast('Settings updated successfully');
      loadData();
    } catch (error) {
      showToast('Failed to update settings');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Admin Panel</div>
          <p>You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'payments', label: 'Payments & Payouts' },
    { id: 'logs', label: 'Audit Logs' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="view-container">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="view-title" style={{ marginBottom: '4px' }}>Admin Panel</h2>
        <p className="view-sub" style={{ margin: 0 }}>Manage the platform, users, and finances.</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: '60px' }}>Loading...</div>
      ) : (
        <>
          {tab === 'overview' && stats && (
            <div>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.activeTickets}</div>
                  <div className="stat-label">Active Tickets</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--green)' }}>
                    {formatCurrency(stats.revenueThisMonth)}
                  </div>
                  <div className="stat-label">Revenue (This Month)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--amber)' }}>
                    {stats.averageRating.toFixed(1)}★
                  </div>
                  <div className="stat-label">Avg Rating</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
                <div className="panel">
                  <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Users by Role</h4>
                  {Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ textTransform: 'capitalize' }}>{role}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="panel">
                  <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Pending Actions</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <span>Pending Payouts</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{stats.pendingPayouts.count} ({formatCurrency(stats.pendingPayouts.total)})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <span>Disputed Payments</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--red)' }}>{stats.disputedPayments}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>Resolved (This Month)</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{stats.resolvedThisMonth}</span>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ marginTop: '24px' }}>
                <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Total Platform Revenue</h4>
                <div style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                  {formatCurrency(stats.totalPlatformRevenue)}
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>All Users ({users.length})</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left', fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px' }}>Name</th>
                    <th style={{ padding: '8px 12px' }}>Role</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Email</th>
                    <th style={{ padding: '8px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px' }}>{u.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge badge-status-${u.status === 'active' ? 'open' : u.status}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--muted)', fontSize: '13px' }}>{u.email || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        {u.status === 'active' ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => updateUserStatus(u.id, 'suspended')}>Suspend</button>
                        ) : (
                          <button className="btn btn-ghost btn-sm" onClick={() => updateUserStatus(u.id, 'active')}>Activate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'payments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="panel">
                <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Payments ({payments.length})</h4>
                {payments.map(p => (
                  <div key={p.id} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{p.customer_name} → {p.tech_name}</span>
                      <span className={`badge badge-status-${p.status === 'released' ? 'resolved' : p.status}`} style={{ fontSize: '9px' }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
                      <span>{formatDate(p.created_at)}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{formatCurrency(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel">
                <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Payout Requests ({payouts.length})</h4>
                {payouts.map(p => (
                  <div key={p.id} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{p.tech_name}</span>
                      <span className={`badge badge-status-${p.status}`} style={{ fontSize: '9px' }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
                      <span>{formatDate(p.created_at)}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{formatCurrency(p.amount)}</span>
                    </div>
                    {p.status === 'requested' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => updatePayoutStatus(p.id, 'completed')}>Approve</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => updatePayoutStatus(p.id, 'failed')}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Audit Logs ({logs.length})</h4>
              {logs.map(log => (
                <div key={log.id} style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{log.admin_name}</span>
                      <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>{log.action}</span>
                      {log.target_type && <span className="badge badge-dev" style={{ marginLeft: '8px', fontSize: '9px' }}>{log.target_type}</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(log.created_at)}</span>
                  </div>
                  {log.details && (
                    <pre style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', overflow: 'auto' }}>
                      {JSON.stringify(JSON.parse(log.details), null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'settings' && settings && (
            <div className="panel">
              <h4 style={{ fontFamily: 'var(--display)', marginBottom: '24px' }}>Platform Settings</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateSettings({
                  commission_rate: parseFloat(e.target.commission.value),
                  minimum_payout: parseFloat(e.target.minPayout.value),
                  dev_ticket_pay: parseFloat(e.target.devPay.value),
                  staging_ticket_pay: parseFloat(e.target.stagingPay.value)
                });
              }}>
                <div className="form-group">
                  <label>Commission Rate</label>
                  <input type="number" name="commission" step="0.01" min="0" max="1" defaultValue={settings.commission_rate} />
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Platform fee percentage (e.g., 0.15 = 15%)</span>
                </div>
                <div className="form-group">
                  <label>Minimum Payout</label>
                  <input type="number" name="minPayout" step="0.01" min="0" defaultValue={settings.minimum_payout} />
                </div>
                <div className="form-group">
                  <label>Dev Ticket Pay</label>
                  <input type="number" name="devPay" step="0.01" min="0" defaultValue={settings.dev_ticket_pay} />
                </div>
                <div className="form-group">
                  <label>Staging Ticket Pay</label>
                  <input type="number" name="stagingPay" step="0.01" min="0" defaultValue={settings.staging_ticket_pay} />
                </div>
                <button type="submit" className="btn btn-primary">Save Settings</button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
