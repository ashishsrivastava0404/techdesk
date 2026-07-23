import { Router } from 'express';
import pool from '../db/index.js';
import { routingService } from '../services/routing.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/agents/request-customer
 * Agent sends a request to a customer for a specific ticket
 */
router.post('/request-customer', async (req, res) => {
  const { ticket_id, tech_name, customer_name, message, proposed_rate, estimated_days } = req.body;

  if (!ticket_id || !tech_name || !customer_name) {
    return res.status(400).json({ error: 'ticket_id, tech_name, and customer_name are required' });
  }

  try {
    // Verify ticket exists
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ? AND customer_name = ?',
      [ticket_id, customer_name]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found or you are not the owner' });
    }

    const ticket = tickets[0];

    // Check if ticket is in valid state for requests
    if (ticket.status === 'pending_assignment' || ticket.status === 'open') {
      // Continue
    } else if (ticket.tech_name) {
      return res.status(400).json({ 
        error: 'This ticket already has an assigned agent',
        currentTech: ticket.tech_name
      });
    }

    // Check for existing pending request from same tech
    const [existing] = await pool.query(
      `SELECT * FROM agent_requests 
       WHERE ticket_id = ? AND tech_name = ? AND status = 'pending'`,
      [ticket_id, tech_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending request for this ticket' });
    }

    // Create the request
    const [result] = await pool.query(
      `INSERT INTO agent_requests 
       (ticket_id, tech_name, customer_name, message, proposed_rate, estimated_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticket_id, tech_name, customer_name, message || null, proposed_rate || null, estimated_days || null]
    );

    // Get agent profile for notification
    const agentProfile = await routingService.getAgentProfile(tech_name);

    // Notify customer
    await pool.query(
      `INSERT INTO notifications 
       (user_name, type, title, message, related_ticket_id, related_user)
       VALUES (?, 'agent_request', 'New Agent Request', ?, ?, ?)`,
      [
        customer_name,
        `${tech_name} wants to help with your ticket: "${ticket.title}"`,
        ticket_id,
        tech_name
      ]
    );

    const [request] = await pool.query(
      'SELECT * FROM agent_requests WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      ...request[0],
      agent_profile: agentProfile
    });
  } catch (error) {
    console.error('Error creating agent request:', error);
    res.status(500).json({ error: 'Failed to create agent request' });
  }
});

/**
 * GET /api/agents/requests/pending
 * Get pending requests for a customer
 */
router.get('/requests/pending', async (req, res) => {
  const { customer_name } = req.query;

  if (!customer_name) {
    return res.status(400).json({ error: 'customer_name is required' });
  }

  try {
    const [requests] = await pool.query(
      `SELECT ar.*, t.title as ticket_title, t.category, t.priority, t.status as ticket_status
       FROM agent_requests ar
       JOIN tickets t ON ar.ticket_id = t.id
       WHERE ar.customer_name = ? AND ar.status = 'pending'
       ORDER BY ar.created_at DESC`,
      [customer_name]
    );

    // Get agent profiles for each request
    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const agentProfile = await routingService.getAgentProfile(request.tech_name);
        return {
          ...request,
          agent_profile: agentProfile
        };
      })
    );

    res.json(requestsWithProfiles);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/**
 * GET /api/agents/requests/sent
 * Get requests sent by an agent
 */
router.get('/requests/sent', async (req, res) => {
  const { tech_name } = req.query;

  if (!tech_name) {
    return res.status(400).json({ error: 'tech_name is required' });
  }

  try {
    const [requests] = await pool.query(
      `SELECT ar.*, t.title as ticket_title, t.category, t.priority, t.status as ticket_status
       FROM agent_requests ar
       JOIN tickets t ON ar.ticket_id = t.id
       WHERE ar.tech_name = ?
       ORDER BY ar.created_at DESC`,
      [tech_name]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

/**
 * PATCH /api/agents/requests/:id/approve
 * Customer approves an agent request
 */
router.patch('/requests/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { customer_name, response_message } = req.body;

  if (!customer_name) {
    return res.status(400).json({ error: 'customer_name is required' });
  }

  try {
    // Get the request
    const [requests] = await pool.query(
      'SELECT * FROM agent_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    // Verify ownership
    if (request.customer_name !== customer_name) {
      return res.status(403).json({ error: 'You are not authorized to approve this request' });
    }

    // Check status
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    // Update request status
    await pool.query(
      `UPDATE agent_requests 
       SET status = 'approved', response_message = ?, responded_at = NOW() 
       WHERE id = ?`,
      [response_message || null, id]
    );

    // Update ticket - assign tech and set status to claimed
    await pool.query(
      `UPDATE tickets 
       SET tech_name = ?, status = 'claimed', assigned_at = NOW() 
       WHERE id = ?`,
      [request.tech_name, request.ticket_id]
    );

    // Reject other pending requests for this ticket
    await pool.query(
      `UPDATE agent_requests 
       SET status = 'rejected', response_message = 'Another agent was selected', responded_at = NOW() 
       WHERE ticket_id = ? AND status = 'pending' AND id != ?`,
      [request.ticket_id, id]
    );

    // Notify agent
    await pool.query(
      `INSERT INTO notifications 
       (user_name, type, title, message, related_ticket_id)
       VALUES (?, 'request_approved', 'Request Approved!', ?, ?)`,
      [
        request.tech_name,
        `Great news! Your request has been approved. You are now assigned to the ticket.`,
        request.ticket_id
      ]
    );

    const [updatedRequest] = await pool.query(
      'SELECT * FROM agent_requests WHERE id = ?',
      [id]
    );

    res.json(updatedRequest[0]);
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

/**
 * PATCH /api/agents/requests/:id/reject
 * Customer rejects an agent request
 */
router.patch('/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { customer_name, response_message } = req.body;

  if (!customer_name) {
    return res.status(400).json({ error: 'customer_name is required' });
  }

  try {
    const [requests] = await pool.query(
      'SELECT * FROM agent_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    if (request.customer_name !== customer_name) {
      return res.status(403).json({ error: 'You are not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    await pool.query(
      `UPDATE agent_requests 
       SET status = 'rejected', response_message = ?, responded_at = NOW() 
       WHERE id = ?`,
      [response_message || null, id]
    );

    // Notify agent
    await pool.query(
      `INSERT INTO notifications 
       (user_name, type, title, message, related_ticket_id)
       VALUES (?, 'request_rejected', 'Request Declined', ?, ?)`,
      [
        request.tech_name,
        `Your request for ticket #${request.ticket_id} was declined.`,
        request.ticket_id
      ]
    );

    const [updatedRequest] = await pool.query(
      'SELECT * FROM agent_requests WHERE id = ?',
      [id]
    );

    res.json(updatedRequest[0]);
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

/**
 * GET /api/agents/requests/:id
 * Get single request details
 */
router.get('/requests/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [requests] = await pool.query(
      `SELECT ar.*, t.title as ticket_title, t.category, t.priority
       FROM agent_requests ar
       JOIN tickets t ON ar.ticket_id = t.id
       WHERE ar.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];
    const agentProfile = await routingService.getAgentProfile(request.tech_name);

    res.json({
      ...request,
      agent_profile: agentProfile
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

export default router;
