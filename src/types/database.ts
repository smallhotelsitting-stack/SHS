export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'guest' | 'host' | 'admin';
export type ListingType = 'offer' | 'request';
export type ListingCategory = 'house' | 'hotel';
export type ListingStatus = 'active' | 'paused' | 'closed';
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'expired';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          avatar_url: string | null;
          bio: string;
          phone: string;
          subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          subscription_renewal_date: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: UserRole;
          avatar_url?: string | null;
          bio?: string;
          phone?: string;
          subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_renewal_date?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          bio?: string;
          phone?: string;
          subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_renewal_date?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          type: ListingType;
          category: ListingCategory;
          location: string;
          start_date: string;
          end_date: string;
          images: Json;
          videos: Json;
          author_id: string;
          status: ListingStatus;
          translations: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          type: ListingType;
          category: ListingCategory;
          location: string;
          start_date: string;
          end_date: string;
          images?: Json;
          videos?: Json;
          author_id: string;
          status?: ListingStatus;
          translations?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          type?: ListingType;
          category?: ListingCategory;
          location?: string;
          start_date?: string;
          end_date?: string;
          images?: Json;
          videos?: Json;
          author_id?: string;
          status?: ListingStatus;
          translations?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      message_threads: {
        Row: {
          id: string;
          listing_id: string;
          guest_id: string;
          host_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          guest_id: string;
          host_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          guest_id?: string;
          host_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          billing_period: string;
          features: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          currency?: string;
          billing_period?: string;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          billing_period?: string;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          stripe_subscription_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          renewal_date: string | null;
          stripe_customer_id: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          renewal_date?: string | null;
          stripe_customer_id?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          renewal_date?: string | null;
          stripe_customer_id?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_transactions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          user_subscription_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          amount: number;
          currency: string;
          status: TransactionStatus;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          user_subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          amount: number;
          currency?: string;
          status?: TransactionStatus;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          user_subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_invoice_id?: string | null;
          amount?: number;
          currency?: string;
          status?: TransactionStatus;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type MessageThread = Database['public']['Tables']['message_threads']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
export type SubscriptionTransaction = Database['public']['Tables']['subscription_transactions']['Row'];
