import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function MyRequests() {
  const { user, showToast, requireName } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.name) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const data = await api.hireRequests.list({ customer_name: user.name });
      setRequests(data);
    } catch (error) {
      showToast('Failed to load requests');
    } finally {
      setLoading(false);
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
        <div className="empty">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">My Requests</h2>
      <p className="view-sub">
        Production support requests you've sent to techs.
      </p>

      {requests.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No requests yet</div>
          <p>Find a Production-Ready tech on the leaderboard to get started.</p>
        </div>
      ) : (
        requests.map(request => (
          <div key={request.id} className="ticket-card">
            <div className="t-top">
              <div>
                <span className="t-title">{request.tech_name}</span>
                <div className="t-meta">{formatDate(request.created_at)}</div>
              </div>
              <span className={`badge badge-status-${request.status === 'sent' ? 'open' : request.status}`}>
                {request.status}
              </span>
            </div>
            <div className="t-desc">{request.message}</div>
            <div className="t-desc">
              <strong style={{ color: 'var(--text)' }}>Contact:</strong> {request.contact}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
