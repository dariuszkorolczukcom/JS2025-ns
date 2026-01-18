-- Migration script to add youtube_url column to music table
-- This script can be run on existing databases to add the youtube_url field

-- Add youtube_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'music' 
        AND column_name = 'youtube_url'
    ) THEN
        ALTER TABLE music ADD COLUMN youtube_url TEXT;
    END IF;
END $$;
