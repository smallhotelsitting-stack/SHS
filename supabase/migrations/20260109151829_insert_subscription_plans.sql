/*
  # Insert Default Subscription Plans

  Inserts Classic and Premium subscription plans with their features.
*/

INSERT INTO subscription_plans (name, slug, description, price, currency, billing_period, features, is_active)
VALUES
  (
    'Classic',
    'classic',
    'Perfect for getting started with property sitting',
    99.00,
    'USD',
    'annual',
    '[
      "Unlimited listings",
      "Basic analytics",
      "Priority support",
      "Verified badge",
      "Message guests"
    ]'::jsonb,
    true
  ),
  (
    'Premium',
    'premium',
    'For serious property hosts and sitters',
    199.00,
    'USD',
    'annual',
    '[
      "Everything in Classic",
      "Advanced analytics",
      "Featured listings",
      "Premium diamond badge",
      "24/7 priority support",
      "Custom branding",
      "Booking insights"
    ]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;
