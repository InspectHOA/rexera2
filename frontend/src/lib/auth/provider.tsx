'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Route } from 'next';
import { useSupabase } from '@/lib/supabase/provider';
import { SKIP_AUTH, SKIP_AUTH_USER } from '@/lib/auth/config';

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
};

const Context = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    if (SKIP_AUTH) {
      // In skip_auth mode, just redirect to login
      router.push('/auth/login' as Route);
      return;
    }
    
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
    if (SKIP_AUTH) {
      console.log('🔧 Using SKIP_AUTH mode');
      
      // Create hardcoded user and profile
      const mockUser = {
        id: SKIP_AUTH_USER.id,
        email: SKIP_AUTH_USER.email,
        app_metadata: {},
        aud: 'authenticated',
        user_metadata: {
          full_name: SKIP_AUTH_USER.name,
          name: SKIP_AUTH_USER.name,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User;

      const mockProfile: UserProfile = {
        id: SKIP_AUTH_USER.id,
        user_type: SKIP_AUTH_USER.user_type,
        email: SKIP_AUTH_USER.email,
        full_name: SKIP_AUTH_USER.name,
        role: SKIP_AUTH_USER.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    console.log('🔐 Using SSO mode');
    
    // SSO mode - use real Supabase auth
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Load profile if user exists
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      
      setLoading(false);
    };

    const loadUserProfile = async (user: User) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              user_type: 'hil_user',
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              role: 'HIL_ADMIN',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (!insertError) {
            // Reload profile after creation
            const { data: newProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (newProfile) {
              setProfile({
                ...newProfile,
                full_name: newProfile.full_name ?? undefined,
                company_id: newProfile.company_id ?? undefined,
                created_at: newProfile.created_at ?? new Date().toISOString(),
                updated_at: newProfile.updated_at ?? new Date().toISOString()
              });
            }
          }
        } else {
          setProfile({
            ...data,
            full_name: data.full_name ?? undefined,
            company_id: data.company_id ?? undefined,
            created_at: data.created_at ?? new Date().toISOString(),
            updated_at: data.updated_at ?? new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
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
          await loadUserProfile(session.user);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array since SKIP_AUTH is a constant and we want this to run only once

  return (
    <Context.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        signOut
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