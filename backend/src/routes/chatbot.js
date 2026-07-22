import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Knowledge base for FAQ responses
const knowledgeBase = {
  greetings: [
    "Hello! 👋 I'm your Promote support assistant. How can I help you today?",
    "Hi there! I'm here to help with any questions about Promote. What would you like to know?",
    "Welcome! I'm your virtual assistant. I can help with tickets, payments, and general questions."
  ],
  faqs: [
    {
      keywords: ['submit', 'create ticket', 'new ticket', 'report issue'],
      question: "How do I submit a ticket?",
      answer: "To submit a ticket:\n1. Click 'Submit Ticket' in the navigation\n2. Fill in the title and description\n3. Select the environment (Dev/Staging)\n4. Choose a priority level\n5. Click Submit!\n\nYou can also use templates for bug reports or feature requests."
    },
    {
      keywords: ['claim', 'work on', 'pick up', 'start working'],
      question: "How do I claim a ticket?",
      answer: "To claim a ticket:\n1. Go to 'Available Tickets'\n2. Find an open ticket that matches your skills\n3. Click 'Claim' to start working on it\n4. Once done, mark it as 'In Progress' then 'Resolved'"
    },
    {
      keywords: ['payment', 'pay', 'receive money', 'payout', 'withdraw'],
      question: "How do I get paid?",
      answer: "Techs earn money through:\n• Resolved tickets (base pay)\n• Production hire requests\n\nTo request a payout:\n1. Go to '💰 Earnings'\n2. Check your available balance\n3. Click 'Request Payout'\n4. Minimum payout is $25\n\nPayouts are processed via Stripe, PayPal, or Bank Transfer."
    },
    {
      keywords: ['priority', 'urgent', 'critical', 'emergency'],
      question: "What do the priority levels mean?",
      answer: "Priority levels determine response time:\n🚨 Critical - 1 hour SLA\n⚠️ Urgent - 4 hours SLA\n🔴 High - 8 hours SLA\n📋 Normal - 24 hours SLA\n⚪ Low - 48 hours SLA\n\nUse Critical/Urgency only for genuine emergencies!"
    },
    {
      keywords: ['category', 'type', 'bug', 'feature', 'support'],
      question: "What ticket categories are available?",
      answer: "We have 9 categories:\n• Bug Report - Issues and errors\n• Feature Request - New features\n• Technical Support - Help with existing features\n• Infrastructure - Server/DB issues\n• Security - Security concerns\n• Documentation - Docs and guides\n• Performance - Speed and optimization\n• Integration - Third-party services\n• General Inquiry - Other questions"
    },
    {
      keywords: ['rating', 'review', 'feedback', 'rate'],
      question: "How does the rating system work?",
      answer: "After a ticket is resolved, customers can rate their experience (1-5 stars). Your average rating affects:\n• Your position on the leaderboard\n• Trust score with customers\n• Eligibility for premium features\n\nHigh ratings help you get more hire requests!"
    },
    {
      keywords: ['leaderboard', 'rank', 'rankings', 'score'],
      question: "How does the leaderboard work?",
      answer: "Techs are ranked by:\n• Average rating (weighted heavily)\n• Number of resolved tickets\n• Composite score\n\nTiers:\n🥉 Dev - 0-32 points (Dev tickets only)\n🥈 Staging - 33-65 points (Dev + Staging)\n🥇 Production - 66+ points (All environments)"
    },
    {
      keywords: ['template', 'templates', 'format', 'structure'],
      question: "What templates are available?",
      answer: "We have templates to help you write better tickets:\n• Bug Report Template - Steps to reproduce, expected vs actual\n• Feature Request Template - Problem statement, proposed solution\n• Support Request Template - Current situation, troubleshooting\n\nTemplates appear when you select a category while submitting."
    },
    {
      keywords: ['sla', 'response time', 'deadline', 'due'],
      question: "What is SLA and how does it work?",
      answer: "SLA (Service Level Agreement) sets response deadlines:\n• Critical: 1 hour\n• Urgent: 4 hours\n• High: 8 hours\n• Normal: 24 hours\n• Low: 48 hours\n\nMeeting SLA improves customer satisfaction scores and your reputation!"
    },
    {
      keywords: ['discussion', 'message', 'chat', 'communicate'],
      question: "How can I communicate about a ticket?",
      answer: "Each ticket has a private discussion thread:\n• Click on a ticket to open details\n• Go to the 'Discussion' tab\n• Send messages directly to the customer/tech\n• Messages are encrypted and private"
    },
    {
      keywords: ['cancel', 'close', 'reject', 'remove'],
      question: "How do I cancel or close a ticket?",
      answer: "• Customers can close resolved tickets\n• Techs can reject claimed tickets\n• Admins can close any ticket\n\nIf you need to cancel an open ticket, contact support."
    },
    {
      keywords: ['reset password', 'forgot', 'login', 'account'],
      question: "How do I reset my password?",
      answer: "Current version uses name-based login:\n• Enter your name in the identity field\n• Select your role (Customer/Tech/Admin)\n\nFor password reset, contact an admin."
    }
  ],
  responses: {
    thanks: [
      "You're welcome! Is there anything else I can help with?",
      "Happy to help! Let me know if you have other questions.",
      "Glad I could assist! Feel free to ask if you need more help."
    ],
    not_understood: [
      "I'm not sure I understood that. Could you rephrase? You can also type 'help' for a list of topics.",
      "Hmm, I didn't catch that. Try asking about: tickets, payments, ratings, or categories.",
      "I don't have information on that topic yet. Would you like me to create a support ticket for you?"
    ],
    create_ticket_prompt: [
      "Would you like me to create a support ticket? Just say 'yes' or 'create ticket' and I'll help you submit one.",
      "I can create a support ticket for you. Type 'yes' to proceed.",
      "Let me help you create a support ticket. Say 'yes' to start."
    ]
  }
};

