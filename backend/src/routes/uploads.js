import { Router } from 'express';
import pool from '../db/index.js';
import { storageService } from '../services/storage.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Upload file for ticket
 * POST /api/uploads/ticket/:ticketId
 */
router.post('/ticket/:ticketId', authenticate, async (req, res) => {
  const { ticketId } = req.params;
  const { user } = req;

  try {
    // Verify ticket exists and user has access
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check access (customer who created, tech assigned, or admin)
    if (user.role !== 'admin' && 
        ticket.customer_name !== user.name && 
        ticket.tech_name !== user.name) {
      return res.status(403).json({ error: 'Not authorized to upload files to this ticket' });
    }

    // Get file from request (support both multipart and base64)
    let fileBuffer, filename, mimeType;

    if (req.body.file) {
      // Base64 encoded file
      const base64Data = req.body.file.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      filename = req.body.filename || 'upload';
      mimeType = req.body.mimeType || 'application/octet-stream';
    } else if (req.file) {
      // Multipart file upload
      fileBuffer = req.file.buffer;
      filename = req.file.originalname;
      mimeType = req.file.mimetype;
    } else {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file
    if (!storageService.validateFileType(mimeType)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        allowed: ['Images (JPEG, PNG, GIF, WebP)', 'PDF', 'Documents']
      });
    }

    if (!storageService.validateFileSize(fileBuffer.length)) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    // Upload file
    const result = await storageService.upload(fileBuffer, filename, mimeType);

    // Store attachment in database
    const [attachment] = await pool.query(
      `INSERT INTO ticket_attachments 
       (ticket_id, uploader_name, file_name, file_type, file_size, file_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, user.name, filename, mimeType, fileBuffer.length, result.url]
    );

    // Add system message to discussion
    await pool.query(
      `INSERT INTO ticket_messages 
       (ticket_id, sender_name, sender_role, content, message_type, encrypted)
       VALUES (?, ?, ?, ?, 'file', TRUE)`,
      [ticketId, user.name, user.role, `Uploaded file: ${filename}`]
    );

    res.status(201).json({
      id: attachment.insertId,
      filename,
      mimeType,
      size: fileBuffer.length,
      url: result.url,
      type: result.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * Get attachments for a ticket
 * GET /api/uploads/ticket/:ticketId
 */
router.get('/ticket/:ticketId', optionalAuth, async (req, res) => {
  const { ticketId } = req.params;
  const { user } = req;

  try {
    // Verify ticket exists
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check access if authenticated
    if (user && user.role !== 'admin' && 
        ticket.customer_name !== user.name && 
        ticket.tech_name !== user.name) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [attachments] = await pool.query(
      `SELECT * FROM ticket_attachments 
       WHERE ticket_id = ? 
       ORDER BY created_at DESC`,
      [ticketId]
    );

    // Generate signed URLs for private files
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (att) => {
        let url = att.file_url;
        if (att.file_url.startsWith('/uploads/')) {
          // Local file - serve directly
          url = att.file_url;
        } else if (att.file_url.includes('s3.') || att.file_url.includes('cloudinary')) {
          // Cloud/S3 - generate signed URL
          try {
            url = await storageService.getSignedUrl(att.public_id || att.file_url, 3600);
          } catch {
            url = att.file_url;
          }
        }
        return { ...att, url };
      })
    );

    res.json(attachmentsWithUrls);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

/**
 * Delete attachment
 * DELETE /api/uploads/:attachmentId
 */
router.delete('/:attachmentId', authenticate, async (req, res) => {
  const { attachmentId } = req.params;
  const { user } = req;

  try {
    const [attachments] = await pool.query(
      'SELECT * FROM ticket_attachments WHERE id = ?',
      [attachmentId]
    );

    if (attachments.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attachments[0];

    // Only uploader or admin can delete
    if (attachment.uploader_name !== user.name && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }

    // Delete from storage
    if (attachment.public_id) {
      await storageService.deleteFile(attachment.public_id, attachment.storage_type);
    }

    // Delete from database
    await pool.query('DELETE FROM ticket_attachments WHERE id = ?', [attachmentId]);

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

/**
 * Get file content (for serving local files)
 * GET /api/uploads/file/:filename
 */
router.get('/file/:filename', async (req, res) => {
  const { filename } = req.params;
  const fs = await import('fs/promises');
  const path = await import('path');

  const filepath = path.join(process.cwd(), 'uploads', filename);

  try {
    const stat = await fs.stat(filepath);
    const file = await fs.readFile(filepath);
    
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.txt': 'text/plain'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.send(file);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

/**
 * Upload general file (not tied to ticket)
 * POST /api/uploads/general
 */
router.post('/general', authenticate, async (req, res) => {
  try {
    let fileBuffer, filename, mimeType;

    if (req.body.file) {
      const base64Data = req.body.file.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      filename = req.body.filename || 'upload';
      mimeType = req.body.mimeType || 'application/octet-stream';
    } else if (req.file) {
      fileBuffer = req.file.buffer;
      filename = req.file.originalname;
      mimeType = req.file.mimetype;
    } else {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!storageService.validateFileType(mimeType)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!storageService.validateFileSize(fileBuffer.length)) {
      return res.status(400).json({ error: 'File too large' });
    }

    const result = await storageService.upload(fileBuffer, filename, mimeType);

    res.status(201).json({
      filename,
      mimeType,
      size: fileBuffer.length,
      url: result.url,
      type: result.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
