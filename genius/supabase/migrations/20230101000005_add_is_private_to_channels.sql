-- Add is_private column to channels table
ALTER TABLE channels
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update existing channels to set is_private status
UPDATE channels
SET is_private = false
WHERE is_private IS NULL;

