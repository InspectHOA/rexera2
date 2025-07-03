'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
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
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
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
          router.push('/auth/login');
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

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