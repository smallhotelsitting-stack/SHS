import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Eye, Home, Hotel } from 'lucide-react';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import type { Listing, Profile } from '../types/database';

interface ListingListItemProps {
  listing: Listing & { author: Profile };
  currentLang: string;
  translatedContent: { title: string; location: string; description: string };
}

export function ListingListItem({
  listing,
  currentLang,
  translatedContent,
}: ListingListItemProps) {
  const [imageError, setImageError] = useState(false);
  const colors = getCategoryColor(listing.type, listing.category);
  const label = getCategoryLabel(listing.type, listing.category);
  const Icon = listing.category === 'hotel' ? Hotel : Home;
  const hasValidImage = listing.images && (listing.images as string[]).length > 0 && !imageError;

  return (
    <Link
      to={`/${currentLang}/listing/${listing.slug}`}
      className="flex gap-4 p-4 bg-white rounded-xl hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-all group"
    >
      <div className="flex-shrink-0 w-24 h-24 bg-neutral-200 rounded-lg overflow-hidden">
        {hasValidImage ? (
          <img
            src={(listing.images as string[])[0]}
            alt={translatedContent.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colors.gradient}`}>
            <Icon className={`w-8 h-8 ${colors.text} opacity-60`} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition line-clamp-1">
            {translatedContent.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${colors.bg} text-white whitespace-nowrap`}>
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{translatedContent.location}</span>
        </div>

        <p className="text-sm text-neutral-600 line-clamp-1 mb-2">
          {translatedContent.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(listing.start_date).toLocaleDateString()} -{' '}
              {new Date(listing.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center justify-center">
        <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition">
          <Eye className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
