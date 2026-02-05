import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import type { MessageThread, Profile, Listing, Message } from '../types/database';

type ThreadWithDetails = MessageThread & {
  listing: Listing;
  guest: Profile;
  host: Profile;
  lastMessage?: Message;
  unreadCount: number;
};

export default function Inbox() {
  const { t, getLocale, language } = useLanguage();
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  const fetchThreads = async () => {
    if (!user) return;

    const { data: threadData, error: threadError } = await supabase
      .from('message_threads')
      .select('*, listing:listings(*), guest:profiles!message_threads_guest_id_fkey(*), host:profiles!message_threads_host_id_fkey(*)')
      .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (threadError) {
      console.error('Error fetching threads:', threadError);
      setLoading(false);
      return;
    }

    const threadsWithMessages = await Promise.all(
      (threadData as any[]).map(async (thread) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        return {
          ...thread,
          lastMessage: lastMessage || undefined,
          unreadCount: count || 0
        };
      })
    );

    setThreads(threadsWithMessages as ThreadWithDetails[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getOtherUser = (thread: ThreadWithDetails) => {
    return thread.guest_id === user?.id ? thread.host : thread.guest;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8" />
            {t('message.inbox')}
          </h1>
          <p className="text-primary-100 mt-1">{t('message.communicate')}</p>
        </div>

        {threads.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-warm-600 text-lg">{t('message.noMessages')}</p>
            <p className="text-warm-500 mt-2">{t('message.startConversation')}</p>
            <Link
              to="/"
              className="inline-block mt-6 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              {t('nav.browse')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-warm-200">
            {threads.map((thread) => {
              const otherUser = getOtherUser(thread);
              return (
                <Link
                  key={thread.id}
                  to={`/inbox/${thread.id}`}
                  className="block p-6 hover:bg-warm-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-warm-900 truncate">
                          {otherUser.name}
                        </h3>
                        {thread.unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-warm-600 mb-2">
                        Re: {getTranslatedContent(
                          { title: thread.listing.title, description: thread.listing.description, location: thread.listing.location },
                          thread.listing.translations as any as ListingTranslations | null,
                          language
                        ).title}
                      </p>

                      {thread.lastMessage && (
                        <p className="text-sm text-warm-500 truncate">
                          {thread.lastMessage.sender_id === user?.id && 'You: '}
                          {thread.lastMessage.body}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {thread.lastMessage
                          ? new Date(thread.lastMessage.created_at).toLocaleString(getLocale())
                          : new Date(thread.created_at).toLocaleString(getLocale())}
                      </p>
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
