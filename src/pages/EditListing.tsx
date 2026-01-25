import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Home, Hotel } from 'lucide-react';
import MediaManager from '../components/MediaManager';
import type { Listing, ListingType, ListingCategory } from '../types/database';

export default function EditListing() {
  const { t, language } = useLanguage();
  const { id, lang } = useParams<{ id: string; lang?: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const currentLang = lang || language;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listing, setListing] = useState<Listing | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'offer' as ListingType,
    category: 'house' as ListingCategory,
    location: '',
    startDate: '',
    endDate: ''
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching listing:', error);
      setError('Failed to load listing');
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Listing not found');
      setLoading(false);
      return;
    }

    if (data.author_id !== user?.id && profile?.role !== 'admin') {
      setError('You do not have permission to edit this listing');
      setLoading(false);
      return;
    }

    setListing(data);
    setFormData({
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      location: data.location,
      startDate: data.start_date,
      endDate: data.end_date
    });

    const listingImages = Array.isArray(data.images) ? (data.images as string[]) : [];
    const listingVideos = Array.isArray(data.videos) ? (data.videos as string[]) : [];
    setImages(listingImages);
    setVideos(listingVideos);
    setLoading(false);
  };

  const handleFileUpload = async (files: File[]): Promise<{ images: string[], videos: string[] }> => {
    if (!user) return { images: [], videos: [] };

    setUploading(true);
    const uploadedImages: string[] = [];
    const uploadedVideos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-media')
          .getPublicUrl(fileName);

        if (file.type.startsWith('image/')) {
          uploadedImages.push(publicUrl);
        } else if (file.type.startsWith('video/')) {
          uploadedVideos.push(publicUrl);
        }
      }
    } finally {
      setUploading(false);
    }

    return { images: uploadedImages, videos: uploadedVideos };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setError('');
    setSaving(true);

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        location: formData.location,
        start_date: formData.startDate,
        end_date: formData.endDate,
        images,
        videos
      })
      .eq('id', listing.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      navigate(`/${currentLang}/listings/${listing.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-warm-900 mb-2">{t('edit.title')}</h1>
        <p className="text-warm-600 mb-8">{t('edit.update')}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-3">
              {t('create.listingType')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'offer' })}
                className={`p-4 border-2 rounded-lg transition ${
                  formData.type === 'offer'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className={`font-semibold ${formData.type === 'offer' ? 'text-blue-900' : 'text-warm-900'}`}>
                  {t('create.offeringServices')}
                </p>
                <p className="text-sm text-warm-600 mt-1">{t('auth.beaSitter')}</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'request' })}
                className={`p-4 border-2 rounded-lg transition ${
                  formData.type === 'request'
                    ? 'border-secondary-600 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className={`font-semibold ${formData.type === 'request' ? 'text-green-900' : 'text-warm-900'}`}>
                  {t('create.requestingSitter')}
                </p>
                <p className="text-sm text-warm-600 mt-1">{t('auth.findSitter')}</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-3">
              {t('create.propertyType')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'house' })}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                  formData.category === 'house'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Home className={`w-6 h-6 ${formData.category === 'house' ? 'text-primary-600' : 'text-warm-600'}`} />
                <span className={`font-semibold ${formData.category === 'house' ? 'text-blue-900' : 'text-warm-900'}`}>
                  {t('home.house')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'hotel' })}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                  formData.category === 'hotel'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Hotel className={`w-6 h-6 ${formData.category === 'hotel' ? 'text-primary-600' : 'text-warm-600'}`} />
                <span className={`font-semibold ${formData.category === 'hotel' ? 'text-blue-900' : 'text-warm-900'}`}>
                  {t('home.hotel')}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-warm-700 mb-2">
              {t('listing.title')}
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-warm-700 mb-2">
              {t('listing.location')}
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-warm-700 mb-2">
                {t('create.startDate')}
              </label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-warm-700 mb-2">
                {t('create.endDate')}
              </label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-warm-700 mb-2">
              {t('listing.description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Media (Images & Videos)
            </label>
            <MediaManager
              images={images}
              videos={videos}
              onImagesChange={setImages}
              onVideosChange={setVideos}
              onFileUpload={handleFileUpload}
              maxImages={10}
              maxVideos={3}
              uploading={uploading}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? `${t('profile.saveChanges')}...` : t('profile.saveChanges')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/${currentLang}/listings/${listing?.id}`)}
              className="px-6 py-3 border border-gray-300 text-warm-700 rounded-lg font-semibold hover:bg-warm-50 transition"
            >
              {t('create.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
