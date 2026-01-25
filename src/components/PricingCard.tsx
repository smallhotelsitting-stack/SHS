import { Check, Gem } from 'lucide-react';
import type { SubscriptionPlan } from '../types/database';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onSubscribeClick: (plan: SubscriptionPlan) => void;
}

export default function PricingCard({ plan, isPopular = false, onSubscribeClick }: PricingCardProps) {
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <div
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
        isPopular
          ? 'ring-2 ring-primary-500 scale-105 shadow-2xl'
          : 'shadow-lg hover:shadow-xl'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center py-2 text-sm font-bold">
          Most Popular
        </div>
      )}

      <div className={`h-full ${isPopular ? 'bg-gradient-to-br from-primary-50 to-white pt-16' : 'bg-white'} p-8`}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-3xl font-bold text-neutral-900">{plan.name}</h3>
            {plan.slug === 'premium' && (
              <Gem className="w-6 h-6 text-amber-500 fill-amber-400" />
            )}
          </div>
          {plan.description && (
            <p className="text-neutral-600 text-sm">{plan.description}</p>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold text-neutral-900">${plan.price}</span>
            <span className="text-neutral-600">/year</span>
          </div>
        </div>

        <button
          onClick={() => onSubscribeClick(plan)}
          className={`w-full py-3 px-6 rounded-full font-semibold transition-all mb-8 ${
            isPopular
              ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:scale-105'
              : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
          }`}
        >
          Subscribe Now
        </button>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-700 mb-4">What's Included:</p>
          {features.map((feature: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
