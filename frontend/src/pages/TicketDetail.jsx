import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function TicketDetail({ ticket, onClose, onUpdate }) {
  const { user, showToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('discussion');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isCustomer = user?.name === ticket.customer_name;
  const isTech = user?.name === ticket.tech_name;
  const isAdmin = user?.role === 'admin';
  const canViewDiscussion = isCustomer || isTech || isAdmin;

  useEffect(() => {
    if (canViewDiscussion && ticket.id) {
      loadMessages();
      loadHistory();
    }
  }, [ticket.id, canViewDiscussion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.discussions.get(ticket.id, user?.name, user?.role);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.ticketHistory.get(ticket.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await api.discussions.send({
        ticket_id: ticket.id,
        sender_name: user.name,
        sender_role: user.role,
        content: newMessage
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      showToast('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.tickets.update(ticket.id, {
        status: newStatus,
        tech_name: user.role === 'tech' ? user.name : ticket.tech_name,
        actor_name: user.name,
        actor_role: user.role
      });
      showToast(`Ticket marked as ${newStatus}`);
      onUpdate && onUpdate();
      loadHistory();
    } catch (error) {
      showToast('Failed to update status');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const priorityColors = {
    critical: 'var(--red)',
    urgent: '#f59e0b',
    high: '#ef4444',
    normal: 'var(--amber)',
    low: 'var(--muted)'
  };

  const statusIcons = {
    open: '📋',
    claimed: '✋',
    in_progress: '🔧',
    resolved: '✅',
    closed: '🔒',
    rejected: '❌'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{statusIcons[ticket.status]}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Ticket #{ticket.id}</h3>
              <span style={{ 
                fontSize: '12px', 
                color: priorityColors[ticket.priority],
                fontWeight: 600
              }}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
          {/* Ticket Info */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: '20px', marginBottom: '8px' }}>{ticket.title}</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span className={`badge badge-env-${ticket.environment}`}>{ticket.environment}</span>
              <span className={`badge badge-status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
              <span className="badge" style={{ background: priorityColors[ticket.priority], color: 'white' }}>{ticket.category}</span>
            </div>
          </div>

          {/* SLA Info */}
          {ticket.sla_due_at && (
            <div style={{
              padding: '12px',
              background: 'var(--surface-2)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>SLA Due: </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>
                  {formatDate(ticket.sla_due_at)}
                </span>
              </div>
              <span className={`badge badge-status-${ticket.sla_status}`}>{ticket.sla_status.replace('_', ' ')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {isTech && ticket.status === 'open' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange('claimed')}>
                Claim Ticket
              </button>
            )}
            {isTech && ticket.status === 'claimed' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange('in_progress')}>
                Start Work
              </button>
            )}
            {isTech && ticket.status === 'in_progress' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange('resolved')}>
                Mark Resolved
              </button>
            )}
            {(isCustomer || isTech) && ticket.status === 'resolved' && (
              <button className="btn btn-ghost" onClick={() => handleStatusChange('closed')}>
                Close Ticket
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: '16px' }}>
            <button className={`tab ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
              💬 Discussion
            </button>
            <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              📋 Details
            </button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              📜 History
            </button>
          </div>

          {/* Discussion Tab */}
          {activeTab === 'discussion' && (
            <div>
              {!canViewDiscussion ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                  Discussion is only visible to the customer and assigned tech.
                </div>
              ) : (
                <>
                  <div style={{
                    height: '300px',
                    overflowY: 'auto',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} style={{
                          marginBottom: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.sender_name === user?.name ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: msg.sender_name === user?.name ? 'var(--amber)' : 'var(--panel)',
                            color: msg.sender_name === user?.name ? '#1A1206' : 'var(--text)'
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', opacity: 0.8 }}>
                              {msg.sender_name} {msg.sender_role !== 'system' && <span>({msg.sender_role})</span>}
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{msg.content}</div>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
                            {formatDate(msg.created_at)}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || !newMessage.trim()}>
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Description</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{ticket.description}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Customer</div>
                  <div style={{ fontWeight: 600 }}>{ticket.customer_name}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Assigned Tech</div>
                  <div style={{ fontWeight: 600 }}>{ticket.tech_name || 'Unassigned'}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Created</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{formatDate(ticket.created_at)}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Resolved</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>
                    {ticket.resolved_at ? formatDate(ticket.resolved_at) : 'Not resolved'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                  No history yet
                </div>
              ) : (
                history.map(entry => (
                  <div key={entry.id} style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      {entry.actor_role === 'tech' ? '🔧' : entry.actor_role === 'admin' ? '👨‍💼' : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{entry.actor_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(entry.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {entry.action === 'updated' ? (
                          <>Changed <strong>{entry.field_changed}</strong> from "{entry.old_value}" to "{entry.new_value}"</>
                        ) : (
                          entry.action
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
