import { useNavigate } from 'react-router-dom';
import { Home, Hotel, Coffee, PawPrint, Ghost, ArrowRight } from 'lucide-react';
import type { ListingType, ListingCategory } from '../types/database';

interface EmptyStateProps {
  type?: ListingType;
  category?: ListingCategory;
  searchTerm?: string;
}

export function EmptyState({ type = 'offer', category = 'house', searchTerm }: EmptyStateProps) {
  const navigate = useNavigate();

  const getEmptyStateContent = () => {
    const searchMsg = searchTerm ? ` matching "${searchTerm}"` : '';

    if (type === 'offer' && category === 'hotel') {
      return {
        icon: Hotel,
        title: 'The hotels are all sleeping... 😴',
        message: `No hotel listings${searchMsg} here yet!`,
        emoji: '🏨',
      };
    }

    if (type === 'offer' && category === 'house') {
      return {
        icon: Home,
        title: "Nobody's home! 🏠",
        message: `Be the first to house sit${searchMsg}!`,
        emoji: '🏡',
      };
    }

    if (type === 'request' && category === 'hotel') {
      return {
        icon: Coffee,
        title: 'The hotels are all sleeping... 😴',
        message: `No hotel sitting requests${searchMsg} here yet!`,
        emoji: '🛎️',
      };
    }

    if (type === 'request' && category === 'house') {
      return {
        icon: PawPrint,
        title: 'Quiet... too quiet. 🐾',
        message: `No house sitting requests${searchMsg} right now!`,
        emoji: '🏠',
      };
    }

    return {
      icon: Ghost,
      title: "It's a ghost town in here! 👻",
      message: `No listings${searchMsg} found!`,
      emoji: '👻',
    };
  };

  const content = getEmptyStateContent();
  const Icon = content.icon;

  return (
    <div className="text-center py-20 bg-gradient-to-b from-neutral-50 to-white rounded-3xl border border-neutral-100">
      <div className="text-6xl mb-6">{content.emoji}</div>
      <Icon className="w-16 h-16 text-neutral-300 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-neutral-900 mb-2">{content.title}</h3>
      <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">{content.message}</p>

      <button
        onClick={() => navigate('/create-listing')}
        className="inline-flex items-center gap-3 bg-secondary-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-secondary-600 transition-all shadow-md group"
      >
        Be the First to Post a Listing
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
