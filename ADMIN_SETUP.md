# Admin User Setup Guide

This guide explains how to manage admin users in your house-sitting marketplace.

## Creating Your First Admin User

Since you need admin privileges to access the admin dashboard, you need to create your first admin user directly through the database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL command (replace with your user's email):

```sql
SELECT promote_user_to_admin('your-email@example.com');
```

4. You should see a success response with the user details
5. Log out and log back in to your application
6. You should now see the "Admin" option in the navigation menu

### Option 2: Using the Database GUI

1. Open your Supabase project
2. Go to **Table Editor**
3. Select the `profiles` table
4. Find your user by email
5. Edit the row and change the `role` field from `'guest'` to `'admin'`
6. Save the changes
7. Log out and log back in

## Managing Admin Users

Once you have admin access, you can manage other admins through the Admin Dashboard:

### Promoting Users to Admin

1. Log in with an admin account
2. Go to **Admin Dashboard** (from the navigation menu)
3. Click on the **Admin Users** tab
4. Click the **Promote User** button
5. Enter the email address of the user you want to promote
6. Click **Promote**

**Note:** The user must already have an account (they must have registered first).

### Viewing All Admin Users

The **Admin Users** tab shows:
- All users with admin privileges
- When they became admins
- Their suspension status (if applicable)

### Removing Admin Privileges

1. Go to the **Admin Users** tab
2. Find the admin user you want to demote
3. Click **Remove Admin**
4. Confirm the action

**Important:** You cannot remove the last admin user. The system will prevent this to ensure there's always at least one admin.

## Using SQL Functions

The system provides several SQL functions for admin management:

### List All Admins

```sql
SELECT * FROM list_admin_users();
```

### Promote User to Admin

```sql
SELECT promote_user_to_admin('user@example.com');
```

Returns:
- `success`: true/false
- `user_id`: The promoted user's ID
- `email`: User's email
- `name`: User's name
- `old_role`: Previous role
- `new_role`: 'admin'

### Demote Admin to Guest

```sql
SELECT demote_admin_to_guest('user-uuid-here');
```

Returns:
- `success`: true/false
- `error`: Error message if failed
- `user_id`: The demoted user's ID
- `email`: User's email
- `name`: User's name

## Security Notes

- All admin actions are logged in the audit log
- Admin functions use `SECURITY DEFINER` to bypass RLS
- You cannot remove the last admin user
- Suspended admins still appear in the admin list but cannot access the system
- All admin privilege changes are tracked with timestamps

## Troubleshooting

### "User not found" Error

Make sure:
1. The user has already registered an account
2. The email address is spelled correctly
3. The user hasn't been soft-deleted

### Cannot Access Admin Dashboard

1. Log out and log back in to refresh your session
2. Check that your role is set to 'admin' in the database
3. Clear your browser cache and cookies

### Cannot Promote User

Common reasons:
- User doesn't exist (they need to register first)
- User is already an admin
- Email address is incorrect
- Database permissions issue

## Best Practices

1. **Limit Admin Access**: Only promote trusted users who need administrative capabilities
2. **Regular Audits**: Periodically review the admin users list
3. **Use Audit Logs**: Check the audit log to track admin activities
4. **Backup Before Changes**: Always have a backup admin account before removing access
5. **Document Decisions**: Keep track of why users were granted admin privileges

## Initial Setup Checklist

- [ ] Create your first admin user using SQL
- [ ] Log in and verify admin dashboard access
- [ ] Test promoting another user to admin
- [ ] Review the audit log functionality
- [ ] Set up at least 2 admin accounts (for redundancy)
- [ ] Document which users have admin access and why
