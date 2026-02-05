import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Upload, X, Image, Video, AlertCircle } from 'lucide-react';
import { translateToAllLanguages } from '../utils/translations';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { CategoryCarousel } from '../components/CategoryCarousel';
import type { ListingType, ListingCategory } from '../types/database';
import type { FormField } from '../components/FormBuilder';

export default function CreateListing() {
  const { t } = useLanguage();
  const { user, profile, features } = useAuth();
  const navigate = useNavigate();
  const [listingCount, setListingCount] = useState(0);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'offer' as ListingType,
    category: 'house' as ListingCategory,
    location: '',
    startDate: '',
    endDate: '',
    hotelName: '',
    bedtime: '',
    allergies: '',
    specialInstructions: '',
    emergencyContact: ''
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [selectedCustomCategoryId, setSelectedCustomCategoryId] = useState<string | null>(null);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchCustomCategories();
    fetchListingCount();
  }, [user]);

  const fetchListingCount = async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching listing count:', error);
    } else {
      setListingCount(count || 0);
    }
    setIsCheckingLimit(false);
  };

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

  useEffect(() => {
    if (!selectedCustomCategoryId) {
      setFormSchema([]);
      setCustomFormData({});
      return;
    }

    const fetchFormSchema = async () => {
      const { data, error } = await supabase
        .from('form_schemas' as any)
        .select('fields')
        .eq('category_id', selectedCustomCategoryId)
        .single();

      if (error) {
        console.error('Error fetching form schema:', error);
        setFormSchema([]);
      } else {
        setFormSchema((data as any)?.fields || []);
        setCustomFormData({});
      }
    };

    fetchFormSchema();
  }, [selectedCustomCategoryId]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const currentImageCount = mediaFiles.filter(f => f.type.startsWith('image/')).length;
    const currentVideoCount = mediaFiles.filter(f => f.type.startsWith('video/')).length;

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 52428800;

      if (isImage && currentImageCount >= 10) return false;
      if (isVideo && currentVideoCount >= 3) return false;

      return (isImage || isVideo) && isValidSize;
    });

    setMediaFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      const imageCount = newFiles.filter(f => f.type.startsWith('image/')).length;
      const videoCount = newFiles.filter(f => f.type.startsWith('video/')).length;

      return newFiles.filter(f => {
        if (f.type.startsWith('image/')) return imageCount <= 10;
        if (f.type.startsWith('video/')) return videoCount <= 3;
        return false;
      }).slice(0, 13);
    });
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (): Promise<{ images: string[], videos: string[] }> => {
    if (mediaFiles.length === 0) return { images: [], videos: [] };
    if (!user) return { images: [], videos: [] };

    const images: string[] = [];
    const videos: string[] = [];

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

      const { error } = await supabase.storage
        .from('listing-media')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listing-media')
        .getPublicUrl(fileName);

      if (file.type.startsWith('image/')) {
        images.push(publicUrl);
      } else if (file.type.startsWith('video/')) {
        videos.push(publicUrl);
      }

      setUploadProgress(((i + 1) / mediaFiles.length) * 100);
    }

    return { images, videos };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const { images, videos } = await uploadMediaFiles();
      const translations = await translateToAllLanguages({
        title: formData.title,
        description: formData.description,
        location: formData.location,
      });

      const nightProtocol = {
        hotelName: formData.hotelName || null,
        bedtime: formData.bedtime || null,
        allergies: formData.allergies || null,
        specialInstructions: formData.specialInstructions || null,
        emergencyContact: formData.emergencyContact || null
      };

      const listingInsert: any = {
        title: formData.title,
        slug: generateSlug(formData.title),
        description: formData.description,
        type: formData.type,
        category: formData.category,
        location: formData.location,
        hotel_name: formData.hotelName || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        images,
        videos,
        translations,
        night_protocol: nightProtocol,
        author_id: user.id,
        status: 'active',
        custom_category_id: selectedCustomCategoryId || null,
      };

      const { data, error: insertError } = await (supabase
        .from('listings') as any)
        .insert(listingInsert)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      if (selectedCustomCategoryId && Object.keys(customFormData).length > 0) {
        const { data: formDataRecord, error: formDataError } = await (supabase
          .from('listing_form_data' as any) as any)
          .insert({
            listing_id: data.id,
            category_id: selectedCustomCategoryId,
            form_data: customFormData,
          })
          .select()
          .single();

        if (formDataError) {
          console.error('Error saving form data:', formDataError);
        } else {
          await (supabase
            .from('listings') as any)
            .update({ form_data_id: formDataRecord.id })
            .eq('id', data.id);
        }
      }

      navigate(`/listings/${data.id}`);
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white shadow-2xl p-12">
        <h1 className="text-4xl font-light text-neutral-900 mb-2"><span className="font-bold">{t('create.title')}</span></h1>
        <p className="text-neutral-600 mb-10">{t('create.share')}</p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-700 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!isCheckingLimit && listingCount >= features.max_listings && profile?.role !== 'admin' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Listing Limit Reached</h3>
                <p className="text-amber-800 text-sm mb-4">
                  Your current plan allows for up to {features.max_listings} active {features.max_listings === 1 ? 'listing' : 'listings'}.
                  You've already reached this limit.
                </p>
                <button
                  onClick={() => navigate(`/${profile?.role === 'admin' ? 'en' : 'profile'}`)} // Link to pricing/profile
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-4 uppercase tracking-wider">
              {t('create.listingType')}
            </label>
            <div className="grid grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'offer' })}
                className={`p-6 border-2 transition ${formData.type === 'offer'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
                  }`}
              >
                <p className={`font-medium text-lg mb-2 ${formData.type === 'offer' ? 'text-primary-900' : 'text-neutral-900'}`}>
                  {t('create.offeringServices')}
                </p>
                <p className="text-sm text-neutral-600">{t('auth.beaSitter')}</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'request' })}
                className={`p-6 border-2 transition ${formData.type === 'request'
                  ? 'border-secondary-600 bg-secondary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
                  }`}
              >
                <p className={`font-medium text-lg mb-2 ${formData.type === 'request' ? 'text-secondary-900' : 'text-neutral-900'}`}>
                  {t('create.requestingSitter')}
                </p>
                <p className="text-sm text-neutral-600">{t('auth.findSitter')}</p>
              </button>
            </div>
          </div>

          <CategoryCarousel
            value={selectedCustomCategoryId || formData.category}
            onChange={(category) => {
              setFormData({ ...formData, category: category as ListingCategory });
            }}
            customCategories={customCategories}
            onCustomCategoryChange={(categoryId) => {
              setSelectedCustomCategoryId(categoryId);
              if (!categoryId) {
                setFormData({ ...formData, category: 'house' as ListingCategory });
              }
            }}
          />

          <div>
            <label htmlFor="title" className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
              {t('listing.title')}
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-0 py-3 border-b-2 border-neutral-200 focus:border-primary-600 outline-none transition text-lg bg-transparent"
              placeholder="e.g., Experienced pet sitter available in Miami"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
              {t('listing.location')}
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="w-full px-0 py-3 border-b-2 border-neutral-200 focus:border-primary-600 outline-none transition text-lg bg-transparent"
              placeholder="e.g., Miami, Florida"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
                {t('create.startDate')}
              </label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-0 py-3 border-b-2 border-neutral-200 focus:border-primary-600 outline-none transition text-lg bg-transparent"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
                {t('create.endDate')}
              </label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
                className="w-full px-0 py-3 border-b-2 border-neutral-200 focus:border-primary-600 outline-none transition text-lg bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
              {t('listing.description')}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              className="w-full px-0 py-3 border-b-2 border-neutral-200 focus:border-primary-600 outline-none transition text-lg bg-transparent resize-none"
              placeholder="Provide details about your listing..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">
              Photos & Videos (Max 10 images, 3 videos)
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-neutral-400 mb-3" />
                <span className="text-sm font-medium text-neutral-700 mb-1">Click to upload images or videos</span>
                <span className="text-xs text-neutral-500">Supports JPEG, PNG, WebP, MP4, WebM (Max 50MB)</span>
              </label>
            </div>

            {mediaFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <>
                          <Image className="w-8 h-8 text-neutral-400" />
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </>
                      ) : (
                        <Video className="w-8 h-8 text-neutral-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-neutral-600 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-neutral-600 mb-1">
                  <span>Uploading media...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {selectedCustomCategoryId && (
            <div className="border-t border-primary-200 pt-6 mt-6">
              <p className="text-sm text-primary-600 font-medium mb-3">
                📝 Custom category fields below
              </p>
            </div>
          )}

          {formSchema.length > 0 && (
            <div className="border-t border-primary-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-primary-900 mb-4">
                {customCategories.find((c) => c.id === selectedCustomCategoryId)?.name} Details
              </h3>
              <DynamicFormRenderer
                fields={formSchema}
                onSubmit={async (formData) => {
                  setCustomFormData(formData);
                }}
                submitButtonText="Validate"
                isLoading={false}
              />
            </div>
          )}

          {formData.category === 'hotel' && formData.type === 'request' && (
            <div className="border-t border-warm-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-warm-900 mb-4">Night Protocol (Care Instructions)</h3>
              <p className="text-sm text-warm-600 mb-4">
                Provide specific instructions for the sitter to ensure your children's comfort and safety
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="hotelName" className="block text-sm font-medium text-warm-700 mb-2">
                    Hotel Name
                  </label>
                  <input
                    id="hotelName"
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="e.g., Hilton Miami Downtown"
                  />
                </div>

                <div>
                  <label htmlFor="bedtime" className="block text-sm font-medium text-warm-700 mb-2">
                    Bedtime Routine
                  </label>
                  <input
                    id="bedtime"
                    type="text"
                    value={formData.bedtime}
                    onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="e.g., 8:30 PM - story time, then lights out"
                  />
                </div>

                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-warm-700 mb-2">
                    Allergies & Dietary Restrictions
                  </label>
                  <textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="List any allergies, food restrictions, or medical conditions"
                  />
                </div>

                <div>
                  <label htmlFor="specialInstructions" className="block text-sm font-medium text-warm-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Any other important information for the sitter (favorite toys, comfort items, fears, etc.)"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-warm-700 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    id="emergencyContact"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Your phone number for emergencies"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || (listingCount >= features.max_listings && profile?.role !== 'admin')}
              className="flex-1 bg-neutral-900 text-white py-4 font-medium hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? `${t('create.createListing')}...` : t('create.createListing')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-4 border-2 border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition"
            >
              {t('create.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
