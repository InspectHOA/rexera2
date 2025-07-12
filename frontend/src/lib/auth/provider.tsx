'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Route } from 'next';
import { useSupabase } from '@/lib/supabase/provider';
interface UserProfile {
  id: string;
  user_type: string;
  email: string;
  full_name?: string;
  role: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

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
  // Disable auth bypass to use real Google OAuth
  const shouldBypassAuth = false; // isLocalhost && isDevelopment;

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setProfile(null);
      } else {
        console.log('Loaded user profile from database:', data);
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
        console.log('Creating user profile with OAuth data:', {
          user_id: user.id,
          email: user.email,
          user_metadata: user.user_metadata
        });
        
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            user_type: 'hil_user',  // Default to HIL user type
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            role: 'HIL_ADMIN',  // Use HIL_ADMIN as default role for HIL users
            company_id: null,  // HIL users don't have company_id
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          }
      } else {
        // Update existing profile with latest OAuth data
        console.log('Updating existing user profile:', {
          existing_full_name: existingProfile.full_name,
          oauth_full_name: user.user_metadata?.full_name,
          oauth_name: user.user_metadata?.name
        });
        
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
            email: user.email!, // Update email in case it changed
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          }
      }
    } catch (error) {
      }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/auth/login' as Route);
    } catch (error) {
      }
  };

  useEffect(() => {
    if (shouldBypassAuth) {
      // Create mock user for localhost development
      const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Fixed UUID for development
      const mockUser = {
        id: mockUserId,
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
        id: mockUserId,
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
      const { data: { session } } = await supabase.auth.getSession();
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