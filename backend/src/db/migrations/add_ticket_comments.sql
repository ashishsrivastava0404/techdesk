-- Migration: Add ticket_comments table for threaded discussions
-- Date: 2024

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role ENUM('customer', 'technician', 'admin', 'system') NOT NULL DEFAULT 'customer',
  message TEXT NOT NULL,
  message_type ENUM('comment', 'note', 'resolution', 'internal') NOT NULL DEFAULT 'comment',
  parent_id INT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  attachments JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES ticket_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add topic column to tickets table (if not exists)
-- Note: Run this separately if the column already exists from a previous migration
-- ALTER TABLE tickets ADD COLUMN topic VARCHAR(255) NULL AFTER subcategory;
