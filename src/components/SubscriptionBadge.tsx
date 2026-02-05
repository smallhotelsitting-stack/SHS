import { Gem } from 'lucide-react';

interface SubscriptionBadgeProps {
  subscriptionStatus: string | undefined;
  planName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function SubscriptionBadge({ subscriptionStatus, planName, size = 'md', showLabel = false }: SubscriptionBadgeProps) {
  if (!subscriptionStatus || subscriptionStatus === 'free') return null;

  const isPremium = subscriptionStatus.toLowerCase() === 'premium' || planName?.toLowerCase() === 'premium';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative group">
        <Gem
          className={`${sizeClasses[size]} ${isPremium ? 'text-blue-500 fill-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-amber-500 fill-amber-400'
            } transition-all duration-300 group-hover:scale-110`}
        />
        {isPremium && (
          <div className="absolute inset-0 bg-blue-400 blur-sm opacity-20 animate-pulse rounded-full" />
        )}
      </div>
      {showLabel && (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${isPremium
            ? 'text-blue-700 bg-blue-50 border-blue-200'
            : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
          {planName || (isPremium ? 'Premium' : 'Active')}
        </span>
      )}
    </div>
  );
}
