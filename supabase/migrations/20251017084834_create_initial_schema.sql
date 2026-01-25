/*
  # Create Initial Schema for House/Pet Sitting Marketplace

  ## Overview
  This migration sets up the complete database schema for a three-role marketplace
  where users can post sitting offers/requests, communicate through messages, and
  administrators can moderate the platform.

  ## New Tables

  ### 1. profiles
  Extends Supabase auth.users with additional profile information
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, user's email address)
  - `name` (text, display name)
  - `role` (text, one of: guest, host, admin)
  - `avatar_url` (text, profile picture URL)
  - `bio` (text, user biography)
  - `phone` (text, contact phone number)
  - `created_at` (timestamptz, account creation timestamp)
  - `updated_at` (timestamptz, last profile update)
  - `deleted_at` (timestamptz, soft-delete timestamp)

  ### 2. listings
  Property/sitting opportunities posted by users
  - `id` (uuid, primary key)
  - `title` (text, listing title)
  - `slug` (text, URL-friendly identifier)
  - `description` (text, detailed description)
  - `type` (text, 'offer' for sitters or 'request' for needing sitters)
  - `category` (text, 'house' or 'hotel')
  - `location` (text, location description)
  - `start_date` (date, availability start)
  - `end_date` (date, availability end)
  - `images` (jsonb, array of image URLs)
  - `author_id` (uuid, references profiles)
  - `status` (text, 'active', 'paused', or 'closed')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `deleted_at` (timestamptz, soft-delete)

  ### 3. message_threads
  Conversation containers between a guest and listing host
  - `id` (uuid, primary key)
  - `listing_id` (uuid, references listings)
  - `guest_id` (uuid, references profiles, the person initiating contact)
  - `host_id` (uuid, references profiles, the listing author)
  - `created_at` (timestamptz)

  ### 4. messages
  Individual messages within threads
  - `id` (uuid, primary key)
  - `thread_id` (uuid, references message_threads)
  - `sender_id` (uuid, references profiles)
  - `body` (text, message content)
  - `read_at` (timestamptz, when message was read)
  - `created_at` (timestamptz)

  ### 5. audit_logs
  Tracking system for administrative actions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, who performed the action)
  - `action` (text, action type like 'create', 'update', 'delete')
  - `entity` (text, entity type like 'user', 'listing', 'message')
  - `entity_id` (uuid, ID of affected entity)
  - `old_values` (jsonb, state before change)
  - `new_values` (jsonb, state after change)
  - `ip_address` (text, IP of request)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Profiles: Users can read all profiles, update own profile
  - Listings: Public read access, authenticated users can create, owners can update/delete
  - Message threads: Only participants can view their threads
  - Messages: Only thread participants can read/send messages
  - Audit logs: Only admins can read logs

  ## Important Notes
  1. Soft-delete support via `deleted_at` column on profiles and listings
  2. All timestamps use `timestamptz` for timezone awareness
  3. Foreign key constraints ensure data integrity
  4. Indexes on frequently queried columns for performance
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'host', 'admin')),
  avatar_url text,
  bio text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('offer', 'request')),
  category text NOT NULL CHECK (category IN ('house', 'hotel')),
  location text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create message_threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, guest_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

CREATE INDEX IF NOT EXISTS idx_listings_author ON listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_dates ON listings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_deleted_at ON listings(deleted_at);

CREATE INDEX IF NOT EXISTS idx_threads_listing ON message_threads(listing_id);
CREATE INDEX IF NOT EXISTS idx_threads_guest ON message_threads(guest_id);
CREATE INDEX IF NOT EXISTS idx_threads_host ON message_threads(host_id);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Listings RLS Policies
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authors can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Message Threads RLS Policies
CREATE POLICY "Users can view threads they participate in"
  ON message_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Authenticated users can create threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Admins can view all threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages RLS Policies
CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND (message_threads.guest_id = auth.uid() OR message_threads.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their threads"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = thread_id
      AND (message_threads.guest_id = auth.uid() OR message_threads.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit Logs RLS Policies
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();