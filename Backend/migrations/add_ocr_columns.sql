-- Migration: Add OCR columns to transactions table
-- Run this SQL script to add enhanced OCR functionality

-- Add merchant_name column
ALTER TABLE transactions 
ADD COLUMN merchant_name VARCHAR(255) NULL;

-- Add payment_method column  
ALTER TABLE transactions 
ADD COLUMN payment_method VARCHAR(100) NULL;

-- Add transaction_date column
ALTER TABLE transactions 
ADD COLUMN transaction_date DATE NULL;

-- Add ocr_confidence column
ALTER TABLE transactions 
ADD COLUMN ocr_confidence FLOAT NULL;

-- Add parsing_confidence column
ALTER TABLE transactions 
ADD COLUMN parsing_confidence FLOAT NULL;

-- Add raw_text column
ALTER TABLE transactions 
ADD COLUMN raw_text TEXT NULL;

-- Create index on transaction_date for better performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Create index on merchant_name for search performance
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name);

-- Show updated table structure
DESCRIBE transactions;
