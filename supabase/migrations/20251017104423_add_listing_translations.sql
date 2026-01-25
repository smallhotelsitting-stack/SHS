/*
  # Add Translations Support for Listings

  1. Changes
    - Add `translations` JSONB column to listings table to store translations
    - Store translations in format: { "es": { "title": "...", "description": "...", "location": "..." }, "fr": { ... } }
    - Original language fields (title, description, location) remain as the source/default language
    
  2. Structure
    The translations column will contain an object with language codes as keys:
    ```json
    {
      "es": {
        "title": "Spanish title",
        "description": "Spanish description",
        "location": "Spanish location"
      },
      "fr": {
        "title": "French title",
        "description": "French description",
        "location": "French location"
      }
    }
    ```

  3. Notes
    - If a translation is missing for a language, fallback to the original fields
    - Translations are optional and can be added/updated asynchronously
*/

-- Add translations column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb;