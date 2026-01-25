/*
  # Add Media Support to Listings

  ## Changes Made
  
  1. Schema Updates
    - Add `videos` column to listings table (jsonb array)
    - The existing `images` column will continue to store image URLs (max 10)
    - Videos column will store video URLs (max 3)
  
  2. Notes
    - Images array can contain up to 10 image URLs
    - Videos array can contain up to 3 video URLs
    - Both are stored as JSONB arrays for flexibility
    - No breaking changes to existing data structure
*/

-- Add videos column to listings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'videos'
  ) THEN
    ALTER TABLE listings ADD COLUMN videos jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN listings.images IS 'Array of image URLs (max 10)';
COMMENT ON COLUMN listings.videos IS 'Array of video URLs (max 3)';
