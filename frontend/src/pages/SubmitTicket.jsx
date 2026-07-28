import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function SubmitTicket() {
  const { user, showToast, requireName } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState({});
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Tech stack data
  const [techCategories, setTechCategories] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [techSearch, setTechSearch] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  
  // Draft and attachment state
  const [draftId] = useState(() => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    subject: '',
    short_description: '',
    long_description: '',
    description: '',
    ticket_type: 'technical', // 'technical' or 'business'
    environment: 'dev',
    priority: 'normal',
    category: '',      // Top-level category ID
    subcategory: '',   // Subcategory ID
    topic: '',         // Topic ID
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
    loadTechnologies();
    loadDraft();
  }, []);

  // Load saved draft on mount
  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/tickets/draft/${draftId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const draft = await response.json();
        setForm({
          title: draft.title || '',
          subject: draft.subject || '',
          short_description: draft.short_description || '',
          long_description: draft.long_description || '',
          description: draft.description || '',
          environment: draft.environment || 'dev',
          priority: draft.priority || 'normal',
          category: draft.category || '',
          subcategory: draft.subcategory || '',
          topic: draft.topic || '',
          tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : (draft.tags || ''),
          estimated_hours: ''
        });
        if (draft.tags && Array.isArray(draft.tags)) {
          // Could restore selected techs from tags if needed
        }
        showToast('Draft restored');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (form.title || form.description) {
        try {
          await fetch('/api/tickets/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              draft_id: draftId,
              ...form,
              tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
            })
          });
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [form, draftId]);

  // Clear form handler
  const handleClearForm = async () => {
    try {
      await fetch(`/api/tickets/draft/${draftId}`, { method: 'DELETE', headers: getAuthHeaders() });
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
    setForm({
      title: '',
      subject: '',
      short_description: '',
      long_description: '',
      description: '',
      environment: 'dev',
      priority: 'normal',
      category: '',
      subcategory: '',
      topic: '',
      tags: '',
      estimated_hours: ''
    });
    setSelectedTechs([]);
    setAttachments([]);
    showToast('Form cleared');
  };

  // Upload attachment handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 5) {
      showToast('Maximum 5 files allowed');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        showToast(`File ${file.name} exceeds 10MB limit`);
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('ticket_id', '0'); // Temporary ID until ticket is created
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/attachments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setAttachments(prev => [...prev, ...result.attachments]);
      showToast(`${files.length} file(s) uploaded`);
    } catch (error) {
      showToast('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Remove attachment
  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE', headers: getAuthHeaders() });
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      showToast('Attachment removed');
    } catch (error) {
      showToast('Failed to remove attachment');
    }
  };

  // Reset subcategory and topic when category changes
  useEffect(() => {
    setForm(f => ({ ...f, subcategory: '', topic: '' }));
  }, [form.category]);

  // Reset ticket_type when category changes to 'account' or 'billing' (business)
  useEffect(() => {
    if (form.category === 'account' || form.category === 'billing') {
      setForm(f => ({ ...f, ticket_type: 'business' }));
    }
  }, [form.category]);

  // Reset topic when subcategory changes
  useEffect(() => {
    setForm(f => ({ ...f, topic: '' }));
  }, [form.subcategory]);

  useEffect(() => {
    if (form.category && form.category !== 'general') {
      loadTemplates(form.category);
    } else {
      setTemplates([]);
    }
  }, [form.category]);

  // Reset ticket_type when category changes to 'account' or 'billing' (business)
  useEffect(() => {
    if (form.category === 'account' || form.category === 'billing') {
      setForm(f => ({ ...f, ticket_type: 'business' }));
    }
  }, [form.category]);

  const loadCategories = async () => {
    try {
      // Load both database categories and hierarchy
      const [dbCategories, hierarchyData] = await Promise.all([
        api.categories.list().catch(() => []),
        fetch('/api/ticket-hierarchy').then(r => r.json()).catch(() => ({ data: {} }))
      ]);
      
      setCategories(dbCategories);
      setCategoryHierarchy(hierarchyData.data || {});
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

  const loadTechnologies = async () => {
    try {
      const response = await fetch('/api/expert/technologies');
      const data = await response.json();
      if (data.success) {
        setTechCategories(data.categories || []);
        setTechnologies(data.technologies || []);
      }
    } catch (error) {
      console.error('Error loading technologies:', error);
    }
  };

  const addTech = (tech) => {
    if (!selectedTechs.find(t => t.id === tech.id)) {
      setSelectedTechs([...selectedTechs, { id: tech.id, name: tech.name, category: tech.categoryName }]);
    }
    setTechSearch('');
    setShowTechDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.tech-dropdown-container')) {
        setShowTechDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const removeTech = (techId) => {
    setSelectedTechs(selectedTechs.filter(t => t.id !== techId));
  };

  // Filter technologies based on search
  const filteredTechnologies = useMemo(() => {
    if (!techSearch.trim()) return technologies.slice(0, 20);
    const search = techSearch.toLowerCase();
    return technologies.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.categoryName.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [techSearch, technologies]);

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

    // Validate category hierarchy if using new system
    const hasFullHierarchy = form.category && form.subcategory && form.topic;
    const isLegacyCategory = form.category && !form.category.includes('_');

    setLoading(true);
    try {
      const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const techArray = selectedTechs.map(t => t.id);
      
      const ticketData = {
        title: form.title,
        subject: form.subject || null,
        short_description: form.short_description || null,
        long_description: form.long_description || null,
        description: form.description,
        ticket_type: form.ticket_type || 'technical', // Include ticket type
        environment: form.environment,
        priority: form.priority,
        tags: tagArray,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        customer_name: user.name,
        tech_stack: techArray // Include selected technologies
      };

      // Include category hierarchy if selected
      if (hasFullHierarchy) {
        ticketData.category = form.category;
        ticketData.subcategory = form.subcategory;
        ticketData.topic = form.topic;
      } else if (isLegacyCategory) {
        ticketData.category = form.category;
      }

      const ticket = await api.tickets.create(ticketData);
      
      // If there are attachments, update them with the correct ticket_id
      if (attachments.length > 0 && ticket.id) {
        for (const attachment of attachments) {
          await fetch(`/api/attachments/${attachment.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        }
        
        // Re-upload with correct ticket ID
        const formData = new FormData();
        formData.append('ticket_id', ticket.id.toString());
        // We'd need to re-file select, so for now we'll skip re-upload
      }
      
      // Delete the draft after successful submission
      try {
        await fetch(`/api/tickets/draft/${draftId}`, { method: 'DELETE', headers: getAuthHeaders() });
      } catch (err) {
        console.error('Error deleting draft:', err);
      }
      
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

          {/* Category Hierarchy Selection */}
          <div className="field">
            <label>Category Hierarchy</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {/* Category */}
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select Category</option>
                {Object.entries(categoryHierarchy).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                {/* Legacy categories fallback */}
                <option value="general">General</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Subcategory */}
              <select
                value={form.subcategory}
                onChange={(e) => setForm(f => ({ ...f, subcategory: e.target.value }))}
                disabled={!form.category || !categoryHierarchy[form.category]?.subcategories}
                style={{ cursor: form.subcategory ? 'pointer' : 'not-allowed' }}
              >
                <option value="">Select Subcategory</option>
                {form.category && categoryHierarchy[form.category]?.subcategories && 
                  Object.entries(categoryHierarchy[form.category].subcategories).map(([key, sub]) => (
                    <option key={key} value={key}>{sub.name}</option>
                  ))
                }
              </select>

              {/* Topic */}
              <select
                value={form.topic}
                onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
                disabled={!form.subcategory || !categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.topics}
                style={{ cursor: form.topic ? 'pointer' : 'not-allowed' }}
              >
                <option value="">Select Topic</option>
                {form.category && form.subcategory && categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.topics &&
                  Object.entries(categoryHierarchy[form.category].subcategories[form.subcategory].topics).map(([key, topic]) => (
                    <option key={key} value={key}>{topic.name}</option>
                  ))
                }
              </select>
            </div>
            
            {/* Selected Path Display */}
            {form.category && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Selected:</strong> {' '}
                {categoryHierarchy[form.category]?.icon} {categoryHierarchy[form.category]?.name}
                {form.subcategory && ` → ${categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.name}`}
                {form.topic && ` → ${categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.topics?.[form.topic]?.name}`}
              </div>
            )}
          </div>

          {/* Tech Stack Selection */}
          <div className="field">
            <label>
              Tech Stack
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                (Optional - Helps match you with the right expert)
              </span>
            </label>
            
            {/* Selected Technologies Tags */}
            {selectedTechs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {selectedTechs.map((tech) => (
                  <span
                    key={tech.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px'
                    }}
                  >
                    {tech.name}
                    <button
                      type="button"
                      onClick={() => removeTech(tech.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '16px',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Tech Search Input */}
            <div className="tech-dropdown-container" style={{ position: 'relative' }}>
              <input
                type="text"
                value={techSearch}
                onChange={(e) => {
                  setTechSearch(e.target.value);
                  setShowTechDropdown(true);
                }}
                onFocus={() => setShowTechDropdown(true)}
                placeholder="Search technologies (e.g., Node.js, AWS, React...)"
                style={{ width: '100%' }}
              />
              
              {/* Tech Dropdown */}
              {showTechDropdown && filteredTechnologies.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflow: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {/* Category Headers */}
                  {techCategories
                    .filter(cat => filteredTechnologies.some(t => t.categoryId === cat.id))
                    .map(cat => (
                      <div key={cat.id}>
                        <div style={{
                          padding: '8px 12px',
                          background: 'var(--surface-2)',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          position: 'sticky',
                          top: 0
                        }}>
                          {cat.icon} {cat.name}
                        </div>
                        {filteredTechnologies
                          .filter(t => t.categoryId === cat.id)
                          .map((tech) => (
                            <div
                              key={tech.id}
                              onClick={() => addTech(tech)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{tech.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {tech.certified && (
                                  <span style={{ color: '#10b981' }}>✓ Certified</span>
                                )}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Select relevant technologies to help us match you with qualified experts
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

          {/* Ticket Type Selector */}
          <div className="field">
            <label>Ticket Type</label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label className={`type-opt ${form.ticket_type === 'technical' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="ticket_type"
                  value="technical"
                  checked={form.ticket_type === 'technical'}
                  onChange={(e) => setForm(f => ({ ...f, ticket_type: e.target.value }))}
                />
                <span style={{ fontSize: '20px' }}>🔧</span>
                <div>
                  <strong>Technical Issue</strong>
                  <small>Bug, code, or infrastructure problem</small>
                </div>
              </label>
              <label className={`type-opt ${form.ticket_type === 'business' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="ticket_type"
                  value="business"
                  checked={form.ticket_type === 'business'}
                  onChange={(e) => setForm(f => ({ ...f, ticket_type: e.target.value }))}
                />
                <span style={{ fontSize: '20px' }}>💼</span>
                <div>
                  <strong>Business/Account</strong>
                  <small>Login, billing, or account issue</small>
                </div>
              </label>
            </div>
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

          {/* Attachments */}
          <div className="field">
            <label>Attachments</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                {uploading ? 'Uploading...' : '📎 Upload Files'}
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.json,.xml,.csv,.zip"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                Max 5 files, 10MB each
              </span>
            </div>
            
            {/* Attachments List */}
            {attachments.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachments.map(attachment => (
                  <div key={attachment.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    fontSize: '0.9em'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📄</span>
                      <span>{attachment.filename}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        ({(attachment.file_size / 1024).toFixed(1)} KB)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--red)',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClearForm}
            >
              🗑️ Clear Form
            </button>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
