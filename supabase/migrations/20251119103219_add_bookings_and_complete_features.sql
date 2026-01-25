/*
  # Complete Feature Set Migration
  
  1. New Tables
    - `bookings` - Track confirmed transactions between families and sitters
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `family_id` (uuid, references profiles)
      - `sitter_id` (uuid, references profiles)
      - `status` (text, enum: pending, confirmed, completed, cancelled)
      - `payment_status` (text, enum: pending, paid, refunded)
      - `payment_amount` (numeric, nullable)
      - `stripe_payment_intent_id` (text, nullable)
      - `start_date` (date)
      - `end_date` (date)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `confirmed_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `bookings` table
    - Policies for families to view their bookings
    - Policies for sitters to view their bookings
    - Admin can view all bookings
  
  3. Important Notes
    - Reviews can only be created after booking is completed
    - Contact details unlocked after booking confirmed
    - Subscription required to create bookings
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sitter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount numeric(10, 2),
  stripe_payment_intent_id text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Families can view their bookings
CREATE POLICY "Families can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = family_id);

-- Sitters can view their bookings
CREATE POLICY "Sitters can view assigned bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = sitter_id);

-- Families can create bookings
CREATE POLICY "Families can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = family_id);

-- Families and sitters can update their bookings
CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = family_id OR auth.uid() = sitter_id)
  WITH CHECK (auth.uid() = family_id OR auth.uid() = sitter_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add foreign key to reviews table for bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_booking_id_fkey'
  ) THEN
    ALTER TABLE reviews 
    ADD CONSTRAINT reviews_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_family_id ON bookings(family_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sitter_id ON bookings(sitter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create function to check if user can review
CREATE OR REPLACE FUNCTION can_user_review(
  p_reviewer_id uuid,
  p_listing_id uuid,
  p_reviewee_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if there's a completed booking between reviewer and reviewee for this listing
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE listing_id = p_listing_id
    AND status = 'completed'
    AND (
      (family_id = p_reviewer_id AND sitter_id = p_reviewee_id) OR
      (sitter_id = p_reviewer_id AND family_id = p_reviewee_id)
    )
  );
END;
$$;

-- Update reviews policies to require completed booking
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;

CREATE POLICY "Users can create reviews after completed booking"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND can_user_review(reviewer_id, listing_id, reviewee_id)
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();
