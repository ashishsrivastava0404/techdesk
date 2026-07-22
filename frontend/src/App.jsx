import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitTicket from './pages/SubmitTicket.jsx';
import AvailableTickets from './pages/AvailableTickets.jsx';
import MyTickets from './pages/MyTickets.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import MyRequests from './pages/MyRequests.jsx';
import MyLeads from './pages/MyLeads.jsx';

function AppRoutes() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    );
  }

  const defaultTab = user?.role === 'tech' ? 'available' : 'submit';

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={`/${defaultTab}`} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="submit" element={<SubmitTicket />} />
        <Route path="available" element={<AvailableTickets />} />
        <Route path="mytickets" element={<MyTickets />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="leads" element={<MyLeads />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
