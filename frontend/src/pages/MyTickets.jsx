import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import TicketCard from '../components/TicketCard.jsx';
import RatingModal from '../components/RatingModal.jsx';

const FILTERS = ['all', 'open', 'claimed', 'resolved', 'closed'];

export default function MyTickets() {
  const { user, showToast, requireName } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ratingTicket, setRatingTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    try {
      const params = user.role === 'tech' 
        ? { tech_name: user.name }
        : { customer_name: user.name };
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
