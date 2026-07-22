import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function CRM() {
  const { user, showToast } = useApp();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', search: '' });
  const [selectedContact, setSelectedContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [stats, setStats] = useState(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ user_name: '', user_type: 'customer', company: '', email: '', phone: '' });

  useEffect(() => {
    loadContacts();
  }, [filter]);

  const loadContacts = async () => {
    try {
      const data = await api.crm.getContacts(filter);
      setContacts(data);
    } catch (error) {
      showToast('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const selectContact = async (contact) => {
    setSelectedContact(contact);
    try {
      const [intData, statsData] = await Promise.all([
        api.crm.getContactInteractions(contact.id),
        api.crm.getContactStats(contact.id)
      ]);
      setInteractions(intData);
      setStats(statsData);
    } catch (error) {
      showToast('Failed to load contact details');
    }
  };

  const createContact = async (e) => {
    e.preventDefault();
    try {
      const contact = await api.crm.createContact(newContact);
      setContacts([contact, ...contacts]);
      setShowNewContact(false);
      setNewContact({ user_name: '', user_type: 'customer', company: '', email: '', phone: '' });
      showToast('Contact created successfully');
    } catch (error) {
      showToast('Failed to create contact');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title" style={{ marginBottom: '4px' }}>CRM</h2>
          <p className="view-sub" style={{ margin: 0 }}>Manage customer and tech relationships.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewContact(true)}>
          + Add Contact
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select
          value={filter.type}
          onChange={e => setFilter({ ...filter, type: e.target.value })}
          style={{ flex: 1 }}
        >
          <option value="">All Types</option>
          <option value="customer">Customers</option>
          <option value="tech">Techs</option>
        </select>
        <input
          type="text"
          placeholder="Search contacts..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          style={{ flex: 2 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h4 style={{ fontFamily: 'var(--display)', marginBottom: '16px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Contacts ({contacts.length})
          </h4>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)' }}>No contacts found</p>
            </div>
          ) : (
            contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selectedContact?.id === contact.id ? 'var(--surface-2)' : 'transparent',
                  border: '1px solid var(--line)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{contact.user_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {contact.company || 'No company'} · {contact.email || 'No email'}
                    </div>
                  </div>
                  <span className={`badge badge-${contact.user_type}`} style={{ fontSize: '10px' }}>
                    {contact.user_type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="panel" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {selectedContact ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontFamily: 'var(--display)', margin: 0, fontSize: '18px' }}>{selectedContact.user_name}</h4>
                  <span className={`badge badge-${selectedContact.user_type}`}>
                    {selectedContact.user_type}
                  </span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                  <p>Company: {selectedContact.company || 'N/A'}</p>
                  <p>Email: {selectedContact.email || 'N/A'}</p>
                  <p>Phone: {selectedContact.phone || 'N/A'}</p>
                </div>
              </div>

              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{stats.ticketCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Tickets</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{formatCurrency(stats.lifetimeValue)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>LTV</div>
                  </div>
                  {stats.averageRating && (
                    <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{stats.averageRating}★</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Avg Rating</div>
                    </div>
                  )}
                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{stats.interactionCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Interactions</div>
                  </div>
                </div>
              )}

              <h4 style={{ fontFamily: 'var(--display)', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Interaction History
              </h4>
              {interactions.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No interactions yet</p>
              ) : (
                interactions.map(int => (
                  <div key={int.id} style={{
                    padding: '12px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className={`badge badge-${int.type === 'note' ? 'resolved' : int.type}`} style={{ fontSize: '9px' }}>
                        {int.type}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(int.created_at)}</span>
                    </div>
                    {int.subject && <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{int.subject}</div>}
                    {int.content && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{int.content}</div>}
                  </div>
                ))
              )}
            </>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)' }}>
              Select a contact to view details
            </div>
          )}
        </div>
      </div>

      {showNewContact && (
        <div className="modal-overlay" onClick={() => setShowNewContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Contact</h3>
              <button className="btn-icon" onClick={() => setShowNewContact(false)}>×</button>
            </div>
            <form onSubmit={createContact}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newContact.user_name}
                  onChange={e => setNewContact({ ...newContact, user_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={newContact.user_type} onChange={e => setNewContact({ ...newContact, user_type: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="tech">Tech</option>
                </select>
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewContact(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
