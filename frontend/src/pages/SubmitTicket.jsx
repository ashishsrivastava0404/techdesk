import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function SubmitTicket() {
  const { user, showToast, requireName } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    environment: 'dev',
    priority: 'normal',
    category: 'general',
    tags: '',
    estimated_hours: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (form.category && form.category !== 'general') {
      loadTemplates(form.category);
    } else {
      setTemplates([]);
    }
  }, [form.category]);

  const loadCategories = async () => {
    try {
      const data = await api.categories.list();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async (cat) => {
    try {
      const data = await api.categories.getTemplates(cat);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const applyTemplate = async (templateId) => {
    try {
      const template = await api.categories.getTemplate(templateId);
      setForm(f => ({ ...f, description: template.template_content }));
      await api.categories.useTemplate(templateId);
      showToast('Template applied!');
    } catch (error) {
      showToast('Failed to load template');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requireName()) return;

    if (!form.title.trim() || !form.description.trim()) {
      showToast('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      await api.tickets.create({
        title: form.title,
        description: form.description,
        environment: form.environment,
        priority: form.priority,
        category: form.category,
        tags: tagArray,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
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

  const priorityColors = {
    critical: '#dc2626',
    urgent: '#f59e0b',
    high: '#ef4444',
    normal: 'var(--amber)',
    low: '#6b7280'
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Submit Ticket</h2>
      <p className="view-sub">Describe the issue or task you need help with.</p>

      <form onSubmit={handleSubmit}>
        <div className="panel" style={{ maxWidth: '700px' }}>
          <div className="field">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="general">General Inquiry</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Est. Hours</label>
              <input
                type="number"
                value={form.estimated_hours}
                onChange={(e) => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
                placeholder="e.g. 4"
                min="0"
                step="0.5"
              />
            </div>
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div className="field">
              <label>Use Template</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => applyTemplate(tpl.id)}
                    style={{ fontSize: '12px' }}
                  >
                    📄 {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detailed description of what you need..."
              rows={8}
              required
            />
          </div>

          <div className="field">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. api, database, urgent"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <select
                value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ 
                  borderColor: priorityColors[form.priority],
                  borderWidth: '2px'
                }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* SLA Info */}
          <div style={{
            padding: '12px',
            background: form.priority === 'critical' || form.priority === 'urgent' ? 'rgba(220, 38, 38, 0.1)' : 
                        form.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-2)',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${priorityColors[form.priority]}`
          }}>
            <span style={{ fontWeight: 600, color: priorityColors[form.priority] }}>
              {form.priority === 'critical' && '🚨 CRITICAL - Response within 1 hour'}
              {form.priority === 'urgent' && '⚠️ URGENT - Response within 4 hours'}
              {form.priority === 'high' && '🔴 HIGH - Response within 8 hours'}
              {form.priority === 'normal' && '📋 NORMAL - Response within 24 hours'}
              {form.priority === 'low' && '⚪ LOW - Response within 48 hours'}
            </span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
