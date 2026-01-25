/*
  # Fix Security and Performance Issues - Final
  
  This migration fixes all security warnings by:
  1. Adding missing indexes on foreign keys
  2. Optimizing RLS policies with (select auth.uid())
  3. Fixing function search paths
  4. Consolidating duplicate permissive policies
*/

-- ============================================================================
-- PART 1: Add Missing Indexes on Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_processed_by 
  ON data_deletion_requests(processed_by);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id 
  ON reviews(booking_id);

CREATE INDEX IF NOT EXISTS idx_user_suspensions_suspended_by 
  ON user_suspensions(suspended_by);

CREATE INDEX IF NOT EXISTS idx_verification_documents_reviewed_by 
  ON verification_documents(reviewed_by);

-- ============================================================================
-- PART 2: Fix Function Search Paths (Drop triggers first, then recreate)
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_profile_created_subscription ON profiles;
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate functions with search_path
DROP FUNCTION IF EXISTS expire_suspensions() CASCADE;
CREATE FUNCTION expire_suspensions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_suspensions
  SET is_active = false
  WHERE is_active = true
  AND expires_at IS NOT NULL
  AND expires_at < now();
END;
$$;

DROP FUNCTION IF EXISTS initialize_subscription() CASCADE;
CREATE FUNCTION initialize_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS can_user_review(uuid, uuid, uuid) CASCADE;
CREATE FUNCTION can_user_review(
  p_reviewer_id uuid,
  p_listing_id uuid,
  p_reviewee_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
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

DROP FUNCTION IF EXISTS update_bookings_updated_at() CASCADE;
CREATE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS list_admin_users() CASCADE;
CREATE FUNCTION list_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  is_suspended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.name, p.created_at, p.is_suspended
  FROM profiles p
  WHERE p.role = 'admin'
  AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS promote_user_to_admin(text) CASCADE;
CREATE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email
  AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS demote_admin_to_guest(uuid) CASCADE;
CREATE FUNCTION demote_admin_to_guest(admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET role = 'guest'
  WHERE id = admin_id
  AND role = 'admin'
  AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found or already demoted';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'guest'
  );
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_subscription();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- PART 3: Optimize ALL RLS Policies
-- ============================================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Users and admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK ((select auth.uid()) = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- LISTINGS
DROP POLICY IF EXISTS "Authenticated users can create listings" ON listings;
DROP POLICY IF EXISTS "Non-suspended users can create listings" ON listings;
CREATE POLICY "Non-suspended users can create listings"
  ON listings FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = author_id AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_suspended = true));

DROP POLICY IF EXISTS "Authors can update own listings" ON listings;
DROP POLICY IF EXISTS "Admins can update any listing" ON listings;
CREATE POLICY "Authors and admins can update listings"
  ON listings FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Authors can delete own listings" ON listings;
DROP POLICY IF EXISTS "Admins can delete any listing" ON listings;
CREATE POLICY "Authors and admins can delete listings"
  ON listings FOR DELETE TO authenticated
  USING ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- MESSAGE_THREADS
DROP POLICY IF EXISTS "Users can view threads they participate in" ON message_threads;
DROP POLICY IF EXISTS "Admins can view all threads" ON message_threads;
CREATE POLICY "Users and admins can view threads"
  ON message_threads FOR SELECT TO authenticated
  USING ((select auth.uid()) = guest_id OR (select auth.uid()) = host_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Authenticated users can create threads" ON message_threads;
CREATE POLICY "Participants can create threads"
  ON message_threads FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = guest_id OR (select auth.uid()) = host_id);

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Users and admins can view messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = messages.thread_id AND ((select auth.uid()) = message_threads.guest_id OR (select auth.uid()) = message_threads.host_id)) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can send messages in their threads" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = messages.thread_id AND ((select auth.uid()) = message_threads.guest_id OR (select auth.uid()) = message_threads.host_id)));

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE TO authenticated
  USING ((select auth.uid()) = sender_id)
  WITH CHECK ((select auth.uid()) = sender_id);

-- BOOKINGS
DROP POLICY IF EXISTS "Families can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Sitters can view assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Participants and admins can view bookings"
  ON bookings FOR SELECT TO authenticated
  USING ((select auth.uid()) = family_id OR (select auth.uid()) = sitter_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Families can create bookings" ON bookings;
CREATE POLICY "Families can create bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = family_id);

DROP POLICY IF EXISTS "Participants can update bookings" ON bookings;
CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE TO authenticated
  USING ((select auth.uid()) = family_id OR (select auth.uid()) = sitter_id)
  WITH CHECK ((select auth.uid()) = family_id OR (select auth.uid()) = sitter_id);

-- VERIFICATION_DOCUMENTS
DROP POLICY IF EXISTS "Users can insert own verification documents" ON verification_documents;
CREATE POLICY "Users can insert own verification documents"
  ON verification_documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own verification documents" ON verification_documents;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON verification_documents;
CREATE POLICY "Users and admins can view verification documents"
  ON verification_documents FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update verification documents" ON verification_documents;
CREATE POLICY "Admins can update verification documents"
  ON verification_documents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- REVIEWS
DROP POLICY IF EXISTS "Users can create reviews after completed booking" ON reviews;
CREATE POLICY "Users can create reviews after completed booking"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = reviewer_id AND can_user_review(reviewer_id, listing_id, reviewee_id));

DROP POLICY IF EXISTS "Reviewees can respond to their reviews" ON reviews;
CREATE POLICY "Reviewees can respond to reviews"
  ON reviews FOR UPDATE TO authenticated
  USING ((select auth.uid()) = reviewee_id)
  WITH CHECK ((select auth.uid()) = reviewee_id);

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- USER_SUSPENSIONS
DROP POLICY IF EXISTS "Admins can read all suspensions" ON user_suspensions;
DROP POLICY IF EXISTS "Admins can create suspensions" ON user_suspensions;
DROP POLICY IF EXISTS "Admins can update suspensions" ON user_suspensions;
CREATE POLICY "Admins can manage suspensions"
  ON user_suspensions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- GDPR_CONSENTS
DROP POLICY IF EXISTS "Users can view own consents" ON gdpr_consents;
DROP POLICY IF EXISTS "Admins can view all consents" ON gdpr_consents;
CREATE POLICY "Users and admins can view consents"
  ON gdpr_consents FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can insert own consents" ON gdpr_consents;
CREATE POLICY "Anyone can insert consents"
  ON gdpr_consents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- DATA_DELETION_REQUESTS
DROP POLICY IF EXISTS "Users can view own deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON data_deletion_requests;
CREATE POLICY "Users and admins can view deletion requests"
  ON data_deletion_requests FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can create deletion requests" ON data_deletion_requests;
CREATE POLICY "Users can create deletion requests"
  ON data_deletion_requests FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can update deletion requests" ON data_deletion_requests;
CREATE POLICY "Admins can update deletion requests"
  ON data_deletion_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
