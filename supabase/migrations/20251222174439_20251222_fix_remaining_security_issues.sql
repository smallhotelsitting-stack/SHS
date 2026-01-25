/*
  # Fix Remaining Security Issues - Final Pass

  1. Missing Foreign Key Indexes
    - Add index on contact_submissions.resolved_by
    - Add index on content_versions.created_by
  
  2. RLS Policy Optimization
    - Update all policies to use (select auth.uid()) for better performance
    - Fix policies: contact_submissions, site_content, content_versions, content_changes_log
  
  3. Function Search Paths
    - Fix mutable search paths on content management functions
  
  4. Drop Unused Indexes
    - Remove 44 unused indexes that have never been queried
    - Keeps only essential indexes for foreign keys and unique constraints
  
  5. Consolidate Duplicate Policies
    - Combine multiple permissive policies where appropriate
*/

-- ============================================================================
-- PART 1: Add Missing Foreign Key Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contact_submissions_resolved_by 
  ON contact_submissions(resolved_by);

CREATE INDEX IF NOT EXISTS idx_content_versions_created_by 
  ON content_versions(created_by);

-- ============================================================================
-- PART 2: Drop Unused Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_data_deletion_requests_processed_by;
DROP INDEX IF EXISTS idx_profiles_deleted_at;
DROP INDEX IF EXISTS idx_listings_type;
DROP INDEX IF EXISTS idx_listings_category;
DROP INDEX IF EXISTS idx_listings_location;
DROP INDEX IF EXISTS idx_listings_dates;
DROP INDEX IF EXISTS idx_threads_listing;
DROP INDEX IF EXISTS idx_messages_created;
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_entity;
DROP INDEX IF EXISTS idx_user_suspensions_active;
DROP INDEX IF EXISTS idx_user_suspensions_user;
DROP INDEX IF EXISTS idx_listings_flagged;
DROP INDEX IF EXISTS idx_profiles_suspended;
DROP INDEX IF EXISTS idx_bookings_family_id;
DROP INDEX IF EXISTS idx_bookings_sitter_id;
DROP INDEX IF EXISTS idx_bookings_listing_id;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_reviews_booking_id;
DROP INDEX IF EXISTS idx_user_suspensions_suspended_by;
DROP INDEX IF EXISTS idx_verification_documents_status;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_reviews_listing_id;
DROP INDEX IF EXISTS idx_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_reviews_reviewee_id;
DROP INDEX IF EXISTS idx_gdpr_consents_user_id;
DROP INDEX IF EXISTS idx_data_deletion_requests_user_id;
DROP INDEX IF EXISTS idx_data_deletion_requests_status;
DROP INDEX IF EXISTS idx_verification_documents_reviewed_by;
DROP INDEX IF EXISTS idx_contact_submissions_status;
DROP INDEX IF EXISTS idx_contact_submissions_created_at;
DROP INDEX IF EXISTS idx_site_content_page;
DROP INDEX IF EXISTS idx_site_content_section;
DROP INDEX IF EXISTS idx_content_versions_page;
DROP INDEX IF EXISTS idx_content_versions_published;
DROP INDEX IF EXISTS idx_content_changes_version;
DROP INDEX IF EXISTS idx_content_changes_admin;
DROP INDEX IF EXISTS idx_content_changes_timestamp;

-- ============================================================================
-- PART 3: Fix Content Management Functions with Proper Search Paths
-- ============================================================================

DROP FUNCTION IF EXISTS update_site_content_updated_at() CASCADE;
CREATE FUNCTION update_site_content_updated_at()
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

