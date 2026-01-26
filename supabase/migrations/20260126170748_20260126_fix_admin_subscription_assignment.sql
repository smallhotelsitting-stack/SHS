/*
  # Fix Admin Subscription Assignment Permissions
  
  1. Security Updates
    - Add explicit RLS policies allowing admins to manage user subscriptions
    - Admins can now INSERT, UPDATE, and DELETE subscriptions for any user
  2. Important Notes
    - This fixes the "Failed to update subscription" error in Admin Dashboard
    - Admin role check uses auth.jwt() to verify admin status
*/

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;

CREATE POLICY "Admins can manage subscriptions - select"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage subscriptions - insert"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage subscriptions - update"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage subscriptions - delete"
  ON user_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );
