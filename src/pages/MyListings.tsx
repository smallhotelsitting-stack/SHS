import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Calendar, Edit, Eye } from 'lucide-react';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import type { Listing } from '../types/database';

export default function MyListings() {
  const { t, formatDate, language } = useLanguage();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('author_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data);
    }

    setLoading(false);
  };

  const handleStatusChange = async (listingId: string, newStatus: 'active' | 'paused' | 'closed') => {
    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } else {
      fetchListings();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-warm-900">{t('nav.myListings')}</h1>
          <p className="text-warm-600 mt-1">{t('myListings.manage')}</p>
        </div>
        <Link
          to="/listings/new"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          {t('create.title')}
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-warm-600 text-lg mb-4">{t('myListings.noListings')}</p>
          <Link
            to="/listings/new"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            {t('myListings.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {(() => {
                    const translatedContent = getTranslatedContent(
                      { title: listing.title, description: listing.description, location: listing.location },
                      listing.translations as ListingTranslations | null,
                      language
                    );
                    const colors = getCategoryColor(listing.type, listing.category);
                    const label = getCategoryLabel(listing.type, listing.category);

                    return (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-warm-900">{translatedContent.title}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bgLight} ${colors.text}`}>
                      {label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      listing.status === 'active' ? 'bg-secondary-100 text-green-800' :
                      listing.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-warm-100 text-gray-800'
                    }`}>
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>

                        <p className="text-warm-600 mb-4 line-clamp-2">{translatedContent.description}</p>

                        <div className="flex gap-6 text-sm text-warm-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{translatedContent.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(listing.start_date)} - {formatDate(listing.end_date)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-warm-100 text-warm-700 rounded-lg hover:bg-warm-200 transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {t('myListings.view')}
                  </Link>
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    {t('listing.edit')}
                  </Link>

                  <select
                    value={listing.status}
                    onChange={(e) => handleStatusChange(listing.id, e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">{t('listing.active')}</option>
                    <option value="paused">{t('listing.paused')}</option>
                    <option value="closed">{t('listing.closed')}</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
