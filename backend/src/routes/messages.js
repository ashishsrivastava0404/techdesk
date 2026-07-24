/**
 * Messages Routes
 * Handles in-app messaging between tech and customer
 */

import express from 'express';
import { messageService } from '../services/messageService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
router.get('/conversations', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const conversations = await messageService.getUserConversations(userId);
  res.json({ conversations });
}));

/**
 * GET /api/messages/conversations/:ticketId
 * Get or create conversation for a ticket
 */
router.get('/conversations/ticket/:ticketId', asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Get ticket to find customer and tech
  const [tickets] = await req.db.query(
    'SELECT customer_id, tech_id FROM tickets WHERE id = ?',
    [ticketId]
  );

  if (tickets.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[0];
  const conversation = await messageService.getOrCreateConversation(
    ticketId,
    ticket.customer_id,
    ticket.tech_id
  );

  res.json({ conversation });
}));

/**
 * GET /api/messages/:conversationId
 * Get messages for a conversation
 */
router.get('/:conversationId', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verify user has access to this conversation
  const [convs] = await req.db.query(
    'SELECT * FROM conversations WHERE id = ? AND (customer_id = ? OR tech_id = ?)',
    [conversationId, userId, userId]
  );

  if (convs.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const messages = await messageService.getMessages(
    parseInt(conversationId),
    parseInt(limit),
    parseInt(offset)
  );

  // Mark messages as read
  await messageService.markAsRead(parseInt(conversationId), userId);

  res.json({ messages });
}));

/**
 * POST /api/messages/:conversationId
 * Send a message to a conversation
 */
router.post('/:conversationId', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, messageType = 'text', attachmentUrl } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Verify user has access to this conversation
  const [convs] = await req.db.query(
    'SELECT * FROM conversations WHERE id = ? AND (customer_id = ? OR tech_id = ?)',
    [conversationId, userId, userId]
  );

  if (convs.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const message = await messageService.sendMessage(
    parseInt(conversationId),
    userId,
    content,
    messageType,
    attachmentUrl
  );

  // Get sender info
  const [users] = await req.db.query(
    'SELECT id, name, role FROM users WHERE id = ?',
    [userId]
  );

  res.status(201).json({ 
    message: {
      ...message,
      sender_name: users[0]?.name,
      sender_role: users[0]?.role
    }
  });
}));

/**
 * GET /api/messages/unread/count
 * Get unread message count for authenticated user
 */
router.get('/unread/count', asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const count = await messageService.getUnreadCount(userId);
  res.json({ unreadCount: count });
}));

/**
 * POST /api/messages/:conversationId/read
 * Mark all messages in conversation as read
 */
router.post('/:conversationId/read', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  await messageService.markAsRead(parseInt(conversationId), userId);
  res.json({ success: true });
}));

/**
 * POST /api/messages/conversations/:conversationId/assign
 * Assign tech to conversation
 */
router.post('/conversations/:conversationId/assign', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { techId } = req.body;

  if (!techId) {
    return res.status(400).json({ error: 'techId is required' });
  }

  await messageService.assignTech(parseInt(conversationId), techId);
  res.json({ success: true });
}));

export default router;
