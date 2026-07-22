import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function SubmitTicket() {
  const { user, showToast, requireName } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    environment: 'dev',
    priority: 'normal'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!requireName()) return;
    
    if (!form.title.trim() || !form.description.trim()) {
      showToast('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      await api.tickets.create({
        ...form,
        customer_name: user.name
      });
      showToast('Ticket submitted successfully');
      navigate('/mytickets');
    } catch (error) {
      showToast(error.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Submit Ticket</h2>
      <p className="view-sub">Describe the issue or task you need help with.</p>

      <form onSubmit={handleSubmit}>
        <div className="panel" style={{ maxWidth: '600px' }}>
          <div className="field">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detailed description of what you need..."
              required
            />
          </div>

          <div className="field">
            <label>Environment</label>
            <div className="env-pick">
              <label className="opt">
                <input
                  type="radio"
                  name="env"
                  value="dev"
                  checked={form.environment === 'dev'}
                  onChange={(e) => setForm(f => ({ ...f, environment: e.target.value }))}
                />
                Dev
              </label>
              <label className="opt">
                <input
                  type="radio"
                  name="env"
                  value="staging"
                  checked={form.environment === 'staging'}
                  onChange={(e) => setForm(f => ({ ...f, environment: e.target.value }))}
                />
                Staging
              </label>
            </div>
          </div>

          <div className="field">
            <label>Priority</label>
            <div className="env-pick">
              <label className="opt">
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={form.priority === 'normal'}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                />
                Normal
              </label>
              <label className="opt">
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={form.priority === 'high'}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                />
                High Priority
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
