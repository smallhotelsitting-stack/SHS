import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, Save, Trash2, AlertTriangle } from 'lucide-react';
import SubscriptionBadge from '../components/SubscriptionBadge';

export default function Profile() {
  const { t } = useLanguage();
  const { user, profile, refreshProfile, planName } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        avatar_url: formData.avatarUrl || null
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  const handleRequestDeletion = async () => {
    if (!user || deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await (supabase
      .from('data_deletion_requests') as any)
      .insert({
        user_id: user.id,
        status: 'pending'
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setShowDeleteModal(false);
      alert('Your data deletion request has been submitted. An admin will process it soon.');
    }

    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-warm-900">{t('profile.myProfile')}</h1>
              <SubscriptionBadge subscriptionStatus={profile.subscription_status} planName={planName || undefined} size="lg" showLabel={true} />
            </div>
            <p className="text-warm-600">{t('profile.manageAccount')}</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-secondary-700 px-4 py-3 rounded-lg mb-6">
            Profile updated successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-2">
              {t('auth.email')}
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-warm-100 border border-gray-300 rounded-lg">
              <Mail className="w-5 h-5 text-warm-500" />
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="flex-1 bg-transparent outline-none text-warm-700"
              />
            </div>
            <p className="text-xs text-warm-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-warm-700 mb-2">
              {t('auth.name')}
            </label>
            <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <User className="w-5 h-5 text-warm-500" />
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="flex-1 outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-warm-700 mb-2">
              {t('profile.phone')}
            </label>
            <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <Phone className="w-5 h-5 text-warm-500" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="flex-1 outline-none"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-warm-700 mb-2">
              {t('profile.bio')}
            </label>
            <div className="border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 outline-none rounded-lg"
                placeholder="Tell others about yourself..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-warm-700 mb-2">
              Avatar URL (Optional)
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="bg-warm-50 rounded-lg p-4">
            <p className="text-sm font-medium text-warm-700 mb-2">Account Role</p>
            <span className={`inline-block px-4 py-2 rounded-full font-semibold ${profile.role === 'admin' ? 'bg-red-100 text-red-800' :
              profile.role === 'host' ? 'bg-secondary-100 text-green-800' :
                'bg-primary-100 text-primary-800'
              }`}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? `${t('profile.saveChanges')}...` : t('profile.saveChanges')}
          </button>
        </form>

        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Request permanent deletion of your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Request Account Deletion
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Confirm Account Deletion
            </h3>
            <p className="text-sm text-warm-700 mb-4">
              This will submit a request to permanently delete your account and all associated data including:
            </p>
            <ul className="text-sm text-warm-700 mb-4 list-disc list-inside space-y-1">
              <li>Profile information</li>
              <li>All listings</li>
              <li>Messages and conversations</li>
              <li>Reviews and ratings</li>
              <li>Verification documents</li>
            </ul>
            <p className="text-sm font-semibold text-red-700 mb-4">
              An admin will review and process your request. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRequestDeletion}
                disabled={deleteConfirm !== 'DELETE' || loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
