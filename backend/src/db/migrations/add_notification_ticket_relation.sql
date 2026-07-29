-- Add related_ticket_id column to notifications table
-- This allows notifications to be linked to specific tickets
ALTER TABLE notifications ADD COLUMN related_ticket_id INT DEFAULT NULL;

-- Add foreign key constraint (optional - can be skipped if FK causes issues)
-- ALTER TABLE notifications ADD CONSTRAINT fk_notification_ticket 
--   FOREIGN KEY (related_ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;
