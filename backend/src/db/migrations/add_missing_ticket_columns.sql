-- Migration: Add missing columns to tickets table
-- Run this to add columns that are referenced in code but may not exist in database

-- Add estimated_hours column
SET @dbname = DATABASE();
SET @tablename = 'tickets';
SET @columnname = 'estimated_hours';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE tickets ADD COLUMN estimated_hours DECIMAL(10,2) DEFAULT NULL AFTER tags'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add actual_hours column
SET @columnname = 'actual_hours';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE tickets ADD COLUMN actual_hours DECIMAL(10,2) DEFAULT NULL AFTER estimated_hours'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add time_remaining_hours column
SET @columnname = 'time_remaining_hours';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE tickets ADD COLUMN time_remaining_hours DECIMAL(10,2) DEFAULT NULL AFTER actual_hours'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
