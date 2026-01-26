import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader, AlertCircle, Check } from 'lucide-react';
import type { SubscriptionPlan } from '../types/database';

export default function Checkout() {
  const { lang, planSlug } = useParams<{ lang: string; planSlug: string }>();
  const { language } = useLanguage();
  const currentLang = lang || language;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingEmail: ''
  });

  useEffect(() => {
    if (!user) {
      navigate(`/${currentLang}/login?redirect=/checkout/${planSlug}`);
      return;
    }

    fetchPlan();
  }, [planSlug]);

  const fetchPlan = async () => {
    if (!planSlug) return;

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', planSlug)
      .single();

    if (error || !data) {
      setError('Subscription plan not found');
      setLoading(false);
      return;
    }

    setPlan(data);
    setFormData(prev => ({ ...prev, billingEmail: user?.email || '' }));
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
    } else if (name === 'cardExpiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    } else if (name === 'cardCvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    const isCardComplete =
      formData.cardName.trim().length > 0 &&
      formData.cardNumber.replace(/\s/g, '').length === 16 &&
      formData.cardExpiry.length === 5 &&
      formData.cardCvc.length === 3 &&
      formData.billingEmail.includes('@');

    setCardComplete(isCardComplete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      if (!user || !plan) {
        setError('User or plan information missing');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            planId: plan.id,
            planName: plan.name,
            amount: plan.price,
            email: formData.billingEmail,
            cardToken: {
              cardName: formData.cardName,
              cardNumber: formData.cardNumber.replace(/\s/g, ''),
              cardExpiry: formData.cardExpiry,
              cardCvc: formData.cardCvc,
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Payment processing failed');
        return;
      }

      navigate(`/${currentLang}/checkout/success`, { state: { planName: plan.name } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-900 font-semibold mb-2">Plan not found</p>
          <button
            onClick={() => navigate(`/${currentLang}`)}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(`/${currentLang}`)}
          className="text-primary-600 hover:text-primary-700 mb-8 flex items-center gap-2"
        >
          ← Back to plans
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-primary-100">Secure payment powered by Stripe</p>
          </div>

          <div className="p-8">
            <div className="mb-8 p-6 bg-neutral-50 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">{plan.name} Plan</h3>
                  <p className="text-neutral-600 text-sm">{plan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">${plan.price}</p>
                  <p className="text-neutral-600 text-sm">/year</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Billing Email
                </label>
                <input
                  type="email"
                  name="billingEmail"
                  value={formData.billingEmail}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || !cardComplete}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  processing || !cardComplete
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:shadow-lg'
                }`}
              >
                {processing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Pay ${plan.price} Now
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-500 text-center">
                Your payment information is encrypted and secure
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
