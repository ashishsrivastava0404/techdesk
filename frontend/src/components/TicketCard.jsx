export default function TicketCard({ ticket, actions, showTech = false, onResolve, onRate }) {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ticket-card">
      <div className="t-top">
        <div>
          <span className="ticket-id">#{ticket.id}</span>
          <span className="t-title">{ticket.title}</span>
          <div className="t-meta">
            {formatDate(ticket.created_at)} · {ticket.customer_name}
            {showTech && ticket.tech_name && ` · Tech: ${ticket.tech_name}`}
          </div>
        </div>
        <div className="badge-row">
          <span className={`badge badge-env-${ticket.environment}`}>
            {ticket.environment}
          </span>
          <span className={`badge badge-status-${ticket.status}`}>
            {ticket.status}
          </span>
          {ticket.priority === 'high' && (
            <span className="badge badge-priority-high">High</span>
          )}
        </div>
      </div>
      <div className="t-desc">{ticket.description}</div>
      <div className="t-actions">
        {actions}
        {onResolve && ticket.status === 'claimed' && (
          <button className="btn btn-ghost btn-sm" onClick={() => onResolve(ticket)}>
            Mark Resolved
          </button>
        )}
        {onRate && ticket.status === 'resolved' && (
          <button className="btn btn-primary btn-sm" onClick={() => onRate(ticket)}>
            Rate
          </button>
        )}
      </div>
    </div>
  );
}
