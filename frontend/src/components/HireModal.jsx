import { useState } from 'react';

export default function HireModal({ tech, onSubmit, onClose }) {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = () => {
    if (!message.trim() || !contact.trim()) return;
    onSubmit(message, contact);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Request Production Support</h3>
        <p className="sub">
          Sending a paid-work request to {tech.name}.
        </p>

        <div className="field">
          <label>What do you need help with?</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the production environment and scope of work…"
          />
        </div>

        <div className="field">
          <label>Contact info</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or preferred contact method"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!message.trim() || !contact.trim()}
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
