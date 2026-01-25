import { Gem } from 'lucide-react';

interface SubscriptionBadgeProps {
  subscriptionStatus: string | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function SubscriptionBadge({ subscriptionStatus, size = 'md', showLabel = false }: SubscriptionBadgeProps) {
  if (subscriptionStatus !== 'active') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Gem className={`${sizeClasses[size]} text-amber-500 fill-amber-400`} />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
          Premium
        </span>
      )}
    </div>
  );
}
