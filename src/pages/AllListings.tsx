import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedContent } from '../utils/translations';
import { ListingListItem } from '../components/ListingListItem';
import { EmptyState } from '../components/EmptyState';
import type { Listing, Profile } from '../types/database';

type ListingWithAuthor = Listing & { author: Profile };

export default function AllListings() {
  const { t, language } = useLanguage();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || language;
  const [listings, setListings] = useState<ListingWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (!searchTerm) return true;
    const content = getTranslatedContent(
      { title: listing.title, description: listing.description, location: listing.location },
      listing.translations as any,
      currentLang as 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl'
    );
    return (
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            {t('allListings.title') || 'All Listings'}
          </h1>
          <p className="text-lg text-neutral-600">
            {t('allListings.subtitle') || 'Browse all available listings'}
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('home.searchPlaceholder') || 'Search listings...'}
            className="w-full px-6 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => {
              const content = getTranslatedContent(
                { title: listing.title, description: listing.description, location: listing.location },
                listing.translations as any,
                currentLang as 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl'
              );
              return (
                <ListingListItem
                  key={listing.id}
                  listing={listing}
                  currentLang={currentLang}
                  translatedContent={content}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
