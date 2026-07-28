-- Add ticket_type column to tickets table
-- 'technical' = bugs, code, infrastructure (for techs)
-- 'business' = account, billing, login issues (for admins)

ALTER TABLE tickets 
ADD COLUMN ticket_type ENUM('business', 'technical') DEFAULT 'technical'
AFTER priority;

-- Add index for faster filtering by ticket_type
ALTER TABLE tickets 
ADD INDEX idx_ticket_type (ticket_type);

-- Add assigned_to_admin column for business tickets
ALTER TABLE tickets
ADD COLUMN assigned_to_admin VARCHAR(255) DEFAULT NULL
AFTER tech_name;
