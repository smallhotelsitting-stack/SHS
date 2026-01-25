import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PricingCard from './PricingCard';
import type { SubscriptionPlan } from '../types/database';

export default function PricingSection() {
  const { lang } = useParams<{ lang: string }>();
  const { language } = useLanguage();
  const currentLang = lang || language;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    if (!user) {
      navigate(`/${currentLang}/login?redirect=/checkout/${plan.slug}`);
      return;
    }
    navigate(`/${currentLang}/checkout/${plan.slug}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Plans & Pricing
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Choose the perfect plan to grow your property sitting business
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.slug === 'premium'}
              onSubscribeClick={handleSubscribeClick}
            />
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">Have Questions?</h3>
          <p className="text-neutral-600 mb-6">
            Our support team is here to help you choose the right plan for your needs.
          </p>
          <a
            href="mailto:contact@smallhotelsitting.com"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
