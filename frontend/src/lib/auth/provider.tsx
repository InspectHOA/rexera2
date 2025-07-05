'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Route } from 'next';
import { useSupabase } from '@/lib/supabase/provider';
import type { UserProfile } from '@rexera/types';

type AuthContext = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Context = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in localhost development mode
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldBypassAuth = isLocalhost && isDevelopment;

  const refreshProfile = async () => {
    if (!user) {
      console.log('refreshProfile: No user, setting profile to null');
      setProfile(null);
      return;
    }

    console.log('refreshProfile: Fetching profile for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else {
        console.log('refreshProfile: Profile fetched successfully:', data);
        // Convert null values to undefined to match UserProfile type
        const profile: UserProfile = {
          ...data,
          full_name: data.full_name ?? undefined,
          company_id: data.company_id ?? undefined,
          created_at: data.created_at ?? new Date().toISOString(),
          updated_at: data.updated_at ?? new Date().toISOString()
        };
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile with Google OAuth data
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: 'USER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any);

        if (error) {
          console.error('Error creating user profile:', error);
        }
      } else {
        // Update existing profile with latest OAuth data
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/auth/login' as Route);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (shouldBypassAuth) {
      // Create mock user for localhost development
      const mockUser = {
        id: 'localhost-dev-user',
        email: 'dev@localhost.com',
        app_metadata: {},
        aud: 'authenticated',
        user_metadata: {
          full_name: 'Development User',
          name: 'Development User',
          avatar_url: null,
          picture: null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;

      const mockProfile: UserProfile = {
        id: 'localhost-dev-user',
        user_type: 'hil_user',
        email: 'dev@localhost.com',
        full_name: 'Development User',
        role: 'USER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      console.log('getSession: Checking initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('getSession: Session found:', !!session, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          router.push('/auth/login' as Route);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // When user signs in, ensure profile exists or create it
          await ensureUserProfile(session.user);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, shouldBypassAuth]);

  useEffect(() => {
    if (user && !profile) {
      console.log('useEffect: User exists but no profile, calling refreshProfile...');
      refreshProfile();
    }
  }, [user]);

  return (
    <Context.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        signOut, 
        refreshProfile 
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};