import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Import pool at module level for GET endpoint
let pool = null;
const getPool = async () => {
  if (!pool) {
    pool = (await import('../db/index.js')).default;
  }
  return pool;
};

// Get all attachments
router.get('/', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.query(
      'SELECT * FROM attachments ORDER BY uploaded_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/xml',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files per request
  }
});

// Upload attachments for a ticket
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    const { ticket_id } = req.body;
    
    if (!ticket_id) {
      return res.status(400).json({ error: 'ticket_id is required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const attachments = req.files.map(file => ({
      id: crypto.randomBytes(8).toString('hex'),
      ticket_id: parseInt(ticket_id),
      filename: file.originalname,
      stored_filename: file.filename,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_at: new Date().toISOString()
    }));
    
    // Store attachment metadata in database
    const pool = (await import('../db/index.js')).default;
    
    for (const attachment of attachments) {
      await pool.query(
        `INSERT INTO attachments (ticket_id, filename, stored_filename, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [attachment.ticket_id, attachment.filename, attachment.stored_filename, attachment.file_path, attachment.file_size, attachment.mime_type]
      );
    }
    
    res.status(201).json({
      success: true,
      message: `${attachments.length} file(s) uploaded successfully`,
      attachments
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// Get attachments for a ticket
router.get('/ticket/:ticket_id', async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const pool = (await import('../db/index.js')).default;
    
    const [rows] = await pool.query(
      'SELECT * FROM attachments WHERE ticket_id = ? ORDER BY uploaded_at DESC',
      [ticket_id]
    );
    
    res.json({ attachments: rows });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Download an attachment
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = (await import('../db/index.js')).default;
    
    const [rows] = await pool.query('SELECT * FROM attachments WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = rows[0];
    
    // Verify file exists
    try {
      await fs.access(attachment.file_path);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.download(attachment.file_path, attachment.filename);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Delete an attachment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = (await import('../db/index.js')).default;
    
    const [rows] = await pool.query('SELECT * FROM attachments WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const attachment = rows[0];
    
    // Delete file from disk
    try {
      await fs.unlink(attachment.file_path);
    } catch (err) {
      console.warn('File already deleted from disk:', err.code);
    }
    
    // Delete from database
    await pool.query('DELETE FROM attachments WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
