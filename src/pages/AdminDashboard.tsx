import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, MessageSquare, Mail, Shield, Trash2, Ban, Flag, Clock, AlertTriangle, Crown, UserPlus, Gem, Download } from 'lucide-react';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import Papa from 'papaparse';
import type { Profile, Listing, SubscriptionPlan } from '../types/database';

export default function AdminDashboard() {
  const { t, formatDate, language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalThreads: 0,
    totalMessages: 0
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'listings' | 'audit' | 'admins' | 'verifications' | 'subscriptions' | 'categories' | 'bulk-import' | 'communications'>('users');
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [flagListingId, setFlagListingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedUserForSub, setSelectedUserForSub] = useState<string | null>(null);
  const [selectedPlanForSub, setSelectedPlanForSub] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchListings();
    fetchAuditLogs();
    fetchAdminUsers();
    fetchVerificationDocs();
    fetchSubscriptions();
    fetchSubscriptionPlans();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchStats = async () => {
    const [usersCount, listingsCount, threadsCount, messagesCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('listings').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('message_threads').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalListings: listingsCount.count || 0,
      totalThreads: threadsCount.count || 0,
      totalMessages: messagesCount.count || 0
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, author:profiles(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setListings(data as any);
    }
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setAuditLogs(data);
    }
  };

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase.rpc('list_admin_users');

    if (!error && data) {
      setAdminUsers(data);
    }
  };

  const fetchVerificationDocs = async () => {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*, user:profiles(name, email, role)')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setVerificationDocs(data);
    }
  };

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, user:profiles(id, name, email), plan:subscription_plans(id, name, slug, price)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserSubscriptions(data);
    }
  };

  const fetchSubscriptionPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setSubscriptionPlans(data);
    }
  };

  const handleUpdateUserSubscription = async () => {
    if (!selectedUserForSub || !selectedPlanForSub) {
      alert('Please select both a user and a plan');
      return;
    }

    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .upsert({
        user_id: selectedUserForSub,
        subscription_id: selectedPlanForSub,
        status: 'active',
        renewal_date: renewalDate.toISOString(),
        auto_renew: true
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription: ' + error.message);
      return;
    }

    const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanForSub);
    const selectedUser = users.find(u => u.id === selectedUserForSub);

    if (selectedPlan) {
      await (supabase
        .from('profiles') as any)
        .update({ subscription_status: selectedPlan.slug })
        .eq('id', selectedUserForSub);
    }

    await logAuditAction(
      'UPDATE_USER_SUBSCRIPTION',
      'user_subscriptions',
      selectedUserForSub,
      {},
      { user: selectedUser?.name, plan: selectedPlan?.name, renewal_date: renewalDate.toISOString() }
    );

    setShowSubModal(false);
    setSelectedUserForSub(null);
    setSelectedPlanForSub(null);
    fetchSubscriptions();
  };

  const handleVerificationApproval = async (docId: string, userId: string, approve: boolean, rejectionReason?: string) => {
    const { error: updateError } = await (supabase
      .from('verification_documents') as any)
      .update({
        status: approve ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null
      })
      .eq('id', docId);

    if (updateError) {
      alert('Error updating verification status');
      return;
    }

    if (approve) {
      const { error: profileError } = await (supabase
        .from('profiles') as any)
        .update({ is_verified: true })
        .eq('id', userId);

      if (profileError) {
        alert('Error updating profile verification status');
        return;
      }
    }

    await logAuditAction(
      approve ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
      'verification_documents',
      docId,
      { status: 'pending' },
      { status: approve ? 'approved' : 'rejected', rejection_reason: rejectionReason }
    );

    await fetchVerificationDocs();
    await fetchUsers();
  };

  const logAuditAction = async (action: string, entity: string, entityId: string, oldValues?: any, newValues?: any) => {
    await (supabase
      .from('audit_logs') as any)
      .insert({
        action,
        entity,
        entity_id: entityId,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: null,
        user_agent: navigator.userAgent
      });

    fetchAuditLogs();
  };

  const handleRoleChange = async (userId: string, newRole: 'guest' | 'host' | 'admin') => {
    const user = users.find(u => u.id === userId);
    const oldRole = user?.role;

    const { error } = await (supabase
      .from('profiles') as any)
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } else {
      await logAuditAction('UPDATE_ROLE', 'profile', userId, { role: oldRole }, { role: newRole });
      fetchUsers();
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendUserId || !suspendReason) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + suspendDays);

    const { error: suspensionError } = await (supabase
      .from('user_suspensions') as any)
      .insert({
        user_id: suspendUserId,
        reason: suspendReason,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });

    if (suspensionError) {
      console.error('Error creating suspension:', suspensionError);
      alert('Failed to suspend user');
      return;
    }

    const { error: profileError } = await (supabase
      .from('profiles') as any)
      .update({ is_suspended: true })
      .eq('id', suspendUserId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      alert('Failed to update user status');
    } else {
      await logAuditAction('SUSPEND_USER', 'profile', suspendUserId, {}, { reason: suspendReason, expires_at: expiresAt });
      setSuspendUserId(null);
      setSuspendReason('');
      setSuspendDays(7);
      fetchUsers();
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    const { error: suspensionError } = await (supabase
      .from('user_suspensions') as any)
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (suspensionError) {
      console.error('Error deactivating suspension:', suspensionError);
    }

    const { error: profileError } = await (supabase
      .from('profiles') as any)
      .update({ is_suspended: false })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      alert('Failed to unsuspend user');
    } else {
      await logAuditAction('UNSUSPEND_USER', 'profile', userId, {}, {});
      fetchUsers();
    }
  };

  const handleFlagListing = async () => {
    if (!flagListingId || !flagReason) return;

    const { error } = await (supabase
      .from('listings') as any)
      .update({ is_flagged: true, flagged_reason: flagReason })
      .eq('id', flagListingId);

    if (error) {
      console.error('Error flagging listing:', error);
      alert('Failed to flag listing');
    } else {
      await logAuditAction('FLAG_LISTING', 'listing', flagListingId, {}, { reason: flagReason });
      setFlagListingId(null);
      setFlagReason('');
      fetchListings();
    }
  };

  const handleUnflagListing = async (listingId: string) => {
    const { error } = await (supabase
      .from('listings') as any)
      .update({ is_flagged: false, flagged_reason: null })
      .eq('id', listingId);

    if (error) {
      console.error('Error unflagging listing:', error);
      alert('Failed to unflag listing');
    } else {
      await logAuditAction('UNFLAG_LISTING', 'listing', listingId, {}, {});
      fetchListings();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will soft-delete their account.')) {
      return;
    }

    const { error } = await (supabase
      .from('profiles') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } else {
      await logAuditAction('DELETE_USER', 'profile', userId, {}, {});
      fetchUsers();
      fetchStats();
    }
  };

  const handleListingStatusChange = async (listingId: string, newStatus: 'active' | 'paused' | 'closed') => {
    const listing = listings.find(l => l.id === listingId);
    const oldStatus = listing?.status;

    const { error } = await (supabase
      .from('listings') as any)
      .update({ status: newStatus })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing');
    } else {
      await logAuditAction('UPDATE_LISTING_STATUS', 'listing', listingId, { status: oldStatus }, { status: newStatus });
      fetchListings();
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) {
      return;
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    } else {
      await logAuditAction('DELETE_LISTING', 'listing', listingId, {}, {});
      fetchListings();
      fetchStats();
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Delete category "${categoryName}"? This will soft-delete it.`)) {
      return;
    }

    const { error } = await (supabase
      .from('custom_categories') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } else {
      await logAuditAction('DELETE_CATEGORY', 'custom_categories', categoryId, {}, { name: categoryName });
      fetchCategories();
    }
  };

  const exportAllListings = () => {
    if (listings.length === 0) {
      alert('No listings to export');
      return;
    }

    const headers = [
      'id',
      'title',
      'description',
      'location',
      'type',
      'category',
      'start_date',
      'end_date',
      'status',
      'images',
      'author_id'
    ];

    const rows = listings.map(listing => [
      listing.id,
      listing.title,
      listing.description || '',
      listing.location,
      listing.type,
      listing.category,
      listing.start_date ? new Date(listing.start_date).toISOString().split('T')[0] : '',
      listing.end_date ? new Date(listing.end_date).toISOString().split('T')[0] : '',
      listing.status,
      Array.isArray(listing.images) ? listing.images.join('|') : '',
      listing.author_id
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `listings_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };



  const handleBulkImport = async (file: File) => {
    setImportLoading(true);
    setImportMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let updateCount = 0;
          let insertCount = 0;
          let failCount = 0;

          for (const row of results.data as any[]) {
            try {
              const id = row.id?.trim();
              const title = row.title?.trim();
              const description = row.description?.trim() || '';
              const location = row.location?.trim();
              const type = row.type?.trim();
              const category = row.category?.trim();
              const price = row.price?.trim() ? parseFloat(row.price) : null;
              const startDate = row.start_date?.trim() || null;
              const endDate = row.end_date?.trim() || null;
              const status = row.status?.trim() || 'active';
              const images = row.images?.trim() ? row.images.split('|').filter((img: string) => img.trim()) : [];
              const createdBy = row.created_by?.trim() || user?.id;

              if (!title || !location || !type || !category) {
                failCount++;
                continue;
              }

              const listingData = {
                title,
                description,
                location,
                type,
                category,
                price,
                start_date: startDate,
                end_date: endDate,
                status,
                images,
                created_by: createdBy,
              };

              if (id) {
                // Update existing listing
                const { error } = await (supabase.from('listings') as any)
                  .update(listingData)
                  .eq('id', id);

                if (!error) {
                  updateCount++;
                } else {
                  console.error('Update error:', error);
                  failCount++;
                }
              } else {
                // Insert new listing
                const { error } = await (supabase.from('listings') as any)
                  .insert(listingData);

                if (!error) {
                  insertCount++;
                } else {
                  console.error('Insert error:', error);
                  failCount++;
                }
              }
            } catch (err) {
              console.error('Row processing error:', err);
              failCount++;
            }
          }

          setImportMessage(
            `Import complete: ${insertCount} new listings added, ${updateCount} listings updated, ${failCount} failed`
          );
          if (insertCount > 0 || updateCount > 0) {
            fetchStats();
            fetchListings();
          }
        } catch (err) {
          setImportMessage('Error processing file. Please ensure it matches the exported format.');
          console.error('Import error:', err);
        } finally {
          setImportLoading(false);
        }
      },
      error: (error: any) => {
        setImportMessage(`Error parsing CSV: ${error.message}`);
        setImportLoading(false);
      },
    });
  };

  const handlePromoteToAdmin = async () => {
    if (!promoteEmail) return;

    const { data, error } = await supabase.rpc('promote_user_to_admin', {
      user_email: promoteEmail
    } as any);

    if (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user: ' + error.message);
    } else if (data && !(data as any).success) {
      alert((data as any).error);
    } else {
      alert(`Successfully promoted ${promoteEmail} to admin`);
      setPromoteEmail('');
      setShowPromoteModal(false);
      fetchAdminUsers();
      fetchUsers();
    }
  };

  const handleDemoteAdmin = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove admin privileges from ${userName}?`)) {
      return;
    }

    const { data, error } = await supabase.rpc('demote_admin_to_guest', {
      user_id_param: userId
    } as any);

    if (error) {
      console.error('Error demoting admin:', error);
      alert('Failed to demote admin: ' + error.message);
    } else if (data && !(data as any).success) {
      alert((data as any).error);
    } else {
      alert(`Successfully removed admin privileges from ${userName}`);
      fetchAdminUsers();
      fetchUsers();
    }
  };

  const handleCopyUserEmails = async () => {
    const emailList = users
      .map(u => u.email)
      .filter(Boolean)
      .join(' ');

    if (!emailList) {
      alert('No user emails found to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(emailList);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy emails:', err);
      alert('Failed to copy emails to clipboard.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          {t('admin.dashboard')}
        </h1>
        <p className="text-gray-600 mt-1">{t('admin.managePlatform')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('admin.totalUsers')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('admin.totalListings')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalListings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('admin.messageThreads')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalThreads}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <MessageSquare className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{t('admin.totalMessages')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMessages}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Mail className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {t('admin.usersManagement')}
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'listings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {t('admin.listingsManagement')}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'audit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'admins'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Admin Users
              </span>
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'verifications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verifications
                {verificationDocs.filter(d => d.status === 'pending').length > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {verificationDocs.filter(d => d.status === 'pending').length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'subscriptions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                <Gem className="w-4 h-4" />
                Subscriptions
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('bulk-import')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'bulk-import'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Bulk Import
            </button>
            <button
              onClick={() => setActiveTab('communications')}
              className={`px-6 py-4 font-semibold transition ${activeTab === 'communications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Communications
              </span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-semibold text-gray-700">Name</th>
                    <th className="pb-3 font-semibold text-gray-700">Email</th>
                    <th className="pb-3 font-semibold text-gray-700">Role</th>
                    <th className="pb-3 font-semibold text-gray-700">Status</th>
                    <th className="pb-3 font-semibold text-gray-700">Joined</th>
                    <th className="pb-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="py-4 text-gray-600">{user.email}</td>
                      <td className="py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4">
                        {(user as any).is_suspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600 text-sm">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          {(user as any).is_suspended ? (
                            <button
                              onClick={() => handleUnsuspendUser(user.id)}
                              className="text-green-600 hover:text-green-700 transition"
                              title="Unsuspend user"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendUserId(user.id)}
                              className="text-orange-600 hover:text-orange-700 transition"
                              title="Suspend user"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-4">
              {listings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{getTranslatedContent(
                          { title: listing.title, description: listing.description, location: listing.location },
                          listing.translations as ListingTranslations | null,
                          language
                        ).title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(listing.type, listing.category).bgLight} ${getCategoryColor(listing.type, listing.category).text}`}>
                          {getCategoryLabel(listing.type, listing.category)}
                        </span>
                        {listing.is_flagged && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            <Flag className="w-3 h-3" />
                            Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Posted by {listing.author.name} on {formatDate(listing.created_at)}
                      </p>
                      {listing.is_flagged && listing.flagged_reason && (
                        <p className="text-sm text-red-700 mb-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Reason:</strong> {listing.flagged_reason}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2">{getTranslatedContent(
                        { title: listing.title, description: listing.description, location: listing.location },
                        listing.translations as ListingTranslations | null,
                        language
                      ).description}</p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <select
                        value={listing.status}
                        onChange={(e) => handleListingStatusChange(listing.id, e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">{t('listing.active')}</option>
                        <option value="paused">{t('listing.paused')}</option>
                        <option value="closed">{t('listing.closed')}</option>
                      </select>

                      {listing.is_flagged ? (
                        <button
                          onClick={() => handleUnflagListing(listing.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          title="Unflag listing"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setFlagListingId(listing.id)}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                          title="Flag listing"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                          log.action.includes('SUSPEND') || log.action.includes('FLAG') ? 'bg-orange-100 text-orange-800' :
                            log.action.includes('UNSUSPEND') || log.action.includes('UNFLAG') ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-600">{log.entity}</span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">
                        <span className="font-semibold">{log.user?.name || 'Unknown'}</span>
                        {' '}({log.user?.email || 'N/A'})
                      </p>
                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <p className="text-xs text-gray-600 font-mono">
                          {JSON.stringify(log.new_values)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-1">{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Admin Users</h3>
                  <p className="text-sm text-gray-600">Manage users with admin privileges</p>
                </div>
                <button
                  onClick={() => setShowPromoteModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Promote User
                </button>
              </div>

              <div className="grid gap-4">
                {adminUsers.map((admin: any) => (
                  <div
                    key={admin.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Crown className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{admin.name}</h4>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Admin since {formatDate(admin.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {admin.is_suspended && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                        <button
                          onClick={() => handleDemoteAdmin(admin.id, admin.name)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Remove Admin
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {adminUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Crown className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No admin users found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">ID Verifications</h3>
                <p className="text-sm text-gray-600">Review and approve user identity documents</p>
              </div>

              <div className="grid gap-4">
                {verificationDocs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={`border-2 rounded-lg p-6 ${doc.status === 'pending' ? 'border-amber-300 bg-amber-50' :
                      doc.status === 'approved' ? 'border-green-300 bg-green-50' :
                        'border-red-300 bg-red-50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${doc.status === 'pending' ? 'bg-amber-100' :
                          doc.status === 'approved' ? 'bg-green-100' :
                            'bg-red-100'
                          }`}>
                          <Shield className={`w-6 h-6 ${doc.status === 'pending' ? 'text-amber-600' :
                            doc.status === 'approved' ? 'text-green-600' :
                              'text-red-600'
                            }`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{doc.user?.name || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-600">{doc.user?.email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {doc.document_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Role: {doc.user?.role || 'unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Submitted {formatDate(doc.submitted_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === 'pending' ? 'bg-amber-200 text-amber-800' :
                        doc.status === 'approved' ? 'bg-green-200 text-green-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-4">
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View Document
                      </a>
                    </div>

                    {doc.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerificationApproval(doc.id, doc.user_id, true)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              handleVerificationApproval(doc.id, doc.user_id, false, reason);
                            }
                          }}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{doc.rejection_reason}</p>
                      </div>
                    )}

                    {doc.status === 'approved' && doc.reviewed_at && (
                      <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          Approved on {formatDate(doc.reviewed_at)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {verificationDocs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No verification documents found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bulk-import' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Bulk Listing Management</h3>
                <p className="text-sm text-gray-600">Export, edit, and import all your listings in Excel format</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Excel-Style Workflow</h4>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li>Download the current listings as a CSV file</li>
                      <li>Open in Excel, Google Sheets, or any spreadsheet software</li>
                      <li>Edit existing listings or add new rows for new listings</li>
                      <li>Save and upload the file back to sync all changes</li>
                    </ol>
                  </div>
                </div>

                <button
                  onClick={exportAllListings}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Download All Listings ({listings.length} total)
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Listings Data Preview</h4>
                <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Title</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Location</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Category</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Images</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listings.slice(0, 50).map((listing) => (
                        <tr key={listing.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-mono text-gray-500">{listing.id.slice(0, 8)}...</td>
                          <td className="px-3 py-2 text-gray-900 font-medium max-w-xs truncate">{listing.title}</td>
                          <td className="px-3 py-2 text-gray-600">{listing.location}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${listing.type === 'offer' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                              {listing.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 capitalize">{listing.category}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                              listing.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-xs">
                            {Array.isArray(listing.images) ? listing.images.length : 0} images
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {listings.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2">Showing first 50 of {listings.length} listings. Download the CSV to see all.</p>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleBulkImport(file);
                    }
                  }}
                  disabled={importLoading}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-gray-200 p-4 rounded-full">
                      <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Upload Edited CSV File</p>
                      <p className="text-sm text-gray-600">Click to select file or drag and drop</p>
                    </div>
                  </div>
                </label>
              </div>

              {importMessage && (
                <div className={`p-4 rounded-lg ${importMessage.includes('complete') || importMessage.includes('updated')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                  {importMessage}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">CSV Format Rules:</p>
                    <ul className="space-y-1 text-xs">
                      <li><strong>id:</strong> Keep existing IDs to update listings. Leave blank for new listings.</li>
                      <li><strong>title, location, type, category:</strong> Required fields.</li>
                      <li><strong>type:</strong> Must be "offer" or "request".</li>
                      <li><strong>category:</strong> Use "hotel", "house", etc.</li>
                      <li><strong>images:</strong> Use pipe (|) to separate multiple image URLs.</li>
                      <li><strong>dates:</strong> Use YYYY-MM-DD format.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Custom Categories</h3>
                <p className="text-sm text-gray-600">Manage all custom categories created for listings</p>
              </div>

              <div className="grid gap-4">
                {categories.filter((c: any) => !c.deleted_at).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No custom categories created yet</p>
                  </div>
                ) : (
                  categories.filter((c: any) => !c.deleted_at).map((category: any) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Slug: <span className="font-mono">{category.slug}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {formatDate(category.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">User Subscriptions</h3>
                  <p className="text-sm text-gray-600">Manage paid subscriptions and plans</p>
                </div>
                <button
                  onClick={() => setShowSubModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Subscription
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-700">User</th>
                      <th className="pb-3 font-semibold text-gray-700">Email</th>
                      <th className="pb-3 font-semibold text-gray-700">Plan</th>
                      <th className="pb-3 font-semibold text-gray-700">Status</th>
                      <th className="pb-3 font-semibold text-gray-700">Renewal Date</th>
                      <th className="pb-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSubscriptions.map((sub: any) => (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-amber-500" />
                            {sub.user?.name}
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{sub.user?.email}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {sub.plan?.name}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {sub.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600 text-sm">
                          {sub.renewal_date ? formatDate(sub.renewal_date) : 'N/A'}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => {
                              setSelectedUserForSub(sub.user_id);
                              setShowSubModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 transition"
                            title="Edit subscription"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {userSubscriptions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Gem className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No active subscriptions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">User Communications</h3>
                <p className="text-sm text-gray-600">Get a list of all user emails for external broadcasting</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="bg-blue-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                    <Mail className="w-10 h-10 text-blue-600" />
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Email List Generator</h4>
                    <p className="text-gray-600">
                      Click the button below to copy all registered user emails to your clipboard.
                      Emails are space-separated, ready to be pasted into your email client's BCC field.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleCopyUserEmails}
                      className={`w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                        }`}
                    >
                      {copySuccess ? (
                        <>
                          <Shield className="w-6 h-6 animate-bounce" />
                          Emails Copied!
                        </>
                      ) : (
                        <>
                          <Mail className="w-6 h-6" />
                          Copy All {users.length} Emails
                        </>
                      )}
                    </button>

                    {copySuccess && (
                      <p className="text-green-600 text-sm font-semibold mt-3 animate-fade-in">
                        Successfully copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-start gap-4">
                <div className="bg-white p-2 rounded shadow-sm">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-1">How to use:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the email list using the button above.</li>
                    <li>Open your email provider (Gmail, Outlook, etc.).</li>
                    <li>Compose a new message.</li>
                    <li>Paste the list into the <strong>BCC</strong> field to protect user privacy.</li>
                    <li>Send your announcement!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {suspendUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="w-6 h-6 text-orange-600" />
              Suspend User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for suspension..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="365"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSuspendUser}
                  disabled={!suspendReason}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suspend
                </button>
                <button
                  onClick={() => {
                    setSuspendUserId(null);
                    setSuspendReason('');
                    setSuspendDays(7);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {flagListingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-6 h-6 text-orange-600" />
              Flag Listing
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for flagging..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleFlagListing}
                  disabled={!flagReason}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Flag
                </button>
                <button
                  onClick={() => {
                    setFlagListingId(null);
                    setFlagReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPromoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-blue-600" />
              Promote User to Admin
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the email address of an existing user to grant admin privileges
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePromoteToAdmin}
                  disabled={!promoteEmail}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Promote
                </button>
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setPromoteEmail('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gem className="w-6 h-6 text-amber-600" />
              Assign Subscription
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserForSub || ''}
                  onChange={(e) => setSelectedUserForSub(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Plan
                </label>
                <select
                  value={selectedPlanForSub || ''}
                  onChange={(e) => setSelectedPlanForSub(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a plan...</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/year
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateUserSubscription}
                  disabled={!selectedUserForSub || !selectedPlanForSub}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowSubModal(false);
                    setSelectedUserForSub(null);
                    setSelectedPlanForSub(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
