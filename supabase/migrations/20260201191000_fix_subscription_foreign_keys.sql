-- Migration: Fix Subscription Foreign Keys
-- This migration fixes the foreign key violation when assigning subscriptions in the admin dashboard.
-- It redirects the foreign keys from the unused 'subscriptions' table to 'subscription_plans'.

-- 1. Fix user_subscriptions table
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_id_fkey;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_subscription_id_fkey 
FOREIGN KEY (subscription_id) REFERENCES public.subscription_plans(id);

-- 2. Fix profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES public.subscription_plans(id);

-- 3. Fix subscription_transactions table
ALTER TABLE public.subscription_transactions
DROP CONSTRAINT IF EXISTS subscription_transactions_subscription_id_fkey;

ALTER TABLE public.subscription_transactions
ADD CONSTRAINT subscription_transactions_subscription_id_fkey
FOREIGN KEY (subscription_id) REFERENCES public.subscription_plans(id);

-- 4. Sync existing user_subscriptions if any (optional but safe)
-- If there are any orphaned subscriptions, we might want to map them, 
-- but given the error, there are probably none or they are already failing.
