-- Migration: Add ticket_type and assigned_to_admin columns
-- Run this if the automatic migration fails

ALTER TABLE tickets
ADD COLUMN ticket_type ENUM('business', 'technical') DEFAULT 'technical'
AFTER priority;

ALTER TABLE tickets
ADD COLUMN assigned_to_admin VARCHAR(255) DEFAULT NULL
AFTER tech_name;

-- Add indexes for faster filtering
ALTER TABLE tickets ADD INDEX idx_ticket_type (ticket_type);
ALTER TABLE tickets ADD INDEX idx_assigned_admin (assigned_to_admin);
