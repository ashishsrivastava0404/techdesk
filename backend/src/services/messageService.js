/**
 * Message Service
 * Handles in-app messaging between tech and customer
 */

import db from '../db/index.js';

export const messageService = {
  /**
   * Create or get conversation for a ticket
   */
  async getOrCreateConversation(ticketId, customerId, techId = null) {
    try {
      // Check if conversation exists
      const [existing] = await db.query(
        'SELECT * FROM conversations WHERE ticket_id = ?',
        [ticketId]
      );

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new conversation
      const [result] = await db.execute(
        `INSERT INTO conversations (ticket_id, customer_id, tech_id) VALUES (?, ?, ?)`,
        [ticketId, customerId, techId]
      );

      return {
        id: result.insertId,
        ticket_id: ticketId,
        customer_id: customerId,
        tech_id: techId
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, content, messageType = 'text', attachmentUrl = null) {
    try {
      const [result] = await db.execute(
        `INSERT INTO messages (conversation_id, sender_id, message_type, content, attachment_url)
         VALUES (?, ?, ?, ?, ?)`,
        [conversationId, senderId, messageType, content, attachmentUrl]
      );

      // Update conversation timestamp
      await db.execute(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

      return {
        id: result.insertId,
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: messageType,
        content,
        attachment_url: attachmentUrl,
        is_read: false,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const [messages] = await db.query(
        `SELECT m.*, u.name as sender_name, u.role as sender_role
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, userId) {
    try {
      await db.execute(
        `UPDATE messages 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE`,
        [conversationId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId) {
    try {
      const [result] = await db.query(
        `SELECT COUNT(*) as count
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE (c.customer_id = ? OR c.tech_id = ?)
           AND m.sender_id != ?
           AND m.is_read = FALSE`,
        [userId, userId, userId]
      );
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId) {
    try {
      const [conversations] = await db.query(
        `SELECT c.*, 
                t.subject as ticket_subject,
                t.status as ticket_status,
                t.priority as ticket_priority,
                cu.name as customer_name,
                tu.name as tech_name,
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.conversation_id = c.id 
                   AND m.sender_id != ? 
                   AND m.is_read = FALSE) as unread_count,
                (SELECT content FROM messages m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.created_at DESC LIMIT 1) as last_message
         FROM conversations c
         JOIN tickets t ON c.ticket_id = t.id
         JOIN users cu ON c.customer_id = cu.id
         LEFT JOIN users tu ON c.tech_id = tu.id
         WHERE c.customer_id = ? OR c.tech_id = ?
         ORDER BY c.updated_at DESC`,
        [userId, userId, userId]
      );

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Assign tech to conversation
   */
  async assignTech(conversationId, techId) {
    try {
      await db.execute(
        'UPDATE conversations SET tech_id = ? WHERE id = ?',
        [techId, conversationId]
      );

      // Add system message
      await this.sendMessage(
        conversationId,
        techId,
        `Ticket assigned to technician`,
        'system'
      );

      return true;
    } catch (error) {
      console.error('Error assigning tech:', error);
      return false;
    }
  },

  /**
   * Initialize messages table
   */
  async initializeTables() {
    try {
      // Conversations table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          ticket_id INT NOT NULL,
          customer_id INT NOT NULL,
          tech_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id),
          FOREIGN KEY (customer_id) REFERENCES users(id),
          FOREIGN KEY (tech_id) REFERENCES users(id)
        )
      `);

      // Messages table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS messages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          conversation_id INT NOT NULL,
          sender_id INT NOT NULL,
          message_type ENUM('text', 'attachment', 'system') DEFAULT 'text',
          content TEXT NOT NULL,
          attachment_url VARCHAR(500),
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id),
          FOREIGN KEY (sender_id) REFERENCES users(id)
        )
      `);

      // Notification preferences table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL UNIQUE,
          email_enabled BOOLEAN DEFAULT TRUE,
          sms_enabled BOOLEAN DEFAULT TRUE,
          in_app_enabled BOOLEAN DEFAULT TRUE,
          push_enabled BOOLEAN DEFAULT TRUE,
          email_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'instant',
          quiet_hours_start TIME,
          quiet_hours_end TIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      console.log('Message tables initialized successfully');
    } catch (error) {
      console.error('Error initializing message tables:', error);
    }
  }
};

export default messageService;
