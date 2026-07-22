import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function Layout() {
  const { user, setIdentity, setRole } = useApp();

  const handleNameChange = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const name = e.target.value.trim();
      if (name) {
        setIdentity(name);
      }
    }
  };

  const techTabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/available', label: 'Available' },
    { to: '/mytickets', label: 'My Tickets' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/leads', label: 'My Leads' },
    { to: '/earnings', label: '💰 Earnings' },
    { to: '/crm', label: '📊 CRM' }
  ];

  const customerTabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/submit', label: 'Submit Ticket' },
    { to: '/mytickets', label: 'My Tickets' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/requests', label: 'My Requests' },
    { to: '/billing', label: '💳 Billing' },
    { to: '/crm', label: '📊 CRM' }
  ];

  const adminTabs = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin', label: 'Users', sub: 'users' },
    { to: '/admin', label: 'Payments', sub: 'payments' },
    { to: '/crm', label: 'CRM' },
    { to: '/admin', label: 'Settings', sub: 'settings' }
  ];

  const tabs = user?.role === 'admin' ? adminTabs : (user?.role === 'tech' ? techTabs : customerTabs);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">Pr</div>
          <div className="brand-text">
            <h1>Promote</h1>
            <p>Earn Production Access</p>
          </div>
        </div>

        <div className="identity">
          <input
            type="text"
            placeholder="Your name"
            defaultValue={user?.name || ''}
            onKeyDown={handleNameChange}
            onBlur={handleNameChange}
          />
          <div className="role-toggle">
            <button
              className={user?.role === 'customer' ? 'active' : ''}
              onClick={() => setRole('customer')}
            >
              Customer
            </button>
            <button
              className={user?.role === 'tech' ? 'active' : ''}
              onClick={() => setRole('tech')}
            >
              Tech
            </button>
            <button
              className={user?.role === 'admin' ? 'active' : ''}
              onClick={() => setRole('admin')}
              style={{ fontSize: '11px' }}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab, i) => (
          <NavLink
            key={`${tab.to}-${i}`}
            to={tab.to}
            className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
