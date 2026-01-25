import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Calendar, Hotel, Briefcase, ArrowRight, Star, Shield, Users, CheckCircle, Globe, Mail, Send, X, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import { EmptyState } from '../components/EmptyState';
import PricingSection from '../components/PricingSection';
import SubscriptionBadge from '../components/SubscriptionBadge';
import { CreateCategoryModal, AdminCategoryButton, CategoryPill } from '../components/AdminCategoryManager';
import { FormBuilder, type FormSchema } from '../components/FormBuilder';
import type { Listing, Profile } from '../types/database';

type ListingWithAuthor = Listing & { author: Profile };

export default function Home() {
  const { t, formatDate, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const currentLang = lang || language;
  const [listings, setListings] = useState<ListingWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [combinedFilter, setCombinedFilter] = useState<'all' | 'hotels' | 'houses' | 'hotel-sitters' | 'house-sitters'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedCategoryForForm, setSelectedCategoryForForm] = useState<any>(null);
  const [categoryToast, setCategoryToast] = useState('');
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<any>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const customCat = customCategories.find((c) => c.slug === categoryParam);
      if (customCat) {
        setSelectedCustomCategory(customCat);
      }
    }
  }, [searchParams, customCategories]);

  useEffect(() => {
    fetchListings();
    fetchCustomCategories();
  }, [combinedFilter, sortBy, selectedCustomCategory]);

  const fetchCustomCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching custom categories:', error);
    } else {
      setCustomCategories(data || []);
    }
  };

  const handleCreateCategory = async (categoryName: string) => {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { data, error } = await supabase
      .from('custom_categories')
      .insert({
        name: categoryName,
        slug,
        description: '',
        color: 'primary',
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setCustomCategories([...customCategories, data]);
    setSelectedCategoryForForm(data);
    setShowCreateCategoryModal(false);
    setCategoryToast(`Category "${categoryName}" created! Now add form fields.`);
    setTimeout(() => setShowFormBuilder(true), 300);
    setTimeout(() => setCategoryToast(''), 3000);
  };

  const handleSaveFormSchema = async (schema: FormSchema) => {
    if (!selectedCategoryForForm) return;

    const { error } = await supabase
      .from('form_schemas')
      .upsert({
        category_id: selectedCategoryForForm.id,
        fields: schema.fields,
        created_by: user?.id,
      })
      .select();

    if (error) {
      throw error;
    }

    setCategoryToast(`Form schema saved for "${schema.categoryName}"`);
    setShowFormBuilder(false);
    setSelectedCategoryForForm(null);
    setTimeout(() => setCategoryToast(''), 3000);
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, author:profiles(*)')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('created_at', { ascending: sortBy === 'newest' ? false : true });

    if (selectedCustomCategory) {
      query = query.eq('custom_category_id', selectedCustomCategory.id);
    } else if (combinedFilter === 'hotels') {
      query = query.eq('type', 'offer').eq('category', 'hotel');
    } else if (combinedFilter === 'houses') {
      query = query.eq('type', 'offer').eq('category', 'house');
    } else if (combinedFilter === 'hotel-sitters') {
      query = query.eq('type', 'request').eq('category', 'hotel');
    } else if (combinedFilter === 'house-sitters') {
      query = query.eq('type', 'request').eq('category', 'house');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data as ListingWithAuthor[]);
    }

    setLoading(false);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !locationFilter || listing.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesDateRange = (!startDate || new Date(listing.start_date) >= new Date(startDate)) &&
      (!endDate || new Date(listing.end_date) <= new Date(endDate));

    return matchesSearch && matchesLocation && matchesDateRange;
  });

  const handleRoleSelection = (role: 'owner' | 'sitter') => {
    setShowRoleModal(false);
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="space-y-0">
      <div className="relative bg-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-house-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 pt-4 pb-20 md:pt-6 md:pb-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-neutral-900">
                {t('hero.tagline')}
                <span className="block text-secondary-500">{t('hero.anywhere')}</span>
              </h1>

              <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed">
                {t('hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="inline-flex items-center justify-center gap-3 bg-secondary-500 text-white px-10 py-5 text-lg font-bold rounded-full hover:bg-secondary-600 transition-all group shadow-lg hover:shadow-secondary-500/30"
                >
                  {t('hero.cta')}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-3 bg-white text-neutral-700 px-10 py-5 text-lg font-bold rounded-full hover:bg-neutral-50 transition-all border-2 border-neutral-200 shadow-sm"
                >
                  {t('hero.browse')}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-house-500" />
                  <span className="text-neutral-700 font-medium">{t('hero.verifiedSitters')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-500" />
                  <span className="text-neutral-700 font-medium">{t('hero.worldwideNetwork')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary-500" />
                  <span className="text-neutral-700 font-medium">{t('hero.trustedSecure')}</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Hotel sitting lifestyle"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl max-w-xs border border-neutral-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold border-2 border-white">A</div>
                    <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white font-semibold border-2 border-white">M</div>
                    <div className="w-10 h-10 rounded-full bg-house-500 flex items-center justify-center text-white font-semibold border-2 border-white">S</div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{t('hero.members')}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-secondary-500 text-secondary-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="listings-section" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">{t('home.exploreOpportunities')}</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {t('home.exploreSubtitle')}
            </p>
          </div>

          <div className="mb-10 flex justify-center">
            <div className="bg-white rounded-full shadow-soft p-2 flex items-center max-w-3xl w-full border border-neutral-200">
              <Search className="w-6 h-6 text-neutral-400 ml-4" />
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-4 bg-transparent text-neutral-900 outline-none placeholder-neutral-500 text-base text-center md:text-left"
              />
            </div>
          </div>

          {categoryToast && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-40 animate-in fade-in slide-in-from-top">
              {categoryToast}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-12 items-center">
            <button
              onClick={() => setCombinedFilter('all')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                combinedFilter === 'all'
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
              }`}
            >
              {t('home.filterAll')}
            </button>
            <button
              onClick={() => setCombinedFilter('hotels')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                combinedFilter === 'hotels'
                  ? 'bg-hotel-500 text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
              }`}
            >
              {t('home.filterHotels')}
            </button>
            <button
              onClick={() => setCombinedFilter('houses')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                combinedFilter === 'houses'
                  ? 'bg-house-400 text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
              }`}
            >
              {t('home.filterHouses')}
            </button>
            <button
              onClick={() => setCombinedFilter('hotel-sitters')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                combinedFilter === 'hotel-sitters'
                  ? 'bg-hotelSitter-400 text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
              }`}
            >
              {t('home.filterHotelSitters')}
            </button>
            <button
              onClick={() => setCombinedFilter('house-sitters')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                combinedFilter === 'house-sitters'
                  ? 'bg-houseSitter-400 text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300'
              }`}
            >
              {t('home.filterHouseSitters')}
            </button>

            {customCategories.length > 0 && (
              <div className="flex gap-2 ml-2 pl-2 border-l border-neutral-300">
                {customCategories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    name={cat.name}
                    isSelected={selectedCustomCategory?.id === cat.id}
                    onClick={() => {
                      if (selectedCustomCategory?.id === cat.id) {
                        setSelectedCustomCategory(null);
                        navigate('/', { replace: true });
                      } else {
                        setSelectedCustomCategory(cat);
                        navigate(`/?category=${cat.slug}`, { replace: true });
                      }
                    }}
                    onEdit={() => {
                      setSelectedCategoryForForm(cat);
                      setShowFormBuilder(true);
                    }}
                    isAdmin={profile?.role === 'admin'}
                  />
                ))}
              </div>
            )}

            {profile?.role === 'admin' && (
              <AdminCategoryButton
                onOpenCreateModal={() => setShowCreateCategoryModal(true)}
                isAdmin={true}
              />
            )}

            <div className="ml-auto relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-300"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('home.filtersButton')}
                {(startDate || endDate || locationFilter) && (
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-soft-lg border border-neutral-200 p-6 z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-neutral-900">{t('home.advancedFilters')}</h3>
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
                        {t('home.filterLocation')}
                      </label>
                      <input
                        type="text"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        placeholder={t('home.filterLocationPlaceholder')}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        {t('home.filterStartDate')}
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
                        {t('home.filterEndDate')}
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
                        {t('home.sortBy')}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                      >
                        <option value="newest">{t('home.sortNewest')}</option>
                        <option value="oldest">{t('home.sortOldest')}</option>
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
                      {t('home.clearFilters')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredListings.length === 0 ? (
            <EmptyState
              type={combinedFilter.includes('sitter') ? 'request' : 'offer'}
              category={combinedFilter.includes('hotel') ? 'hotel' : 'house'}
              searchTerm={searchTerm}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.slice(0, 8).map((listing) => {
                const content = getTranslatedContent(
                  {
                    title: listing.title,
                    description: listing.description,
                    location: listing.location,
                  },
                  listing.translations as ListingTranslations,
                  language
                );

                const colors = getCategoryColor(listing.type, listing.category);
                const label = getCategoryLabel(listing.type, listing.category);

                return (
                  <Link
                    key={listing.id}
                    to={`/${currentLang}/listing/${listing.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300"
                  >
                    <div className="relative h-56 bg-neutral-200 overflow-hidden">
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

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition line-clamp-1">
                          {content.title}
                        </h3>
                        <SubscriptionBadge subscriptionStatus={listing.author.subscription_status} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 text-neutral-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{content.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-neutral-500 pt-3 border-t border-neutral-100">
                        <Calendar className="w-4 h-4" />
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

          {filteredListings.length > 8 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/listings')}
                className="inline-flex items-center gap-3 bg-primary-700 text-white px-10 py-4 rounded-full font-semibold hover:bg-primary-800 transition-all group shadow-md"
              >
                {t('home.viewAllListings')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      <PricingSection />

      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-primary-900 mb-6">
              <Mail className="w-8 h-8" />
              <h2 className="text-4xl md:text-5xl font-bold">{t('home.contactUs')}</h2>
            </div>
            <p className="text-lg text-neutral-600 mb-8">
              {t('home.haveQuestions')}
            </p>
            <a
              href="mailto:contact@smallhotelsitting.com"
              className="inline-flex items-center justify-center gap-3 bg-secondary-500 text-white px-10 py-4 text-lg font-bold rounded-full hover:bg-secondary-600 transition-all shadow-lg group"
            >
              {t('home.emailUs')}
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-neutral-600 mt-6 font-mono text-base">
              contact@smallhotelsitting.com
            </p>
          </div>
        </div>
      </div>

      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onSubmit={handleCreateCategory}
        existingCategories={customCategories.map((c) => c.name)}
      />

      <FormBuilder
        isOpen={showFormBuilder}
        onClose={() => {
          setShowFormBuilder(false);
          setSelectedCategoryForForm(null);
        }}
        categoryName={selectedCategoryForForm?.name || ''}
        onSubmit={handleSaveFormSchema}
      />

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900">{t('home.chooseYourRole')}</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-lg text-neutral-600 mb-8">
              {t('home.lookingForSitter')}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handleRoleSelection('owner')}
                className="group bg-gradient-to-br from-primary-50 to-cream-100 border-2 border-primary-200 hover:border-primary-500 rounded-2xl p-8 text-left transition-all hover:shadow-lg"
              >
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Hotel className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary-900 mb-2">{t('home.rolePropertyOwner')}</h3>
                <p className="text-neutral-700">
                  {t('home.rolePropertyOwnerDesc')}
                </p>
              </button>

              <button
                onClick={() => handleRoleSelection('sitter')}
                className="group bg-gradient-to-br from-secondary-50 to-cream-100 border-2 border-secondary-200 hover:border-secondary-500 rounded-2xl p-8 text-left transition-all hover:shadow-lg"
              >
                <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-primary-900 mb-2">{t('home.roleSitter')}</h3>
                <p className="text-neutral-700">
                  {t('home.roleSitterDesc')}
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
