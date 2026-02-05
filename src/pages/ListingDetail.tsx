import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Calendar, MessageSquare, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import MediaCarousel from '../components/MediaCarousel';
import SubscriptionBadge from '../components/SubscriptionBadge';
import type { Listing, Profile } from '../types/database';

type ListingWithAuthor = Listing & { author: Profile };

export default function ListingDetail() {
  const { t, formatDate, language } = useLanguage();
  const { id, slug, lang } = useParams<{ id?: string; slug?: string; lang?: string }>();
  const { user, profile, hasFeature } = useAuth();
  const navigate = useNavigate();
  const currentLang = lang || language;
  const [listing, setListing] = useState<ListingWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id, slug]);

  const fetchListing = async () => {
    if (!id && !slug) return;

    let query = supabase
      .from('listings')
      .select('*, author:profiles(*)')
      .is('deleted_at', null);

    if (slug) {
      query = query.eq('slug', slug);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching listing:', error);
    } else {
      setListing(data as ListingWithAuthor);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!listing || !window.confirm('Are you sure you want to delete this listing?')) return;

    setDeleting(true);

    const { error } = await (supabase
      .from('listings') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', listing.id);

    if (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
      setDeleting(false);
    } else {
      navigate(`/${currentLang}/my-listings`);
    }
  };

  const handleContact = async () => {
    if (!listing) return;

    if (!user) {
      navigate(`/${currentLang}/login`);
      return;
    }

    const { data: existingThread } = await (supabase
      .from('message_threads') as any)
      .select('id')
      .eq('listing_id', listing.id)
      .eq('guest_id', user.id)
      .maybeSingle();

    if (existingThread) {
      navigate(`/${currentLang}/inbox/${existingThread.id}`);
    } else {
      const { data: newThread, error } = await (supabase
        .from('message_threads') as any)
        .insert({
          listing_id: listing.id,
          guest_id: user.id,
          host_id: listing.author_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating thread:', error);
        alert('Failed to start conversation');
      } else {
        navigate(`/${currentLang}/inbox/${newThread.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-neutral-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-white shadow-xl p-12 text-center">
        <p className="text-neutral-600 text-lg">Listing not found</p>
        <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block">
          Back to listings
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.author_id;
  const isAdmin = profile?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const translatedContent = getTranslatedContent(
    { title: listing.title, description: listing.description, location: listing.location },
    listing.translations as any as ListingTranslations | null,
    language
  );

  const listingImages = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const listingVideos = Array.isArray(listing.videos) ? (listing.videos as string[]) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link
        to={`/${currentLang}`}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </Link>

      <div className="bg-white shadow-2xl overflow-hidden rounded-2xl border border-neutral-100">
        <div className="h-[500px] bg-neutral-900 relative">
          <MediaCarousel
            images={listingImages}
            videos={listingVideos}
            category={listing.category}
            altText={listing.title}
          />
          <div className="absolute top-0 left-0">
            <span className={`px-6 py-3 text-sm font-medium tracking-wider uppercase ${getCategoryColor(listing.type, listing.category).bg} text-white`}>
              {getCategoryLabel(listing.type, listing.category)}
            </span>
          </div>
        </div>

        <div className="p-12">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-5xl font-light text-neutral-900 mb-4">{translatedContent.title}</h1>
              <div className="flex items-center gap-6 text-neutral-600">
                <span>
                  {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                </span>
                <span className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                  listing.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-neutral-100 text-neutral-800'
                  }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-3">
                <Link
                  to={`/${currentLang}/listings/${listing.id}/edit`}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 transition font-medium"
                >
                  <Edit className="w-4 h-4" />
                  {t('listing.edit')}
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? `${t('listing.delete')}...` : t('listing.delete')}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex items-start gap-4 text-neutral-700">
              <div className="bg-primary-600 p-3">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{t('listing.location')}</p>
                <p className="font-medium text-lg">{translatedContent.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-neutral-700">
              <div className="bg-secondary-600 p-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{t('listing.dates')}</p>
                <p className="font-medium text-lg">
                  {formatDate(listing.start_date)} - {formatDate(listing.end_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-light text-neutral-900 mb-6"><span className="font-bold">{t('listing.description')}</span></h2>
            <p className="text-neutral-700 text-lg leading-relaxed whitespace-pre-wrap">{translatedContent.description}</p>
          </div>

          <div className="border-t border-neutral-200 pt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-neutral-900 flex items-center justify-center text-white text-2xl font-medium">
                  {listing.author.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{t('home.postedBy')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-light text-neutral-900">{listing.author.name}</p>
                    <SubscriptionBadge subscriptionStatus={listing.author.subscription_status} size="md" />
                  </div>
                  {listing.author.bio && (
                    <p className="text-sm text-neutral-600 mt-2">{listing.author.bio}</p>
                  )}
                </div>
              </div>

              {!isOwner && (
                hasFeature('can_reply_messages') ? (
                  <button
                    onClick={handleContact}
                    className="flex items-center gap-3 px-8 py-4 bg-secondary-500 text-white hover:bg-secondary-600 transition font-medium rounded-full"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {user ? t('listing.contact') : 'Sign In to Contact'}
                  </button>
                ) : (
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-white hover:bg-amber-600 transition font-medium rounded-full"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Upgrade to Contact
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
