import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useBrand } from '../context/BrandContext.jsx';
import { api } from '../api/index.js';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Dashboard() {
  const { user, showToast } = useApp();
  const { brand } = useBrand();
  const appName = brand.app_name || 'TechDesk';
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.name) {
      loadStats();
    }
    loadLeaderboard();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await api.stats.get(user.name);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await api.users.leaderboard();
      setLeaderboard(data.slice(0, 3));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      // Export based on user role
      if (user.role === 'tech') {
        params.append('tech_name', user.name);
      } else {
        params.append('customer_name', user.name);
      }
      
      const response = await fetch(`/api/tickets/export?${params}`, { headers: getAuthHeaders() });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Export completed');
    } catch (error) {
      showToast('Failed to export tickets');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (!user) {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Welcome to {appName}</div>
          <p>Enter your name above to get started.</p>
        </div>
      </div>
    );
  }

  const isTech = user.role === 'tech';

  return (
    <div className="view-container">
      <h2 className="view-title">
        {isTech ? 'Tech Dashboard' : 'Customer Dashboard'}
      </h2>
      <p className="view-sub">
        {isTech 
          ? 'Resolve tickets, earn ratings, and climb the production ladder.'
          : 'Submit tickets, get them resolved, and hire Production-Ready techs.'}
      </p>

      <div className="stats-grid">
        {isTech ? (
          <>
            <div className="stat-card">
              <div className="stat-value">{stats?.openTickets || 0}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.claimedTickets || 0}</div>
              <div className="stat-label">Claimed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.totalResolved || 0}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avgRating ? `${stats.avgRating}★` : '—'}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.composite || 0}</div>
              <div className="stat-label">{stats?.tier || 'Dev'} Tier</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.incomingLeads || 0}</div>
              <div className="stat-label">Leads</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-value">{stats?.openTickets || 0}</div>
              <div className="stat-label">Open Tickets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.resolvedTickets || 0}</div>
              <div className="stat-label">Resolved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.pendingRequests || 0}</div>
              <div className="stat-label">Pending Requests</div>
            </div>
          </>
        )}
      </div>

      {isTech && leaderboard.length > 0 && (
        <>
          <h2 className="view-title" style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>
            Top Techs
          </h2>
          {leaderboard.map((tech, i) => (
            <div key={tech.name} className="tech-card" style={{ gridTemplateColumns: '48px 1fr auto' }}>
              <div className="rank-num">#{i + 1}</div>
              <div>
                <div className="tech-name">{tech.name}</div>
                <div className="tech-sub">
                  {tech.count} rated · {tech.avgRating ? `${tech.avgRating}★ avg` : 'no ratings'}
                </div>
              </div>
              <div className="score-col">
                <div className="score-num">{tech.composite}</div>
                <span className={`tier-tag tier-${tech.tier.replace(/\s/g, '-')}`}>{tech.tier}</span>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to={isTech ? '/available' : '/submit'}>
          <button className="btn btn-primary">
            {isTech ? 'View Available Tickets' : 'Submit New Ticket'}
          </button>
        </Link>
        <button
          className="btn btn-ghost"
          onClick={handleExportCSV}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : '📊 Export to CSV'}
        </button>
      </div>
    </div>
  );
}
