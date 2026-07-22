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

  const tabs = user?.role === 'tech' 
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/available', label: 'Available' },
        { to: '/mytickets', label: 'My Tickets' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/leads', label: 'My Leads' }
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/submit', label: 'Submit Ticket' },
        { to: '/mytickets', label: 'My Tickets' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/requests', label: 'My Requests' }
      ];

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
          </div>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
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