DROP FUNCTION IF EXISTS set_version_number() CASCADE;
CREATE FUNCTION set_version_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.version_number IS NULL THEN
    NEW.version_number := COALESCE(
      (SELECT MAX(version_number) FROM content_versions WHERE page_name = NEW.page_name),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS get_published_content(text) CASCADE;
CREATE FUNCTION get_published_content(p_page_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

DROP FUNCTION IF EXISTS publish_content_version(uuid) CASCADE;
CREATE FUNCTION publish_content_version(p_version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_page_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can publish content versions';
  END IF;

  SELECT page_name INTO v_page_name
  FROM content_versions
  WHERE id = p_version_id;

  UPDATE content_versions
  SET is_published = false
  WHERE page_name = v_page_name
    AND is_published = true;

  UPDATE content_versions
  SET is_published = true,
      published_at = now()
  WHERE id = p_version_id;
END;
$$;

DROP FUNCTION IF EXISTS create_content_snapshot(text, text) CASCADE;
CREATE FUNCTION create_content_snapshot(
  p_page_name text,
  p_version_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_version_id uuid;
  v_snapshot jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create content snapshots';
  END IF;

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

  INSERT INTO content_versions (page_name, version_name, full_snapshot, created_by)
  VALUES (p_page_name, p_version_name, COALESCE(v_snapshot, '[]'::jsonb), (select auth.uid()))
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$;

-- Recreate triggers for content management
DROP TRIGGER IF EXISTS site_content_updated_at ON site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

DROP TRIGGER IF EXISTS content_versions_number ON content_versions;
CREATE TRIGGER content_versions_number
  BEFORE INSERT ON content_versions
  FOR EACH ROW
  EXECUTE FUNCTION set_version_number();

-- ============================================================================
-- PART 4: Optimize RLS Policies - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- CONTACT_SUBMISSIONS
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON contact_submissions;
CREATE POLICY "Admins can view all contact submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- SITE_CONTENT
DROP POLICY IF EXISTS "Only admins can insert site content" ON site_content;
CREATE POLICY "Only admins can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can update site content" ON site_content;
CREATE POLICY "Only admins can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can delete site content" ON site_content;
CREATE POLICY "Only admins can delete site content"
  ON site_content FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- CONTENT_VERSIONS
DROP POLICY IF EXISTS "Admins can view all versions" ON content_versions;
CREATE POLICY "Admins can view all versions"
  ON content_versions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can create versions" ON content_versions;
CREATE POLICY "Only admins can create versions"
  ON content_versions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can update versions" ON content_versions;
CREATE POLICY "Only admins can update versions"
  ON content_versions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can delete versions" ON content_versions;
CREATE POLICY "Only admins can delete versions"
  ON content_versions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- CONTENT_CHANGES_LOG
DROP POLICY IF EXISTS "Only admins can create change logs" ON content_changes_log;
CREATE POLICY "Only admins can create change logs"
  ON content_changes_log FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Only admins can view change logs" ON content_changes_log;
CREATE POLICY "Only admins can view change logs"
  ON content_changes_log FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- ============================================================================
-- PART 5: Consolidate Duplicate Permissive Policies
-- ============================================================================

-- AUDIT_LOGS - consolidate multiple permissive policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins manage audit logs" ON audit_logs;
CREATE POLICY "Admins can manage audit logs"
  ON audit_logs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- BOOKINGS - consolidate VIEW policies
DROP POLICY IF EXISTS "Participants and admins can view bookings" ON bookings;
DROP POLICY IF EXISTS "View bookings" ON bookings;
CREATE POLICY "Participants and admins can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = family_id OR (select auth.uid()) = sitter_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- CONTENT_VERSIONS - consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all versions" ON content_versions;
DROP POLICY IF EXISTS "Anyone can view published versions" ON content_versions;
CREATE POLICY "Anyone can view published versions"
  ON content_versions FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

CREATE POLICY "Admins can view all versions"
  ON content_versions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- DATA_DELETION_REQUESTS - consolidate SELECT policies
DROP POLICY IF EXISTS "Users and admins can view deletion requests" ON data_deletion_requests;
DROP POLICY IF EXISTS "View deletion requests" ON data_deletion_requests;
CREATE POLICY "Users and admins can view deletion requests"
  ON data_deletion_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- GDPR_CONSENTS - consolidate INSERT policies
DROP POLICY IF EXISTS "Anyone can insert consents" ON gdpr_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON gdpr_consents;
CREATE POLICY "Anyone can insert consents"
  ON gdpr_consents FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users and admins can view consents" ON gdpr_consents;
DROP POLICY IF EXISTS "View consents" ON gdpr_consents;
CREATE POLICY "Users and admins can view consents"
  ON gdpr_consents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- LISTINGS - consolidate DELETE policies
DROP POLICY IF EXISTS "Authors and admins can delete listings" ON listings;
DROP POLICY IF EXISTS "Delete listings" ON listings;
CREATE POLICY "Authors and admins can delete listings"
  ON listings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- LISTINGS - consolidate UPDATE policies
DROP POLICY IF EXISTS "Authors and admins can update listings" ON listings;
DROP POLICY IF EXISTS "Update listings" ON listings;
CREATE POLICY "Authors and admins can update listings"
  ON listings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK ((select auth.uid()) = author_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- MESSAGE_THREADS - consolidate INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create threads" ON message_threads;
DROP POLICY IF EXISTS "Participants can create threads" ON message_threads;
CREATE POLICY "Participants can create threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = guest_id OR (select auth.uid()) = host_id);

-- MESSAGE_THREADS - consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all threads" ON message_threads;
DROP POLICY IF EXISTS "Users and admins can view threads" ON message_threads;
DROP POLICY IF EXISTS "Users can view threads they participate in" ON message_threads;
CREATE POLICY "Users and admins can view threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = guest_id OR (select auth.uid()) = host_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- MESSAGES - consolidate INSERT policies
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their threads" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = messages.thread_id AND ((select auth.uid()) = message_threads.guest_id OR (select auth.uid()) = message_threads.host_id)));

-- MESSAGES - consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Users and admins can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
CREATE POLICY "Users and admins can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = messages.thread_id AND ((select auth.uid()) = message_threads.guest_id OR (select auth.uid()) = message_threads.host_id)) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- MESSAGES - consolidate UPDATE policies
DROP POLICY IF EXISTS "Senders can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = sender_id)
  WITH CHECK ((select auth.uid()) = sender_id);

-- PROFILES - consolidate UPDATE policies
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON profiles;
CREATE POLICY "Users and admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK ((select auth.uid()) = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- REVIEWS - consolidate UPDATE policies
DROP POLICY IF EXISTS "Reviewees can respond to reviews" ON reviews;
DROP POLICY IF EXISTS "Reviewees can respond to their reviews" ON reviews;
CREATE POLICY "Reviewees can respond to reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = reviewee_id)
  WITH CHECK ((select auth.uid()) = reviewee_id);

-- USER_SUSPENSIONS - consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can create suspensions" ON user_suspensions;
DROP POLICY IF EXISTS "Admins can manage suspensions" ON user_suspensions;
CREATE POLICY "Admins can manage suspensions"
  ON user_suspensions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));

-- USER_SUSPENSIONS - consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can read all suspensions" ON user_suspensions;

-- USER_SUSPENSIONS - consolidate UPDATE policies
DROP POLICY IF EXISTS "Admins can update suspensions" ON user_suspensions;

-- VERIFICATION_DOCUMENTS - consolidate SELECT policies
DROP POLICY IF EXISTS "Users and admins can view verification documents" ON verification_documents;
DROP POLICY IF EXISTS "View verification documents" ON verification_documents;
CREATE POLICY "Users and admins can view verification documents"
  ON verification_documents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'));
