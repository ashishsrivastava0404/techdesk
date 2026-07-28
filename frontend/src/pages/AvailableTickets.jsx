import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import TicketCard from '../components/TicketCard.jsx';

export default function AvailableTickets() {
  const { user, showToast, requireName } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    try {
      const data = await api.tickets.list({ status: 'open' });
      setTickets(data);
    } catch (error) {
      showToast('Failed to load tickets');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <h2 className="view-title">🔧 Technical Support Tickets</h2>
      <p className="view-sub">
        Pick up technical tickets that match your expertise. Claim and resolve bugs, infrastructure issues, or code problems.
      </p>
      
      <div style={{
        padding: '12px 16px',
        background: 'var(--amber-dim)',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>ℹ️</span>
        <small>Only technical tickets are shown here. For account, billing, or login issues, please contact admin.</small>
      </div>

      {tickets.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No tickets available</div>
          <p>Check back later for new tickets.</p>
        </div>
      ) : (
        tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            actions={
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleClaim(ticket.id)}
              >
                Claim
              </button>
            }
          />
        ))
      )}
    </div>
  );
}
