/*
  # Fix Admin Subscription Assignment RLS Policies

  1. Problem
    - Admins cannot INSERT or UPDATE user_subscriptions due to overly restrictive RLS policies
    - The existing "Admins can manage all subscriptions" policy uses ALL which is not appropriate for upsert operations

  2. Solution
    - Add explicit INSERT policy for admins
    - Add explicit UPDATE policy for admins
    - Keep DELETE policy for admins

  3. Security
    - Only authenticated admins can perform these operations
    - Non-admin users cannot access or modify subscriptions
*/

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON user_subscriptions;

CREATE POLICY "Admins can insert subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update subscriptions"
  ON user_subscriptions
  FOR UPDATE
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

CREATE POLICY "Admins can delete subscriptions"
  ON user_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
