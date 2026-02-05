import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, SubscriptionFeatures } from '../types/database';

export const FREE_TRIAL_FEATURES: SubscriptionFeatures = {
  max_listings: 1,
  can_view_listings: true,
  can_reply_messages: false,
  can_highlight_listing: false,
  can_social_promotion: false,
  has_media_upload: true
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  features: SubscriptionFeatures;
  planName: string | null;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  signUp: (email: string, password: string, name: string, role: 'guest' | 'host') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [features, setFeatures] = useState<SubscriptionFeatures>(FREE_TRIAL_FEATURES);
  const [planName, setPlanName] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, subscription_plan:subscription_plans(name, features)')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    const typedData = data as any;
    if (typedData?.subscription_plan && typedData.subscription_status === 'active') {
      setFeatures(typedData.subscription_plan.features as unknown as SubscriptionFeatures);
      setPlanName(typedData.subscription_plan.name);
    } else {
      setFeatures(FREE_TRIAL_FEATURES);
      setPlanName(null);
    }

    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'guest' | 'host') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const hasFeature = useCallback((feature: keyof SubscriptionFeatures) => {
    if (profile?.role === 'admin') return true;
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    return false;
  }, [features, profile]);

  const value = {
    user,
    profile,
    session,
    loading,
    features,
    planName,
    hasFeature,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
