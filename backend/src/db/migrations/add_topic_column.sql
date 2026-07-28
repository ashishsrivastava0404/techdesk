-- Migration: Add subcategory and topic columns to tickets table
-- These migrations add missing columns required by the ticket creation endpoint
-- MariaDB doesn't support ADD COLUMN IF NOT EXISTS, so we check INFORMATION_SCHEMA first

SET @dbname = DATABASE();
SET @tablename = 'tickets';
SET @columnname = 'subcategory';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE tickets ADD COLUMN subcategory VARCHAR(255) DEFAULT NULL AFTER category'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'topic';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE tickets ADD COLUMN topic VARCHAR(255) DEFAULT NULL AFTER subcategory'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
