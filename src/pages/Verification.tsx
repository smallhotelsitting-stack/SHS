import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

type VerificationDocument = {
  id: string;
  document_type: 'passport' | 'drivers_license' | 'national_id';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
};

export default function Verification() {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedType, setSelectedType] = useState<'passport' | 'drivers_license' | 'national_id'>('passport');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      setError('Only JPG, PNG, or PDF files are allowed');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from('verification_documents')
      .insert({
        user_id: user.id,
        document_type: selectedType,
        document_url: urlData.publicUrl,
        status: 'pending'
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess('Document uploaded successfully! Awaiting admin approval.');
      await fetchDocuments();
      await refreshProfile();
    }

    setUploading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-secondary-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-amber-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-secondary-100 text-secondary-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const hasApprovedDoc = documents.some(doc => doc.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-warm-900">Identity Verification</h1>
            <p className="text-warm-600">Verify your identity to build trust with families</p>
          </div>
        </div>

        {profile.is_verified && (
          <div className="mb-8 p-4 bg-secondary-100 border-l-4 border-secondary-600 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-secondary-600" />
              <div>
                <p className="font-semibold text-secondary-900">Verified Account</p>
                <p className="text-sm text-secondary-700">Your identity has been verified</p>
              </div>
            </div>
          </div>
        )}

        {!hasApprovedDoc && profile.role === 'sitter' && (
          <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Verification Required</p>
                <p className="text-sm text-amber-700">
                  As a sitter, you must verify your identity before you can accept bookings.
                  Upload a government-issued ID below.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-secondary-100 border-l-4 border-secondary-600 rounded-lg">
            <p className="text-secondary-800">{success}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-warm-900 mb-4">Upload Verification Document</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="national_id">National ID</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-warm-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
            <Upload className="w-12 h-12 text-warm-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-primary-600 hover:text-primary-700 font-semibold">
                Click to upload
              </span>
              <span className="text-warm-600"> or drag and drop</span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-sm text-warm-500 mt-2">JPG, PNG or PDF (max 5MB)</p>
          </div>

          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span>Uploading...</span>
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-warm-900 mb-4">Verification History</h2>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-warm-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-semibold text-warm-900 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-warm-600">
                          Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  {doc.status === 'rejected' && doc.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{doc.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
