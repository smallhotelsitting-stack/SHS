import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import { EmptyState } from '../components/EmptyState';
import SubscriptionBadge from '../components/SubscriptionBadge';
import type { Listing, Profile } from '../types/database';
import {
  Search,
  MapPin,
  Calendar,
  Hotel,
  SlidersHorizontal,
  X
} from 'lucide-react';

type ListingWithAuthor = Listing & { author: Profile };

export default function AllListings() {
  const { t, language } = useLanguage();
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentLang = lang || language;

  const [listings, setListings] = useState<ListingWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && allCategories.length > 0) {
      const cat = allCategories.find((c) => c.slug === categoryParam);
      if (cat) {
        setSelectedCategoryId(cat.id);
        if (cat.type === 'custom') {
          setSelectedCustomCategory(cat);
        }
      }
    }
  }, [searchParams, allCategories]);

  useEffect(() => {
    fetchListings();
    fetchAllCategories();
  }, [selectedCategoryId, sortBy]);

  const fetchAllCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      setAllCategories([]);
    } else {
      const builtIn = [
        { id: 'hotels', name: 'Hotels', slug: 'hotels', type: 'builtin', color: 'primary' },
        { id: 'houses', name: 'Houses', slug: 'houses', type: 'builtin', color: 'primary' },
        { id: 'hotel-sitters', name: 'Hotel Sitters', slug: 'hotel-sitters', type: 'builtin', color: 'primary' },
        { id: 'house-sitters', name: 'House Sitters', slug: 'house-sitters', type: 'builtin', color: 'primary' },
      ];
      const custom = (data || []).map((c: any) => ({ ...c, type: 'custom' }));
      setAllCategories([...builtIn, ...custom]);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, author:profiles(*)')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('created_at', { ascending: sortBy === 'newest' ? false : true });

    if (selectedCategoryId) {
      if (selectedCategoryId === 'hotels') {
        query = query.eq('type', 'offer').eq('category', 'hotel');
      } else if (selectedCategoryId === 'houses') {
        query = query.eq('type', 'offer').eq('category', 'house');
      } else if (selectedCategoryId === 'hotel-sitters') {
        query = query.eq('type', 'request').eq('category', 'hotel');
      } else if (selectedCategoryId === 'house-sitters') {
        query = query.eq('type', 'request').eq('category', 'house');
      } else {
        query = query.eq('custom_category_id', selectedCategoryId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } else {
      setListings(data as ListingWithAuthor[] || []);
    }
    setLoading(false);
  };

  const filteredListings = listings.filter((listing) => {
    // Client-side filtering for search, location, and dates
    const content = getTranslatedContent(
      { title: listing.title, description: listing.description, location: listing.location },
      listing.translations as any as ListingTranslations,
      currentLang as 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt'
    );

    const matchesSearch =
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !locationFilter || content.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesDateRange = (!startDate || new Date(listing.start_date) >= new Date(startDate)) &&
      (!endDate || new Date(listing.end_date) <= new Date(endDate));

    return matchesSearch && matchesLocation && matchesDateRange;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
              {t('allListings.title') || 'All Listings'}
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              {t('allListings.subtitle') || 'Browse all available listings worldwide'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-10 flex justify-center">
            <div className="bg-white rounded-full shadow-soft p-2 flex items-center max-w-3xl w-full border border-neutral-200 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
              <Search className="w-6 h-6 text-neutral-400 ml-4" />
              <input
                type="text"
                placeholder={t('home.searchPlaceholder') || 'Where would you like to go?'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent text-neutral-900 outline-none placeholder-neutral-500 text-lg"
              />
            </div>
          </div>

          {/* Categories and Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {allCategories.map((cat) => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => {
                    if (selectedCategoryId === cat.id) {
                      setSelectedCategoryId(null);
                      setSelectedCustomCategory(null);
                      // Clear from URL
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('category');
                      navigate(`/${currentLang}/all-listings?${newParams.toString()}`, { replace: true });
                    } else {
                      setSelectedCategoryId(cat.id);
                      if (cat.type === 'custom') {
                        setSelectedCustomCategory(cat);
                        // Add to URL
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('category', cat.slug);
                        navigate(`/${currentLang}/all-listings?${newParams.toString()}`, { replace: true });
                      } else {
                        setSelectedCustomCategory(null);
                        // Clear from URL (standard categories don't use query param in this impl, but could)
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('category');
                        navigate(`/${currentLang}/all-listings?${newParams.toString()}`, { replace: true });
                      }
                    }
                  }}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${selectedCategoryId === cat.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
                    }`}
                >
                  {cat.name}
                </button>
              </div>
            ))}

            <div className="relative ml-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('home.filtersButton') || 'Filters'}
                {(startDate || endDate || locationFilter) && (
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-soft-lg border border-neutral-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-neutral-900">{t('home.advancedFilters') || 'Filters'}</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        {t('home.filterLocation') || 'Location'}
                      </label>
                      <input
                        type="text"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        placeholder="Filter by location..."
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        {t('home.filterStartDate') || 'Start Date'}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        {t('home.filterEndDate') || 'End Date'}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        {t('home.sortBy') || 'Sort By'}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      >
                        <option value="newest">{t('home.sortNewest') || 'Newest'}</option>
                        <option value="oldest">{t('home.sortOldest') || 'Oldest'}</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setLocationFilter('');
                        setStartDate('');
                        setEndDate('');
                        setSortBy('newest');
                      }}
                      className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors font-medium"
                    >
                      {t('home.clearFilters') || 'Clear Filters'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            type={selectedCategoryId && selectedCategoryId.includes('sitter') ? 'request' : 'offer'}
            category={selectedCategoryId && selectedCategoryId.includes('hotel') ? 'hotel' : 'house'}
            customCategory={selectedCustomCategory}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredListings.map((listing) => {
              const content = getTranslatedContent(
                { title: listing.title, description: listing.description, location: listing.location },
                listing.translations as any as ListingTranslations,
                currentLang as 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt'
              );

              const colors = getCategoryColor(listing.type, listing.category);
              const label = getCategoryLabel(listing.type, listing.category);

              const isPremium = listing.author.subscription_status?.toLowerCase() === 'premium';

              return (
                <Link
                  key={listing.id}
                  to={`/${currentLang}/listing/${listing.slug}`}
                  className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border-2 flex flex-col h-full ${isPremium
                    ? 'border-blue-400/50 shadow-blue-100/50 scale-[1.01] ring-4 ring-blue-50/50'
                    : 'border-transparent hover:border-primary-100'
                    }`}
                >
                  <div className="relative h-56 bg-neutral-200 overflow-hidden shrink-0">
                    {listing.images && (listing.images as string[]).length > 0 ? (
                      <img
                        src={(listing.images as string[])[0]}
                        alt={content.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colors.gradient}`}>
                        <Hotel className={`w-12 h-12 ${colors.text} opacity-40`} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${colors.bg} text-white`}>
                        {label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition line-clamp-1">
                        {content.title}
                      </h3>
                      <SubscriptionBadge subscriptionStatus={listing.author.subscription_status} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 text-neutral-600 mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium line-clamp-1">{content.location}</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center gap-2 text-sm text-neutral-500">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">
                        {new Date(listing.start_date).toLocaleDateString()} - {new Date(listing.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
