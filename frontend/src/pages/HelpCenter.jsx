import { useState, useEffect } from 'react';
import { api } from '../api/index.js';

export default function HelpCenter() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chatbot/faqs');
      const data = await response.json();
      setArticles(data);
      
      // Extract unique categories
      const cats = [...new Set(data.map(a => a.keywords?.[0]).filter(Boolean)];
      setCategories(cats);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || 
      article.keywords?.includes(selectedCategory);
    const matchesSearch = !searchQuery || 
      article.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.preview?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryIcons = {
    'tickets': '🎫',
    'payment': '💰',
    'rating': '⭐',
    'sla': '⏱️',
    'getting': '🚀',
    'how': '📖',
    'contact': '📧',
    'account': '👤'
  };

  const getIcon = (article) => {
    const firstKeyword = article.keywords?.[0] || '';
    return categoryIcons[firstKeyword] || '📄';
  };

  const formatContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/^- /g, '• ')
      .replace(/^\d+\. /g, (match) => match);
  };

  if (selectedArticle) {
    return (
      <div className="view-container">
        <button 
          className="btn btn-ghost"
          onClick={() => setSelectedArticle(null)}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Help Center
        </button>
        
        <div className="panel" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>{getIcon(selectedArticle)}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>
            {selectedArticle.question || selectedArticle.title}
          </h1>
          <div 
            style={{ lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: formatContent(selectedArticle.preview || selectedArticle.content) }}
          />
          
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>
              Was this article helpful?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost">👍 Yes</button>
              <button className="btn btn-ghost">👎 No</button>
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontFamily: 'var(--display)', marginBottom: '12px' }}>Need more help?</h4>
            <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>
              Our chatbot is available 24/7 for instant answers, or submit a support ticket.
            </p>
            <button className="btn btn-primary">Open Support Ticket</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Hero */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, var(--panel), var(--panel-2))',
          borderRadius: '16px',
          marginBottom: '32px',
          border: '1px solid var(--line)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '28px', marginBottom: '12px' }}>
            Help Center
          </h1>
          <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 24px' }}>
            Find answers to common questions, browse guides, and get the help you need.
          </p>
          
          {/* Search */}
          <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                paddingLeft: '48px',
                borderRadius: '30px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '15px'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px'
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Popular Topics</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {[
            { icon: '🎫', title: 'Submitting Tickets', desc: 'How to create tickets' },
            { icon: '💰', title: 'Getting Paid', desc: 'Payment and payouts' },
            { icon: '⭐', title: 'Ratings', desc: 'Build your reputation' },
            { icon: '⏱️', title: 'SLA', desc: 'Response times' },
            { icon: '🤖', title: 'Chatbot', desc: 'Get instant help' },
            { icon: '📧', title: 'Contact Support', desc: 'Submit a ticket' }
          ].map((topic, idx) => (
            <div key={idx} style={{
              padding: '20px',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--amber)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{topic.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{topic.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{topic.desc}</div>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>Browse by Topic</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '20px' }}
            >
              All Topics
            </button>
            {['tickets', 'payment', 'rating', 'sla', 'getting'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: '20px', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <h3 style={{ fontFamily: 'var(--display)', marginBottom: '16px' }}>
          {selectedCategory === 'all' ? 'All Articles' : `${selectedCategory} Articles`}
          <span style={{ fontSize: '14px', color: 'var(--muted)', marginLeft: '8px' }}>
            ({filteredArticles.length})
          </span>
        </h3>

        {loading ? (
          <div className="empty">Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <p>No articles found matching your search.</p>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Try different keywords or browse all topics.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredArticles.map((article, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedArticle(article)}
                style={{
                  padding: '20px',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--amber)';
                  e.currentTarget.style.background = 'var(--panel-2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.background = 'var(--panel)';
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>{getIcon(article)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {article.question || article.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                      {article.preview?.substring(0, 150)}...
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(article.keywords || []).slice(0, 4).map((tag, i) => (
                        <span key={i} style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          background: 'var(--surface-2)',
                          borderRadius: '4px',
                          color: 'var(--muted)'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support CTA */}
        <div style={{
          marginTop: '48px',
          padding: '32px',
          background: 'linear-gradient(135deg, var(--amber-dim), var(--panel-2))',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid var(--amber-dim)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
          <h3 style={{ fontFamily: 'var(--display)', marginBottom: '8px' }}>
            Still need help?
          </h3>
          <p style={{ color: 'var(--muted)', marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px' }}>
            Our chatbot is available 24/7 for instant answers. You can also submit a support ticket.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary">Open Support Ticket</button>
            <button className="btn btn-ghost">Chat with Support</button>
          </div>
        </div>

        {/* Footer Links */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          color: 'var(--muted)',
          fontSize: '13px'
        }}>
          <span>📧 support@promote.example</span>
          <span>📖 Documentation</span>
          <span>📜 Terms of Service</span>
          <span>🔒 Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
