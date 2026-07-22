import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function ChatBot() {
  const { user, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage("Hello! 👋 I'm your Promote support assistant. How can I help you today? Type 'help' to see common topics or browse our help center.");
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showHelpCenter) {
      loadArticles();
    }
  }, [showHelpCenter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadArticles = async () => {
    try {
      const response = await fetch('/api/chatbot/faqs');
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { type: 'bot', text, timestamp: new Date() }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addUserMessage(userMessage);
    setLoading(true);

    try {
      const response = await api.chatbot.chat({
        message: userMessage,
        user_name: user?.name || 'guest',
        session_id: sessionId
      });
      
      addBotMessage(response.response);
      
      if (response.suggestions && response.suggestions.length > 0) {
        // Quick reply suggestions
      }
    } catch (error) {
      addBotMessage("Sorry, I encountered an error. Please try again or submit a support ticket.");
      showToast('Chatbot error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const quickReplies = [
    { text: 'How do I submit a ticket?', icon: '🎫' },
    { text: 'How do I get paid?', icon: '💰' },
    { text: 'What are priority levels?', icon: '⚡' },
    { text: 'Contact support', icon: '📧' }
  ];

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMarkdown = (text) => {
    // Simple markdown rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/^- /g, '• ')
      .replace(/^\d+\. /g, (match) => match);
  };

  return (
    <>
      {/* Help Center Modal */}
      {showHelpCenter && (
        <div className="modal-overlay" onClick={() => setShowHelpCenter(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📚</span>
                <div>
                  <h3 style={{ margin: 0 }}>Help Center</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Find answers to common questions</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowHelpCenter(false)}>×</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(85vh - 60px)' }}>
              {selectedArticle ? (
                <div>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setSelectedArticle(null)}
                    style={{ marginBottom: '16px' }}
                  >
                    ← Back to articles
                  </button>
                  <div style={{ 
                    background: 'var(--surface-2)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    lineHeight: 1.6
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.preview || selectedArticle.content) }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {articles.map((article, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedArticle(article)}
                      style={{
                        padding: '16px',
                        background: 'var(--surface-2)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        border: '1px solid var(--line)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--amber)';
                        e.currentTarget.style.background = 'var(--panel-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--line)';
                        e.currentTarget.style.background = 'var(--surface-2)';
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{article.question || article.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{article.preview}</div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(article.keywords || []).slice(0, 3).map((tag, i) => (
                          <span key={i} style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            background: 'var(--panel)',
                            borderRadius: '4px',
                            color: 'var(--muted)'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999
      }}>
        {/* Chat Window */}
        {isOpen && (
          <div style={{
            width: '380px',
            height: '520px',
            background: 'var(--panel)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: '16px',
            border: '1px solid var(--line)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, var(--amber), #FF8C00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🤖
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1A1206' }}>Promote Assistant</div>
                  <div style={{ fontSize: '11px', color: 'rgba(26,18,6,0.7)' }}>Always here to help</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowHelpCenter(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#1A1206'
                  }}
                >
                  📚 Help
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#1A1206'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.type === 'user' 
                      ? 'linear-gradient(135deg, var(--amber), #FF8C00)' 
                      : 'var(--surface-2)',
                    color: msg.type === 'user' ? '#1A1206' : 'var(--text)',
                    fontSize: '14px',
                    lineHeight: 1.5
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                    <div style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      opacity: 0.6,
                      textAlign: msg.type === 'user' ? 'right' : 'left'
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: 'var(--surface-2)'
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: 'var(--amber)', animation: 'bounce 1s infinite'
                      }} />
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: 'var(--amber)', animation: 'bounce 1s infinite 0.2s'
                      }} />
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: 'var(--amber)', animation: 'bounce 1s infinite 0.4s'
                      }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {!loading && messages.length < 3 && (
              <div style={{
                padding: '0 16px 8px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestion(reply.text)}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {reply.icon} {reply.text.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: '12px'
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  background: input.trim() ? 'linear-gradient(135deg, var(--amber), #FF8C00)' : 'var(--surface-2)',
                  color: input.trim() ? '#1A1206' : 'var(--muted)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: isOpen ? '50px' : '64px',
            height: isOpen ? '50px' : '64px',
            borderRadius: isOpen ? '50%' : '32px',
            border: 'none',
            background: isOpen 
              ? 'var(--panel)' 
              : 'linear-gradient(135deg, var(--amber), #FF8C00)',
            color: isOpen ? 'var(--text)' : '#1A1206',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isOpen ? '24px' : '28px',
            boxShadow: '0 8px 24px rgba(255, 180, 84, 0.3)',
            transition: 'all 0.3s ease',
            marginLeft: isOpen ? '14px' : '0'
          }}
        >
          {isOpen ? '×' : '💬'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
