import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function Layout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

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
    { to: '/admin/settings', label: 'Settings' }
  ];

  const tabs = user?.role === 'admin' ? adminTabs : (user?.role === 'tech' ? techTabs : customerTabs);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <NavLink to="/dashboard" className="brand-link">
            <div className="brand-mark">Pr</div>
            <div className="brand-text">
              <h1>Promote</h1>
              <p>Earn Production Access</p>
            </div>
          </NavLink>
        </div>

        <div className="user-menu">
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
          Notifications
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
    </div>
  );
}
