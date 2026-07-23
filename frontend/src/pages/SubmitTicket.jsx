import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function SubmitTicket() {
  const { user, showToast, requireName } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    short_description: '',
    long_description: '',
    description: '',
    environment: 'dev',
    priority: 'normal',
    category: 'general',
    subcategory: '',
    tags: '',
    estimated_hours: ''
  });

  // Word count helpers
  const wordCount = (text) => text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const shortDescWordCount = wordCount(form.short_description);
  const longDescWordCount = wordCount(form.long_description);
  const MAX_SHORT_DESC_WORDS = 200;
  const MAX_LONG_DESC_WORDS = 1000;

  useEffect(() => {
    loadCategories();
    loadTopicSuggestions();
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

  const loadTopicSuggestions = async () => {
    try {
      const response = await fetch('/api/topics/suggest?limit=20');
      const data = await response.json();
      setTopicSuggestions(data.topics || []);
    } catch (error) {
      console.error('Error loading topic suggestions:', error);
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

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!form.subject.trim()) return [];
    const search = form.subject.toLowerCase();
    return topicSuggestions.filter(t => 
      t.tag.toLowerCase().includes(search)
    ).slice(0, 5);
  }, [form.subject, topicSuggestions]);

  const selectSuggestion = (tag) => {
    const currentTags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      setForm(f => ({ ...f, tags: currentTags.join(', ') }));
    }
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requireName()) return;

    if (!form.title.trim() || !form.description.trim()) {
      showToast('Title and description are required');
      return;
    }

    if (shortDescWordCount > MAX_SHORT_DESC_WORDS) {
      showToast(`Short description exceeds ${MAX_SHORT_DESC_WORDS} words`);
      return;
    }

    if (longDescWordCount > MAX_LONG_DESC_WORDS) {
      showToast(`Long description exceeds ${MAX_LONG_DESC_WORDS} words`);
      return;
    }

    setLoading(true);
    try {
      const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      await api.tickets.create({
        title: form.title,
        subject: form.subject || null,
        short_description: form.short_description || null,
        long_description: form.long_description || null,
        description: form.description,
        environment: form.environment,
        priority: form.priority,
        category: form.category,
        subcategory: form.subcategory || null,
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
        <div className="panel" style={{ maxWidth: '800px' }}>
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

          <div className="field">
            <label>Subject / Topic</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => {
                  setForm(f => ({ ...f, subject: e.target.value }));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Start typing to see suggestions..."
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {filteredSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(s.tag)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{s.tag}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {s.success_rate}% success rate
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

          {/* Short Description - 200 words max */}
          <div className="field">
            <label>
              Short Description 
              <span style={{ fontWeight: 400, color: shortDescWordCount > MAX_SHORT_DESC_WORDS ? '#dc2626' : 'var(--text-muted)' }}>
                ({shortDescWordCount}/{MAX_SHORT_DESC_WORDS} words)
              </span>
            </label>
            <textarea
              value={form.short_description}
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                if (words.length <= MAX_SHORT_DESC_WORDS) {
                  setForm(f => ({ ...f, short_description: e.target.value }));
                }
              }}
              placeholder="Brief summary (max 200 words)..."
              rows={3}
              style={{ borderColor: shortDescWordCount > MAX_SHORT_DESC_WORDS ? '#dc2626' : undefined }}
            />
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

          {/* Long Description - 1000 words max */}
          <div className="field">
            <label>
              Additional Details 
              <span style={{ fontWeight: 400, color: longDescWordCount > MAX_LONG_DESC_WORDS ? '#dc2626' : 'var(--text-muted)' }}>
                ({longDescWordCount}/{MAX_LONG_DESC_WORDS} words, optional)
              </span>
            </label>
            <textarea
              value={form.long_description}
              onChange={(e) => {
                const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                if (words.length <= MAX_LONG_DESC_WORDS) {
                  setForm(f => ({ ...f, long_description: e.target.value }));
                }
              }}
              placeholder="Additional context, steps to reproduce, expected vs actual behavior..."
              rows={5}
              style={{ borderColor: longDescWordCount > MAX_LONG_DESC_WORDS ? '#dc2626' : undefined }}
            />
          </div>

          <div className="field">
            <label>Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. api, database, urgent"
            />
            <small style={{ color: 'var(--text-muted)' }}>
              Click suggestions above to add tags automatically
            </small>
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
            {(form.priority === 'low' || form.priority === 'normal') && (
              <span style={{ color: 'var(--green)', fontSize: '0.85em', marginLeft: '8px' }}>
                ✓ FREE - No credit cost
              </span>
            )}
            {(form.priority === 'high' || form.priority === 'urgent' || form.priority === 'critical') && (
              <span style={{ color: 'var(--orange)', fontSize: '0.85em', marginLeft: '8px' }}>
                Credit cost applies
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