// Find matching FAQ based on user message
function findMatchingFAQ(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const faq of knowledgeBase.faqs) {
    for (const keyword of faq.keywords) {
      if (lowerMessage.includes(keyword)) {
        return faq;
      }
    }
  }
  return null;
}

// Get random item from array
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Check if message is a greeting
function isGreeting(message) {
  const greetings = ['hello', 'hi', 'hey', 'help', '?'];
  const lower = message.toLowerCase();
  return greetings.some(g => lower === g || lower.startsWith(g + ' '));
}

// Check if message indicates thanks
function isThanks(message) {
  const thanks = ['thank', 'thanks', 'thx', 'appreciate'];
  return thanks.some(t => message.toLowerCase().includes(t));
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  const { message, user_name, session_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let response = '';
    let action = null;
    let faqMatched = null;

    // Check for specific intents
    if (isGreeting(message)) {
      response = getRandomItem(knowledgeBase.greetings);
    } else if (isThanks(message)) {
      response = getRandomItem(knowledgeBase.responses.thanks);
    } else if (message.toLowerCase().includes('create ticket') || 
               message.toLowerCase().includes('open ticket') ||
               message.toLowerCase().includes('submit ticket')) {
      response = "I can help you create a support ticket. Please provide:\n1. A brief title for your issue\n2. A description of what you need help with\n3. The priority level (normal, high, urgent, critical)";
      action = 'create_ticket';
    } else if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('yep') || message.toLowerCase().includes('yeah')) {
      response = "Great! Please tell me:\n1. What's the issue about?\n2. What's your name?\n3. What priority level?";
      action = 'collecting_info';
    } else {
      // Try to find matching FAQ
      faqMatched = findMatchingFAQ(message);
      
      if (faqMatched) {
        response = faqMatched.answer;
      } else {
        response = getRandomItem(knowledgeBase.responses.not_understood) + '\n\n' + 
                   getRandomItem(knowledgeBase.responses.create_ticket_prompt);
      }
    }

    // Log the conversation
    await pool.query(
      `INSERT INTO chatbot_conversations (session_id, user_name, user_message, bot_response, faq_matched, action_taken)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id || 'default', user_name || 'anonymous', message, response, faqMatched?.question || null, action]
    );

    res.json({
      response,
      faqMatched: faqMatched ? { question: faqMatched.question } : null,
      action,
      suggestions: getSuggestions(faqMatched, action)
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get suggested follow-up questions
function getSuggestions(faqMatched, action) {
  if (action === 'create_ticket') {
    return ['Yes, create a ticket', 'No, I have another question'];
  }
  
  if (faqMatched) {
    return [
      'Tell me more',
      'Create a support ticket',
      'I have another question'
    ];
  }

  return [
    'How do I submit a ticket?',
    'How do I get paid?',
    'What are priority levels?',
    'Contact support'
  ];
}

// Get FAQ list
router.get('/faqs', (req, res) => {
  const faqs = knowledgeBase.faqs.map(faq => ({
    question: faq.question,
    preview: faq.answer.substring(0, 100) + '...',
    keywords: faq.keywords
  }));
  res.json(faqs);
});

// Get single FAQ
router.get('/faqs/:id', (req, res) => {
  const { id } = req.params;
  const index = parseInt(id) - 1;
  
  if (index >= 0 && index < knowledgeBase.faqs.length) {
    res.json(knowledgeBase.faqs[index]);
  } else {
    res.status(404).json({ error: 'FAQ not found' });
  }
});

// Get chatbot help topics
router.get('/topics', (req, res) => {
  const topics = [
    { id: 'tickets', name: 'Tickets', icon: '🎫', description: 'Submitting, claiming, and resolving tickets' },
    { id: 'payments', name: 'Payments & Payouts', icon: '💰', description: 'Getting paid and managing finances' },
    { id: 'ratings', name: 'Ratings & Reputation', icon: '⭐', description: 'Building your rating and reputation' },
    { id: 'categories', name: 'Categories & Templates', icon: '📋', description: 'Using categories and issue templates' },
    { id: 'sla', name: 'SLA & Priorities', icon: '⏱️', description: 'Understanding response times' },
    { id: 'technical', name: 'Technical Support', icon: '🔧', description: 'Getting help with technical issues' }
  ];
  res.json(topics);
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM chatbot_conversations 
       WHERE session_id = ? 
       ORDER BY created_at DESC LIMIT 50`,
      [sessionId]
    );
    res.json(rows.reverse());
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
