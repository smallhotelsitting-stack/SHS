/*
  # Fix Subscription Features Structure
  
  1. Changes
    - Updates subscription_plans.features from text array to structured object
    - Classic plan: Enables messaging and basic features
    - Premium plan: Enables all features including highlights and social promotion
  
  2. Features Object Structure
    - max_listings: number (0 = unlimited)
    - can_view_listings: boolean
    - can_reply_messages: boolean
    - can_highlight_listing: boolean
    - can_social_promotion: boolean
    - has_media_upload: boolean
*/

-- Update Classic plan features
UPDATE subscription_plans
SET features = jsonb_build_object(
  'max_listings', 0,
  'can_view_listings', true,
  'can_reply_messages', true,
  'can_highlight_listing', false,
  'can_social_promotion', false,
  'has_media_upload', true
)
WHERE slug = 'classic';

-- Update Premium plan features
UPDATE subscription_plans
SET features = jsonb_build_object(
  'max_listings', 0,
  'can_view_listings', true,
  'can_reply_messages', true,
  'can_highlight_listing', true,
  'can_social_promotion', true,
  'has_media_upload', true
)
WHERE slug = 'premium';
