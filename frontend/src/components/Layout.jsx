import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useBrand } from '../context/BrandContext.jsx';
import api from '../api';

export default function Layout() {
  const { user, logout } = useApp();
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notification count every 30 seconds
  useEffect(() => {
    if (!user?.name) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await api.notifications.getCount(user.name);
        setUnreadCount(count?.unread || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.name]);

  // Listen for new notifications
  useEffect(() => {
    const handleNewNotification = () => {
      if (user?.name) {
        api.notifications.getCount(user.name).then(count => {
          setUnreadCount(count?.unread || 0);
        }).catch(console.error);
      }
    };

    window.addEventListener('new-notification', handleNewNotification);
    return () => window.removeEventListener('new-notification', handleNewNotification);
  }, [user?.name]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const techTabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/available', label: 'Available' },
    { to: '/mytickets', label: 'My Tickets' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/leads', label: 'My Leads' },
    { to: '/earnings', label: 'Earnings' },
    { to: '/crm', label: 'CRM' }
  ];

  const customerTabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/submit', label: 'Submit Ticket' },
    { to: '/mytickets', label: 'My Tickets' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/requests', label: 'My Requests' },
    { to: '/billing', label: 'Billing' },
    { to: '/crm', label: 'CRM' }
  ];

  const adminTabs = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/payments', label: 'Payments' },
    { to: '/admin/credits', label: 'Credits' },
    { to: '/admin/analytics', label: 'Analytics' },
    { to: '/admin/support-reports', label: '📋 Reports' },
    { to: '/admin/settings', label: 'Settings' }
  ];

  const tabs = user?.role === 'admin' ? adminTabs : (user?.role === 'tech' ? techTabs : customerTabs);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <NavLink to="/dashboard" className="brand-link">
            {brand.app_logo_url ? (
              <img src={brand.app_logo_url} alt={brand.app_name} className="brand-logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            ) : (
              <div className="brand-mark">{brand.app_name?.substring(0, 2).toUpperCase() || 'TD'}</div>
            )}
            <div className="brand-text">
              <h1>{brand.app_name || 'TechDesk'}</h1>
              <p>{brand.company_name || ''}</p>
            </div>
          </NavLink>
        </div>

        <div className="user-menu">
          <NavLink to="/notifications" className="notification-bell" title="Notifications">
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </NavLink>
          <span className="user-name">
            {user?.name || 'Guest'}
            <span className="user-role">{user?.role}</span>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab, i) => (
          <NavLink
            key={`${tab.to}-${i}`}
            to={tab.to}
            end={tab.to === '/dashboard' || tab.to === '/admin'}
            className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
        <NavLink
          to="/notifications"
          className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
        >
          Notifications {unreadCount > 0 && `(${unreadCount > 99 ? '99+' : unreadCount})`}
        </NavLink>
        <NavLink
          to="/help"
          className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
        >
          Help
        </NavLink>
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Floating Report Issue Button */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openReportIssue'))}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--amber)',
          color: '#000',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Report an Issue"
      >
        🐛
      </button>

      <style>{`
        .notification-bell {
          position: relative;
          font-size: 1.25rem;
          text-decoration: none;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .notification-bell:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: bold;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
