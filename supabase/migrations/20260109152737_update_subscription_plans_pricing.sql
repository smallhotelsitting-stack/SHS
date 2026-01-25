/*
  # Update Subscription Plans Pricing and Features

  Updates Classic and Premium subscription plans with new pricing and features.
*/

UPDATE subscription_plans 
SET 
  price = 25.00,
  features = '[
    "Create and view listings",
    "Reply to requests",
    "Basic profile visibility",
    "Email support"
  ]'::jsonb,
  updated_at = now()
WHERE slug = 'classic';

UPDATE subscription_plans 
SET 
  price = 89.00,
  features = '[
    "Create and view listings",
    "Reply to requests",
    "Featured listing",
    "Social media promotion",
    "Premium profile badge",
    "Priority email support",
    "Advanced analytics"
  ]'::jsonb,
  updated_at = now()
WHERE slug = 'premium';
