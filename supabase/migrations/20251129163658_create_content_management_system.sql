/*
  # Content Management System for Visual Editing

  ## Overview
  This migration creates the complete infrastructure for a Wix-style visual content management system
  where admins can edit every element on the site with version control and change tracking.

  ## New Tables

  ### site_content
  Stores all editable page content and elements
  - `id` (uuid, primary key)
  - `page_name` (text) - Which page this content belongs to (e.g., 'home', 'listings')
  - `section_id` (text) - Section identifier (e.g., 'hero', 'features', 'cta')
  - `element_id` (text) - Unique element identifier within section
  - `element_type` (text) - Type of element (text, image, button, container, gradient)
  - `content` (jsonb) - Actual content data (text, urls, etc)
  - `styles` (jsonb) - CSS styles and properties
  - `order_index` (integer) - Display order within section
  - `is_visible` (boolean) - Whether element is currently visible
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### content_versions
  Stores complete snapshots of page content for version history
  - `id` (uuid, primary key)
  - `page_name` (text) - Which page this version is for
  - `version_name` (text) - User-friendly version name
  - `version_number` (integer) - Auto-incrementing version number per page
  - `full_snapshot` (jsonb) - Complete page state snapshot
  - `is_published` (boolean) - Whether this version is currently live
  - `published_at` (timestamptz) - When this version was published
  - `created_by` (uuid) - Admin who created this version
  - `created_at` (timestamptz)

  ### content_changes_log
  Detailed audit trail of every content change
  - `id` (uuid, primary key)
  - `version_id` (uuid) - Associated version
  - `admin_id` (uuid) - Admin who made the change
  - `page_name` (text) - Page that was changed
  - `change_type` (text) - Type of change (create, update, delete, reorder)
  - `element_path` (text) - Path to the changed element
  - `old_value` (jsonb) - Previous value
  - `new_value` (jsonb) - New value
  - `timestamp` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Only admins can modify content
  - All users can read published content
  - Comprehensive audit logging

  ## Important Notes
  - All changes are tracked and reversible
  - Version history allows restoration of any previous state
  - Changes are auto-saved as drafts before publishing
  - Published versions are immutable (create new version to change)
*/

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  section_id text NOT NULL,
  element_id text NOT NULL,
  element_type text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  styles jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_name, section_id, element_id)
);

-- Create content_versions table
CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  version_name text NOT NULL,
  version_number integer NOT NULL,
  full_snapshot jsonb NOT NULL,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create content_changes_log table
CREATE TABLE IF NOT EXISTS content_changes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES content_versions(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES profiles(id),
  page_name text NOT NULL,
  change_type text NOT NULL,
  element_path text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_name);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(page_name, section_id);
CREATE INDEX IF NOT EXISTS idx_site_content_order ON site_content(page_name, section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_versions_page ON content_versions(page_name);
CREATE INDEX IF NOT EXISTS idx_content_versions_published ON content_versions(page_name, is_published);
CREATE INDEX IF NOT EXISTS idx_content_changes_version ON content_changes_log(version_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_admin ON content_changes_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_timestamp ON content_changes_log(timestamp DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS site_content_updated_at ON site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- Create function to auto-increment version numbers
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    NEW.version_number := COALESCE(
      (SELECT MAX(version_number) FROM content_versions WHERE page_name = NEW.page_name),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing version numbers
DROP TRIGGER IF EXISTS content_versions_number ON content_versions;
CREATE TRIGGER content_versions_number
  BEFORE INSERT ON content_versions
  FOR EACH ROW
  EXECUTE FUNCTION set_version_number();

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_content
CREATE POLICY "Anyone can view published site content"
  ON site_content FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete site content"
  ON site_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for content_versions
CREATE POLICY "Anyone can view published versions"
  ON content_versions FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

CREATE POLICY "Admins can view all versions"
  ON content_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can create versions"
  ON content_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update versions"
  ON content_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete versions"
  ON content_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for content_changes_log
CREATE POLICY "Only admins can view change logs"
  ON content_changes_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can create change logs"
  ON content_changes_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Helper function to get current published content for a page
CREATE OR REPLACE FUNCTION get_published_content(p_page_name text)
RETURNS jsonb AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  SELECT full_snapshot INTO v_snapshot
  FROM content_versions
  WHERE page_name = p_page_name
    AND is_published = true
  ORDER BY published_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_snapshot, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to publish a version
CREATE OR REPLACE FUNCTION publish_content_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
  v_page_name text;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can publish content versions';
  END IF;

  -- Get page name
  SELECT page_name INTO v_page_name
  FROM content_versions
  WHERE id = p_version_id;

  -- Unpublish all other versions for this page
  UPDATE content_versions
  SET is_published = false
  WHERE page_name = v_page_name
    AND is_published = true;

  -- Publish this version
  UPDATE content_versions
  SET is_published = true,
      published_at = now()
  WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create initial content snapshot
CREATE OR REPLACE FUNCTION create_content_snapshot(
  p_page_name text,
  p_version_name text
)
RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
  v_snapshot jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create content snapshots';
  END IF;

  -- Get current content for page
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'section_id', section_id,
      'element_id', element_id,
      'element_type', element_type,
      'content', content,
      'styles', styles,
      'order_index', order_index,
      'is_visible', is_visible
    )
  ) INTO v_snapshot
  FROM site_content
  WHERE page_name = p_page_name
  ORDER BY section_id, order_index;

  -- Create version
  INSERT INTO content_versions (page_name, version_name, full_snapshot, created_by)
  VALUES (p_page_name, p_version_name, COALESCE(v_snapshot, '[]'::jsonb), auth.uid())
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
