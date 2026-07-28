import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import TicketCard from '../components/TicketCard.jsx';
import RatingModal from '../components/RatingModal.jsx';

const FILTERS = ['all', 'open', 'claimed', 'resolved', 'closed'];

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function MyTickets() {
  const { user, showToast, requireName } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ratingTicket, setRatingTicket] = useState(null);
  
  // Advanced search state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    priorities: [],
    environments: [],
    dateRange: ''
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    priority: '',
    environment: '',
    date_range: ''
  });

  useEffect(() => {
    loadTickets();
    loadFilters();
  }, [user]);

  // Reload tickets when filters change
  useEffect(() => {
    loadTickets();
  }, [filter, advancedFilters]);

  // Load filter options from backend
  const loadFilters = async () => {
    try {
      const response = await fetch('/api/search/filters', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setFilters({
          categories: data.categories || [],
          priorities: data.priorities || [],
          environments: data.environments || [],
          dateRanges: data.date_ranges || []
        });
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadTickets = async () => {
    try {
      // Build query params
      const params = {};
      
      if (user.role === 'tech') {
        params.tech_name = user.name;
      } else {
        params.customer_name = user.name;
      }
      
      // Apply basic filter
      if (filter !== 'all') {
        params.status = filter;
      }
      
      // Apply advanced filters
      if (advancedFilters.category) {
        params.category = advancedFilters.category;
      }
      if (advancedFilters.priority) {
        params.priority = advancedFilters.priority;
      }
      if (advancedFilters.environment) {
        params.environment = advancedFilters.environment;
      }
      if (advancedFilters.date_range) {
        params.date_range = advancedFilters.date_range;
      }
      
      const data = await api.tickets.list(params);
      setTickets(data);
    } catch (error) {
      showToast('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticket) => {
    try {
      await api.tickets.update(ticket.id, { status: 'resolved' });
      showToast('Marked as resolved!');
      loadTickets();
    } catch (error) {
      showToast(error.message || 'Failed to resolve ticket');
    }
  };

  const handleClaim = async (ticketId) => {
    if (!requireName()) return;
    
    try {
      await api.tickets.update(ticketId, {
        status: 'claimed',
        tech_name: user.name
      });
      showToast('Ticket claimed!');
      loadTickets();
    } catch (error) {
      showToast(error.message || 'Failed to claim ticket');
    }
  };

  const handleRate = (ticket) => {
    setRatingTicket(ticket);
  };

  const handleRatingSubmit = async (rating, comment) => {
    if (!ratingTicket) return;
    
    try {
      await api.ratings.create({
        ticket_id: ratingTicket.id,
        tech_name: ratingTicket.tech_name,
        rating,
        comment
      });
      await api.tickets.update(ratingTicket.id, { status: 'closed' });
      showToast('Thanks — rating submitted.');
      setRatingTicket(null);
      loadTickets();
    } catch (error) {
      showToast(error.message || 'Failed to submit rating');
    }
  };

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">My Tickets</h2>
      <p className="view-sub">
        {user.role === 'tech' 
          ? 'Tickets you\'ve claimed and resolved.'
          : 'Your submitted tickets and their status.'}
      </p>

      <div className="status-filter">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced Search Expander */}
      <div style={{ marginTop: '16px' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Search
        </button>
        
        {showAdvanced && (
          <div className="panel" style={{ marginTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div className="field">
                <label>Category</label>
                <select
                  value={advancedFilters.category}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {filters.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="field">
                <label>Priority</label>
                <select
                  value={advancedFilters.priority}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="">All Priorities</option>
                  {filters.priorities.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="field">
                <label>Environment</label>
                <select
                  value={advancedFilters.environment}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, environment: e.target.value }))}
                >
                  <option value="">All Environments</option>
                  {filters.environments.map(env => (
                    <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="field">
                <label>Date Range</label>
                <select
                  value={advancedFilters.date_range}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, date_range: e.target.value }))}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {(advancedFilters.category || advancedFilters.priority || advancedFilters.environment || advancedFilters.date_range) && (
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAdvancedFilters({
                    category: '',
                    priority: '',
                    environment: '',
                    date_range: ''
                  })}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No tickets</div>
          <p>
            {filter === 'all' 
              ? (user.role === 'tech' 
                  ? 'You haven\'t claimed any tickets yet.' 
                  : 'You haven\'t submitted any tickets yet.')
              : `No ${filter} tickets.`}
          </p>
        </div>
      ) : (
        filteredTickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            showTech={user.role === 'customer'}
            onResolve={user.role === 'tech' ? handleResolve : undefined}
            onRate={user.role === 'customer' ? handleRate : undefined}
            actions={
              ticket.status === 'open' && user.role === 'tech' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleClaim(ticket.id)}
                >
                  Claim
                </button>
              )
            }
          />
        ))
      )}

      {ratingTicket && (
        <RatingModal
          ticket={ratingTicket}
          onSubmit={handleRatingSubmit}
          onClose={() => setRatingTicket(null)}
        />
      )}
    </div>
  );
}
