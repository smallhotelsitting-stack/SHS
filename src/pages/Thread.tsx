import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, ArrowLeft } from 'lucide-react';
import { getTranslatedContent, type ListingTranslations } from '../utils/translations';
import type { MessageThread, Profile, Listing, Message } from '../types/database';

type ThreadWithDetails = MessageThread & {
  listing: Listing;
  guest: Profile;
  host: Profile;
};

export default function Thread() {
  const { t, getLocale, language } = useLanguage();
  const { id, lang } = useParams<{ id: string; lang?: string }>();
  const { user, hasFeature } = useAuth();
  const currentLang = lang || language;
  const [thread, setThread] = useState<ThreadWithDetails | null>(null);
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchThread();
      fetchMessages();

      const subscription = supabase
        .channel(`thread:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${id}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  const fetchThread = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('message_threads')
      .select('*, listing:listings(*), guest:profiles!message_threads_guest_id_fkey(*), host:profiles!message_threads_host_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching thread:', error);
    } else {
      setThread(data as any as ThreadWithDetails);
    }

    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as any[]);
    }
  };

  const markMessagesAsRead = async () => {
    if (!id || !user) return;

    await (supabase
      .from('messages') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', id)
      .neq('sender_id', user.id)
      .is('read_at', null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user) return;

    if (!hasFeature('can_reply_messages')) {
      alert('You need an active subscription to send messages');
      return;
    }

    setSending(true);

    const { error } = await (supabase
      .from('messages') as any)
      .insert({
        thread_id: id,
        sender_id: user.id,
        body: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } else {
      setNewMessage('');
      fetchMessages();
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <p className="text-warm-600 text-lg">Thread not found</p>
        <Link to={`/${currentLang}/inbox`} className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block">
          Back to inbox
        </Link>
      </div>
    );
  }

  const otherUser = thread.guest_id === user?.id ? thread.host : thread.guest;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6">
          <Link
            to={`/${currentLang}/inbox`}
            className="inline-flex items-center gap-2 text-primary-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('message.backToInbox')}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-xl font-bold">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{otherUser.name}</h1>
              <Link
                to={`/${currentLang}/listing/${thread.listing.slug}`}
                className="text-primary-100 hover:text-white text-sm transition"
              >
                Re: {getTranslatedContent(
                  { title: thread.listing.title, description: thread.listing.description, location: thread.listing.location },
                  thread.listing.translations as ListingTranslations | null,
                  language
                ).title}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-warm-50">
          {messages.length === 0 ? (
            <div className="text-center text-warm-500 py-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${isOwn
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-warm-900 border border-warm-200'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                    <p className={`text-xs text-warm-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {new Date(message.created_at).toLocaleString(getLocale())}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {hasFeature('can_reply_messages') ? (
          <form onSubmit={handleSend} className="p-4 border-t border-warm-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('message.typeMessage')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {t('message.send')}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 border-t border-warm-200 bg-amber-50 text-center">
            <p className="text-amber-800 font-medium mb-3">
              Upgrade your plan to reply to messages and connect with others.
            </p>
            <Link
              to={`/${currentLang}`}
              className="inline-block bg-amber-600 text-white px-6 py-2 rounded-full font-bold hover:bg-amber-700 transition shadow-md"
            >
              View Plans & Pricing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
