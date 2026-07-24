/**
 * Ticket Comments Routes
 * 
 * Provides threaded discussion functionality for tickets.
 * Comments can be between customers and technicians.
 */

import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/tickets/:ticketId/comments
 * Get all comments for a ticket (threaded)
 */
router.get('/:ticketId/comments', async (req, res) => {
  const { ticketId } = req.params;
  const { includeInternal = 'false' } = req.query;
  const userRole = req.user?.role;
  
  try {
    // Build query based on user role
    let query = `
      SELECT 
        c.*,
        u.name as user_display_name,
        u.avatar_url
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
    `;
    
    // Non-technicians/admins can't see internal notes unless they're the author
    if (userRole !== 'technician' && userRole !== 'admin' && userRole !== 'owner') {
      if (includeInternal !== 'true') {
        query += ` AND c.is_internal = FALSE`;
      }
    }
    
    query += ` ORDER BY c.created_at ASC`;
    
    const [comments] = await pool.query(query, [ticketId]);
    
    // Organize comments into threads
    const threadedComments = buildCommentThreads(comments);
    
    res.json({
      success: true,
      data: threadedComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch comments' 
    });
  }
});

/**
 * POST /api/tickets/:ticketId/comments
 * Add a comment to a ticket
 */
router.post('/:ticketId/comments', async (req, res) => {
  const { ticketId } = req.params;
  const { 
    message, 
    message_type = 'comment',
    parent_id = null,
    is_internal = false,
    attachments = null
  } = req.body;
  
  // Access control: must be ticket owner, assigned tech, or admin
  const userId = req.user?.id;
  const userName = req.user?.name || 'Anonymous';
  const userRole = req.user?.role || 'customer';
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ 
      success: false,
      error: 'Message is required' 
    });
  }
  
  try {
    // Verify ticket exists
    const [tickets] = await pool.query(
      'SELECT id, customer_id, tech_id FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    const ticket = tickets[0];
    
    // Access control check
    const isOwner = ticket.customer_id === userId;
    const isTech = ticket.tech_id === userId;
    const isAdmin = userRole === 'admin';
    
    // Internal notes require technician or admin role
    if (is_internal && !isTech && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only technicians can add internal notes'
      });
    }
    
    // Verify parent comment belongs to this ticket if provided
    if (parent_id) {
      const [parentComments] = await pool.query(
        'SELECT id FROM ticket_comments WHERE id = ? AND ticket_id = ?',
        [parent_id, ticketId]
      );
      
      if (parentComments.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Parent comment not found in this ticket'
        });
      }
    }
    
    // Determine user role for the comment
    let commentRole = 'customer';
    if (userRole === 'admin') commentRole = 'admin';
    else if (userRole === 'technician' || isTech) commentRole = 'technician';
    
    // Insert comment
    const [result] = await pool.query(
      `INSERT INTO ticket_comments 
       (ticket_id, user_id, user_name, user_role, message, message_type, parent_id, is_internal, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId, 
        userId, 
        userName, 
        commentRole,
        message.trim(), 
        message_type,
        parent_id,
        is_internal,
        attachments ? JSON.stringify(attachments) : null
      ]
    );
    
    // Fetch the created comment
    const [comments] = await pool.query(
      `SELECT c.*, u.name as user_display_name, u.avatar_url
       FROM ticket_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: comments[0]
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

/**
 * PATCH /api/tickets/:ticketId/comments/:commentId
 * Update a comment
 */
router.patch('/:ticketId/comments/:commentId', async (req, res) => {
  const { ticketId, commentId } = req.params;
  const { message, is_internal } = req.body;
  
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  try {
    // Verify comment exists and belongs to ticket
    const [comments] = await pool.query(
      'SELECT * FROM ticket_comments WHERE id = ? AND ticket_id = ?',
      [commentId, ticketId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    const comment = comments[0];
    
    // Only author or admin can update
    if (comment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }
    
    // Internal toggle requires technician/admin
    if (is_internal !== undefined && is_internal !== comment.is_internal) {
      if (userRole !== 'technician' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only technicians can change internal status'
        });
      }
    }
    
    const updates = [];
    const params = [];
    
    if (message !== undefined) {
      updates.push('message = ?');
      params.push(message.trim());
    }
    
    if (is_internal !== undefined) {
      updates.push('is_internal = ?');
      params.push(is_internal);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    params.push(commentId);
    
    await pool.query(
      `UPDATE ticket_comments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    // Fetch updated comment
    const [updatedComments] = await pool.query(
      `SELECT c.*, u.name as user_display_name, u.avatar_url
       FROM ticket_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );
    
    res.json({
      success: true,
      data: updatedComments[0]
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

/**
 * DELETE /api/tickets/:ticketId/comments/:commentId
 * Delete a comment
 */
router.delete('/:ticketId/comments/:commentId', async (req, res) => {
  const { ticketId, commentId } = req.params;
  
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  try {
    const [comments] = await pool.query(
      'SELECT * FROM ticket_comments WHERE id = ? AND ticket_id = ?',
      [commentId, ticketId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    const comment = comments[0];
    
    // Only author or admin can delete
    if (comment.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }
    
    // Delete comment (children will be orphaned or we can delete recursively)
    await pool.query('DELETE FROM ticket_comments WHERE id = ?', [commentId]);
    
    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

/**
 * Helper function to build comment threads
 */
function buildCommentThreads(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });
  
  // Second pass: organize into threads
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id);
    
    if (comment.parent_id === null) {
      rootComments.push(commentNode);
    } else {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.children.push(commentNode);
      } else {
        // Parent not found, treat as root
        rootComments.push(commentNode);
      }
    }
  });
  
  return rootComments;
}

export default router;
