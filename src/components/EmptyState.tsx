import { useNavigate } from 'react-router-dom';
import { Home, Hotel, Coffee, PawPrint, Ghost, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { ListingType, ListingCategory } from '../types/database';

interface EmptyStateProps {
  type?: ListingType;
  category?: ListingCategory;
  searchTerm?: string;
  customCategory?: any;
}

export function EmptyState({ type = 'offer', category = 'house', searchTerm, customCategory }: EmptyStateProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getEmptyStateContent = () => {
    if (customCategory) {
      const quirkyMessages: { [key: string]: string } = {
        'vehicles': t('empty.vehicles.title'),
        'pets': t('empty.pets.title'),
        'boats': t('empty.boats.title'),
        'bicycles': t('empty.bicycles.title'),
      };

      const quirkyMsg = quirkyMessages[customCategory.slug] ||
        t('empty.generic.custom.title').replace('{category}', customCategory.name);

      return {
        icon: Ghost,
        title: quirkyMsg,
        message: t('empty.generic.custom.message').replace('{category}', customCategory.name),
        emoji: '✨',
      };
    }

    if (type === 'offer' && category === 'hotel') {
      return {
        icon: Hotel,
        title: t('empty.hotel.offer.title'),
        message: searchTerm
          ? t('empty.hotel.offer.message').replace('{searchTerm}', searchTerm)
          : t('empty.hotel.offer.message.nosearch'),
        emoji: '🏨',
      };
    }

    if (type === 'offer' && category === 'house') {
      return {
        icon: Home,
        title: t('empty.house.offer.title'),
        message: searchTerm
          ? t('empty.house.offer.message').replace('{searchTerm}', searchTerm)
          : t('empty.house.offer.message.nosearch'),
        emoji: '🏡',
      };
    }

    if (type === 'request' && category === 'hotel') {
      return {
        icon: Coffee,
        title: t('empty.hotel.request.title'),
        message: searchTerm
          ? t('empty.hotel.request.message').replace('{searchTerm}', searchTerm)
          : t('empty.hotel.request.message.nosearch'),
        emoji: '🛎️',
      };
    }

    if (type === 'request' && category === 'house') {
      return {
        icon: PawPrint,
        title: t('empty.house.request.title'),
        message: searchTerm
          ? t('empty.house.request.message').replace('{searchTerm}', searchTerm)
          : t('empty.house.request.message.nosearch'),
        emoji: '🏠',
      };
    }

    return {
      icon: Ghost,
      title: t('empty.generic.title'),
      message: searchTerm
        ? t('empty.generic.message').replace('{searchTerm}', searchTerm)
        : t('empty.generic.message.nosearch'),
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
        {t('empty.action')}
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
