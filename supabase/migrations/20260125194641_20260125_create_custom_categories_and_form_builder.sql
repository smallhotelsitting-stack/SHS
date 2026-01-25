/*
  # Create Custom Categories and Dynamic Form Builder System

  1. New Tables
    - `custom_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `icon` (text, optional)
      - `color` (text)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `deleted_at` (timestamp for soft delete)

    - `form_schemas`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to custom_categories)
      - `fields` (jsonb, array of field configurations)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `listing_form_data`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, foreign key to listings)
      - `category_id` (uuid, foreign key to custom_categories)
      - `form_data` (jsonb, submitted form values)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications to listings table
    - Add `custom_category_id` (uuid, nullable, foreign key to custom_categories)
    - Add `form_data_id` (uuid, nullable, foreign key to listing_form_data)

  3. Security
    - Enable RLS on all new tables
    - Only admins can create/update categories
    - Admins can view all form data; users can view their own listings' form data
    - Form schemas are public (read-only for non-admins)
    - Delete policies prevent accidental data loss

  4. Indexes
    - custom_categories: (slug), (created_by)
    - form_schemas: (category_id), (created_by)
    - listing_form_data: (listing_id), (category_id)
    - listings: (custom_category_id) for filtering by custom category
*/

-- Create custom_categories table
CREATE TABLE IF NOT EXISTS custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'tag',
  color text DEFAULT 'primary',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create form_schemas table
CREATE TABLE IF NOT EXISTS form_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES custom_categories(id) ON DELETE CASCADE,
  fields jsonb NOT NULL DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id)
);

-- Create listing_form_data table
CREATE TABLE IF NOT EXISTS listing_form_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES custom_categories(id) ON DELETE RESTRICT,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(listing_id)
);

-- Add columns to listings table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'custom_category_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN custom_category_id uuid REFERENCES custom_categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'form_data_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN form_data_id uuid REFERENCES listing_form_data(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_form_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_categories
CREATE POLICY "Everyone can view active custom categories"
  ON custom_categories FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Only admins can create custom categories"
  ON custom_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update custom categories"
  ON custom_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete custom categories"
  ON custom_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for form_schemas
CREATE POLICY "Everyone can view form schemas"
  ON form_schemas FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create form schemas"
  ON form_schemas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update form schemas"
  ON form_schemas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for listing_form_data
CREATE POLICY "Users can view form data for their own listings"
  ON listing_form_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND author_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create form data for their own listings"
  ON listing_form_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own listing form data"
  ON listing_form_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND author_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_categories_slug ON custom_categories(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_custom_categories_created_by ON custom_categories(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_schemas_category_id ON form_schemas(category_id);
CREATE INDEX IF NOT EXISTS idx_form_schemas_created_by ON form_schemas(created_by);
CREATE INDEX IF NOT EXISTS idx_listing_form_data_listing_id ON listing_form_data(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_form_data_category_id ON listing_form_data(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_custom_category_id ON listings(custom_category_id) WHERE custom_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_form_data_id ON listings(form_data_id) WHERE form_data_id IS NOT NULL;
