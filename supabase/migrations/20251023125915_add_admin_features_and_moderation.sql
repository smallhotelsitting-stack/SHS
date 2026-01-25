/*
  # Add Admin Features and Moderation Tools

  1. Changes to Existing Tables
    - Add `is_suspended` column to profiles table
    - Add `is_flagged` and `flagged_reason` columns to listings table
    - Add `user_agent` column to audit_logs table

  2. New Tables
    - `user_suspensions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `suspended_by` (uuid, references profiles.id)
      - `reason` (text)
      - `suspended_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)
      - `is_active` (boolean)

  3. Security
    - Enable RLS on user_suspensions table
    - Add policies for admins to manage suspensions
    - Update audit_logs policies for admin access
    - Update listings policies to prevent suspended users from posting

  4. Functions
    - Create function to automatically expire suspensions
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;
END $$;

-- Add columns to listings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'is_flagged'
  ) THEN
    ALTER TABLE listings ADD COLUMN is_flagged boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'flagged_reason'
  ) THEN
    ALTER TABLE listings ADD COLUMN flagged_reason text;
  END IF;
END $$;

-- Add user_agent column to audit_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent text;
  END IF;
END $$;

-- Create user_suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  suspended_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  suspended_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create index for active suspensions
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);

-- Enable RLS
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (add to existing)
DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;

CREATE POLICY "Admins can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for user_suspensions
CREATE POLICY "Admins can read all suspensions"
  ON user_suspensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create suspensions"
  ON user_suspensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update suspensions"
  ON user_suspensions FOR UPDATE
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

-- Update listings policies to prevent suspended users from creating listings
DROP POLICY IF EXISTS "Users can create own listings" ON listings;

CREATE POLICY "Non-suspended users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_suspended = true
    )
  );

-- Function to automatically expire suspensions
CREATE OR REPLACE FUNCTION expire_suspensions()
RETURNS void AS $$
BEGIN
  UPDATE user_suspensions
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
    
  UPDATE profiles
  SET is_suspended = false
  WHERE is_suspended = true
    AND NOT EXISTS (
      SELECT 1 FROM user_suspensions
      WHERE user_suspensions.user_id = profiles.id
      AND user_suspensions.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for flagged listings
CREATE INDEX IF NOT EXISTS idx_listings_flagged ON listings(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = true;
