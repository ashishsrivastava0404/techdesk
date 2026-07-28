import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useBrand } from '../context/BrandContext.jsx';
import { api } from '../api/index.js';

export default function ChatBot() {
  const { user, showToast } = useApp();
  const { brand } = useBrand();
  const appName = brand.app_name || 'TechDesk';
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
  
  // Support report conversation state
  const [reportState, setReportState] = useState({
    active: false,
    step: 'type', // type, priority, subject, description, confirm
    data: {
      report_type: '',
      priority: 'medium',
      subject: '',
      description: ''
    }
  });

  // Ticket creation conversation state
  const [ticketState, setTicketState] = useState({
    active: false,
    step: 'type', // type, title, description, confirm
    data: {
      ticket_type: '',
      title: '',
      description: ''
    }
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(`Hello! 👋 I'm your ${appName} support assistant. How can I help you today? Type 'help' to see common topics or browse our help center.`);
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

    // Handle report conversation flow
    if (reportState.active) {
      switch (reportState.step) {
        case 'type':
          handleReportType(userMessage);
          setLoading(false);
          return;
        case 'priority':
          handleReportPriority(userMessage);
          setLoading(false);
          return;
        case 'subject':
          handleReportSubject(userMessage);
          setLoading(false);
          return;
        case 'description':
          handleReportDescription(userMessage);
          setLoading(false);
          return;
        case 'confirm':
          if (userMessage.toLowerCase() === '1' || userMessage.toLowerCase().includes('yes')) {
            await submitReport();
          } else if (userMessage.toLowerCase() === '2' || userMessage.toLowerCase().includes('edit')) {
            setReportState(prev => ({ ...prev, step: 'type', data: { ...prev.data, report_type: '', subject: '', description: '' } }));
            addBotMessage("Let's start over.\n\n**What type of issue are you reporting?**\n\n1️⃣ Bug Report - Something isn't working\n2️⃣ Feature Request - A new feature idea\n3️⃣ Complaint - You're not happy with something\n4️⃣ Billing Issue - Payment problem\n5️⃣ Other - Something else");
          } else {
            cancelReport();
          }
          setLoading(false);
          return;
      }
    }

    // Check for report keywords
    const reportKeywords = ['report bug', 'submit bug', 'report issue', 'report problem', 'file report', 'bug report', 'submit report'];
    const ticketKeywords = ['create ticket', 'submit ticket', 'open ticket', 'new ticket', 'raise ticket', 'contact support', 'need help'];
    
    if (reportKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
      startReportConversation();
      setLoading(false);
      return;
    }
    
    if (ticketKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
      startTicketConversation();
      setLoading(false);
      return;
    }

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

  // Start support report conversation
  const startReportConversation = () => {
    setReportState({
      active: true,
      step: 'type',
      data: { report_type: '', priority: 'medium', subject: '', description: '' }
    });
    addBotMessage("🐛 I'd be happy to help you submit a bug report! Let's get some details.\n\n**What type of issue are you reporting?**\n\n1️⃣ Bug Report - Something isn't working\n2️⃣ Feature Request - A new feature idea\n3️⃣ Complaint - You're not happy with something\n4️⃣ Billing Issue - Payment problem\n5️⃣ Other - Something else");
  };

  // Handle report type selection
  const handleReportType = (input) => {
    const typeMap = {
      '1': 'bug',
      'bug': 'bug',
      '2': 'feature_request',
      'feature': 'feature_request',
      'request': 'feature_request',
      '3': 'complaint',
      '4': 'billing_issue',
      'billing': 'billing_issue',
      '5': 'other'
    };
    const type = typeMap[input.toLowerCase()];
    if (type) {
      setReportState(prev => ({
        ...prev,
        step: 'priority',
        data: { ...prev.data, report_type: type }
      }));
      const typeNames = {
        bug: 'Bug Report 🐛',
        feature_request: 'Feature Request 💡',
        complaint: 'Complaint 😤',
        billing_issue: 'Billing Issue 💰',
        other: 'Other 📝'
      };
      addBotMessage(`Got it! You selected: **${typeNames[type]}**\n\n**How urgent is this issue?**\n\n1️⃣ Low - Minor issue, can wait\n2️⃣ Medium - Normal priority (default)\n3️⃣ High - Important, needs attention\n4️⃣ Urgent - Critical, needs immediate help`);
    } else {
      addBotMessage("I didn't understand that. Please enter a number 1-5 or the type name (bug, feature, complaint, billing, other).");
    }
  };

  // Handle priority selection
  const handleReportPriority = (input) => {
    const priorityMap = {
      '1': 'low',
      'low': 'low',
      '2': 'medium',
      'medium': 'medium',
      '3': 'high',
      'high': 'high',
      '4': 'urgent',
      'urgent': 'urgent'
    };
    const priority = priorityMap[input.toLowerCase()];
    if (priority) {
      setReportState(prev => ({
        ...prev,
        step: 'subject',
        data: { ...prev.data, priority }
      }));
      const priorityEmoji = { low: '⚪', medium: '🔵', high: '🟡', urgent: '🚨' };
      addBotMessage(`Priority set to: **${priorityEmoji[priority]} ${priority.toUpperCase()}**\n\n**Now, please describe the issue in a short title:**\n\nFor example: \"Login button not working\" or \"Feature X crashes on page Y\"`);
    } else {
      addBotMessage("Please enter a number 1-4 or the priority level (low, medium, high, urgent).");
    }
  };

  // Handle subject
  const handleReportSubject = (input) => {
    if (input.length < 5) {
      addBotMessage("Please provide a more descriptive title (at least 5 characters).");
      return;
    }
    setReportState(prev => ({
      ...prev,
      step: 'description',
      data: { ...prev.data, subject: input }
    }));
    addBotMessage(`📝 **Subject:** ${input}\n\n**Now please describe the issue in detail:**\n\nInclude:\n- What happened\n- What you expected\n- Steps to reproduce (if applicable)\n- Any error messages`);
  };

  // Handle description
  const handleReportDescription = (input) => {
    if (input.length < 10) {
      addBotMessage("Please provide more details about the issue (at least 10 characters).");
      return;
    }
    const newData = { ...reportState.data, description: input };
    setReportState(prev => ({ ...prev, step: 'confirm', data: newData }));
    
    const typeNames = { bug: 'Bug Report', feature_request: 'Feature Request', complaint: 'Complaint', billing_issue: 'Billing Issue', other: 'Other' };
    const priorityEmoji = { low: '⚪', medium: '🔵', high: '🟡', urgent: '🚨' };
    
    addBotMessage(`**📋 Report Summary:**\n\n**Type:** ${typeNames[newData.report_type]}\n**Priority:** ${priorityEmoji[newData.priority]} ${newData.priority}\n**Subject:** ${newData.subject}\n**Description:** ${newData.description.substring(0, 100)}...\n\n**Is this correct?**\n\n1️⃣ Yes, submit report\n2️⃣ No, let me edit\n3️⃣ Cancel`);
  };

  // Submit the report
  const submitReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_role: user?.role,
          report_type: reportState.data.report_type,
          priority: reportState.data.priority,
          subject: reportState.data.subject,
          description: reportState.data.description,
          page_url: window.location.href,
          browser_info: navigator.userAgent.substring(0, 100)
        })
      });
      
      if (response.ok) {
        addBotMessage("✅ **Report Submitted Successfully!**\n\nYour report has been sent to our support team. You'll be notified when there's an update.\n\nIs there anything else I can help you with?");
      } else {
        addBotMessage("❌ Failed to submit report. Please try again or use the 🐛 button in the corner of the screen.");
      }
    } catch (error) {
      addBotMessage("❌ Error submitting report. Please try again later.");
    }
    setReportState({ active: false, step: 'type', data: {} });
    setLoading(false);
  };

  // Cancel report
  const cancelReport = () => {
    setReportState({ active: false, step: 'type', data: {} });
    addBotMessage("Report cancelled. Is there anything else I can help you with?");
  };

  // Start ticket creation conversation
  const startTicketConversation = () => {
    setTicketState({
      active: true,
      step: 'type',
      data: { ticket_type: '', title: '', description: '' }
    });
    addBotMessage("🎫 I'd be happy to help you create a support ticket!\n\n**What type of issue do you have?**\n\n1️⃣ **Technical Issue** 🔧 - Bug, code problem, or infrastructure issue\n2️⃣ **Business/Account** 💼 - Login, billing, or account issue");
  };

  const handleTicketType = (input) => {
    const typeMap = {
      '1': 'technical', 'technical': 'technical', 'bug': 'technical', 'code': 'technical',
      '2': 'business', 'business': 'business', 'account': 'business', 'billing': 'business', 'login': 'business'
    };
    const type = typeMap[input.toLowerCase()];
    if (type) {
      setTicketState(prev => ({ ...prev, step: 'title', data: { ...prev.data, ticket_type: type } }));
      const typeLabel = type === 'technical' ? '🔧 Technical Issue' : '💼 Business/Account Issue';
      addBotMessage(`Got it! This will be a **${typeLabel}** ticket.\n\n**What's the title of your issue?**`);
    } else {
      addBotMessage("Please enter 1 or 2:\n\n1️⃣ Technical Issue\n2️⃣ Business/Account");
    }
  };

  const handleTicketTitle = (input) => {
    if (input.trim().length < 5) {
      addBotMessage("Please provide a more descriptive title (at least 5 characters).");
      return;
    }
    setTicketState(prev => ({ ...prev, step: 'description', data: { ...prev.data, title: input.trim() } }));
    addBotMessage(`**${input.trim()}**\n\n**Now describe your issue in more detail:**`);
  };

  const handleTicketDescription = (input) => {
    if (input.trim().length < 20) {
      addBotMessage("Please provide more details (at least 20 characters).");
      return;
    }
    setTicketState(prev => ({ ...prev, step: 'confirm', data: { ...prev.data, description: input.trim() } }));
    const typeLabel = ticketState.data.ticket_type === 'technical' ? '🔧 Technical' : '💼 Business';
    addBotMessage(`**📋 Ticket Summary:**\n\n**Type:** ${typeLabel}\n**Title:** ${ticketState.data.title}\n**Description:** ${input.trim().substring(0, 100)}...\n\n**Is this correct?**\n\n1️⃣ Yes, submit\n2️⃣ No, edit\n3️⃣ Cancel`);
  };

  const handleTicketConfirm = async (input) => {
    if (input.toLowerCase() === '1' || input.toLowerCase().includes('yes')) {
      await submitTicket();
    } else if (input.toLowerCase() === '2' || input.toLowerCase().includes('edit')) {
      setTicketState({ active: true, step: 'type', data: { ticket_type: '', title: '', description: '' } });
      addBotMessage("Let's start over.\n\n**What type of issue?**\n\n1️⃣ Technical Issue 🔧\n2️⃣ Business/Account 💼");
    } else {
      cancelTicket();
    }
  };

  const cancelTicket = () => {
    setTicketState({ active: false, step: 'type', data: { ticket_type: '', title: '', description: '' } });
    addBotMessage("Ticket creation cancelled. Is there anything else I can help you with?");
  };

  const submitTicket = async () => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticketState.data.title,
          description: ticketState.data.description,
          ticket_type: ticketState.data.ticket_type,
          customer_name: user?.name || 'Guest',
          priority: 'normal',
          environment: 'production'
        })
      });

      if (response.ok) {
        const ticket = await response.json();
        const typeLabel = ticketState.data.ticket_type === 'technical' ? '🔧 Technical' : '💼 Business';
        addBotMessage(`✅ **Ticket Created!**\n\n**#${ticket.id}**\n**Type:** ${typeLabel}\n\n${ticketState.data.ticket_type === 'technical' ? 'A technician will claim this soon.' : 'An admin will review your request.'}`);
      } else {
        addBotMessage("❌ Failed to create ticket. Please try again or use the Submit page.");
      }
    } catch (error) {
      addBotMessage("❌ Error creating ticket. Please try again.");
    }
    cancelTicket();
  };

  const quickReplies = [
    { text: 'How do I submit a ticket?', icon: '🎫' },
    { text: 'How do I get paid?', icon: '💰' },
    { text: 'What are priority levels?', icon: '⚡' },
    { text: 'Report a bug', icon: '🐛' }
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
                  <div style={{ fontWeight: 700, color: '#1A1206' }}>{appName} Assistant</div>
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
