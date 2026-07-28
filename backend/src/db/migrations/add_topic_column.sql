-- Migration: Add subcategory and topic columns to tickets table
-- These migrations add missing columns required by the ticket creation endpoint

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255) DEFAULT NULL AFTER category;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS topic VARCHAR(255) DEFAULT NULL AFTER subcategory;
