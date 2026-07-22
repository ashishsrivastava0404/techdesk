import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function MyLeads() {
  const { user, showToast } = useApp();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.name) {
      loadLeads();
    }
  }, [user]);

  const loadLeads = async () => {
    try {
      const data = await api.hireRequests.list({ tech_name: user.name });
      setLeads(data);
    } catch (error) {
      showToast('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.hireRequests.update(id, { status });
      showToast(`Request ${status}!`);
      loadLeads();
    } catch (error) {
      showToast(error.message || 'Failed to update request');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">My Leads</h2>
      <p className="view-sub">
        Production support requests customers have sent you.
      </p>

      {leads.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No leads yet</div>
          <p>Keep resolving tickets well — customers find you through the leaderboard.</p>
        </div>
      ) : (
        leads.map(lead => (
          <div key={lead.id} className="ticket-card">
            <div className="t-top">
              <div>
                <span className="t-title">{lead.customer_name}</span>
                <div className="t-meta">{formatDate(lead.created_at)}</div>
              </div>
              <span className={`badge badge-status-${lead.status === 'sent' ? 'open' : lead.status}`}>
                {lead.status}
              </span>
            </div>
            <div className="t-desc">{lead.message}</div>
            <div className="t-desc">
              <strong style={{ color: 'var(--text)' }}>Contact:</strong> {lead.contact}
            </div>
            {lead.status === 'sent' && (
              <div className="t-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUpdateStatus(lead.id, 'accepted')}
                >
                  Accept
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleUpdateStatus(lead.id, 'declined')}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
