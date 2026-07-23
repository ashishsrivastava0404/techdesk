import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { ProtectedRoute, PublicRoute, AdminRoute, TechRoute } from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Cookies from './pages/Cookies.jsx';
import FAQ from './pages/FAQ.jsx';
import Pricing from './pages/Pricing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitTicket from './pages/SubmitTicket.jsx';
import AvailableTickets from './pages/AvailableTickets.jsx';
import MyTickets from './pages/MyTickets.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import MyRequests from './pages/MyRequests.jsx';
import MyLeads from './pages/MyLeads.jsx';
import Earnings from './pages/Earnings.jsx';
import CRM from './pages/CRM.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import EnhancedSettings from './pages/EnhancedSettings.jsx';
import CustomerBilling from './pages/CustomerBilling.jsx';
import Notifications from './pages/Notifications.jsx';
import TicketDetail from './pages/TicketDetail.jsx';
import HelpCenter from './pages/HelpCenter.jsx';
import ChatBot from './components/ChatBot.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import Analytics from './components/Analytics.jsx';

function AppRoutes() {
  const { user, loading } = useApp();
  
  if (loading) {
    return (
      <div className="app-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Default routes based on role
  const getDefaultRoute = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'tech') return '/available';
    return '/dashboard';
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected Routes - All authenticated users */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<SubmitTicket />} />
          <Route path="/available" element={<TechRoute><AvailableTickets /></TechRoute>} />
          <Route path="/mytickets" element={<MyTickets />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/requests" element={<CustomerBilling />} />
          <Route path="/leads" element={<TechRoute><MyLeads /></TechRoute>} />
          <Route path="/earnings" element={<TechRoute><Earnings /></TechRoute>} />
          <Route path="/billing" element={<CustomerBilling />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/help" element={<HelpCenter />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/credits" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/platform-settings" element={<AdminRoute><EnhancedSettings /></AdminRoute>} />
        </Route>

        {/* Redirect root to appropriate page */}
        <Route path="*" element={
          user ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
      {user && <ChatBot />}
      <CookieConsent />
      <Analytics />
    </>
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
