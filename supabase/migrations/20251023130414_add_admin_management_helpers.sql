/*
  # Add Admin Management Helper Functions

  1. New Functions
    - `promote_user_to_admin(user_email)` - Promotes a user to admin role by email
    - `list_admin_users()` - Returns all users with admin role
    - `demote_admin_to_guest(user_id)` - Demotes an admin back to guest role

  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
    - Can be called by authenticated users or directly via SQL
    - Audit logging integrated

  3. Notes
    - Use these functions to bootstrap your first admin
    - After first admin is created, use the dashboard UI
*/

-- Function to promote a user to admin by email
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS jsonb AS $$
DECLARE
  target_user profiles;
  result jsonb;
BEGIN
  -- Find the user by email
  SELECT * INTO target_user
  FROM profiles
  WHERE email = user_email
    AND deleted_at IS NULL;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Check if already admin
  IF target_user.role = 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already an admin'
    );
  END IF;

  -- Update user role to admin
  UPDATE profiles
  SET role = 'admin',
      updated_at = now()
  WHERE id = target_user.id;

  -- Log the action
  INSERT INTO audit_logs (user_id, action, entity, entity_id, old_values, new_values)
  VALUES (
    target_user.id,
    'PROMOTE_TO_ADMIN',
    'profile',
    target_user.id,
    jsonb_build_object('role', target_user.role),
    jsonb_build_object('role', 'admin')
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user.id,
    'email', target_user.email,
    'name', target_user.name,
    'old_role', target_user.role,
    'new_role', 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all admin users
CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  created_at timestamptz,
  is_suspended boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.name,
    p.created_at,
    COALESCE(p.is_suspended, false) as is_suspended
  FROM profiles p
  WHERE p.role = 'admin'
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin to guest
CREATE OR REPLACE FUNCTION demote_admin_to_guest(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  target_user profiles;
  admin_count integer;
BEGIN
  -- Find the user
  SELECT * INTO target_user
  FROM profiles
  WHERE id = user_id_param
    AND deleted_at IS NULL;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if user is admin
  IF target_user.role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not an admin'
    );
  END IF;

  -- Count remaining admins
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE role = 'admin'
    AND deleted_at IS NULL
    AND id != user_id_param;

  -- Prevent removing last admin
  IF admin_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot demote the last admin user'
    );
  END IF;

  -- Update user role to guest
  UPDATE profiles
  SET role = 'guest',
      updated_at = now()
  WHERE id = user_id_param;

  -- Log the action
  INSERT INTO audit_logs (user_id, action, entity, entity_id, old_values, new_values)
  VALUES (
    user_id_param,
    'DEMOTE_FROM_ADMIN',
    'profile',
    user_id_param,
    jsonb_build_object('role', 'admin'),
    jsonb_build_object('role', 'guest')
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user.id,
    'email', target_user.email,
    'name', target_user.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION promote_user_to_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION demote_admin_to_guest(uuid) TO authenticated;
