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
  const [initialized, setInitialized] = useState(false);

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
    
    // SSO mode - rely on auth state changes instead of direct session checks
    const getSession = async () => {
      console.log('🔍 Initializing auth state listener...');
      
      // Check if we just returned from OAuth with improved persistence
      const oauthInUrl = typeof window !== 'undefined' && window.location.search.includes('auth=success');
      const oauthInStorage = typeof window !== 'undefined' && sessionStorage.getItem('oauth_success') === 'true';
      const oauthProcessing = typeof window !== 'undefined' && sessionStorage.getItem('oauth_processing') === 'true';
      
      const authSuccess = oauthInUrl || oauthInStorage || oauthProcessing;
      
      console.log('🔍 OAuth detection:', { 
        oauthInUrl, 
        oauthInStorage, 
        oauthProcessing, 
        authSuccess 
      });
      
      if (authSuccess) {
        console.log('🎯 Detected OAuth success, manually refreshing session...');
        
        // Mark OAuth success and processing state in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('oauth_success', 'true');
          sessionStorage.setItem('oauth_processing', 'true');
          
          // Clean up URL if present
          if (window.location.search.includes('auth=success')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('auth');
            window.history.replaceState({}, '', url.toString());
          }
        }
        
        // Force a session refresh with timeout, then try direct session check
        try {
          console.log('🔄 Forcing session refresh...');
          
          // Add timeout to refresh operation
          const refreshPromise = supabase.auth.refreshSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Refresh timeout')), 2000)
          );
          
          const refreshResult = await Promise.race([refreshPromise, timeoutPromise]) as any;
          console.log('✅ Session refresh completed:', {
            hasSession: !!refreshResult.data.session,
            hasUser: !!refreshResult.data.user,
            error: refreshResult.error
          });
          
          // If refresh gives us a session immediately, use it
          if (refreshResult.data.session?.user && !refreshResult.error) {
            console.log('🎯 Got session from refresh, setting user directly');
            setUser(refreshResult.data.session.user);
            await loadUserProfile(refreshResult.data.session.user);
            setLoading(false);
            
            // Clear OAuth flags since we're done
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('oauth_success');
              sessionStorage.removeItem('oauth_processing');
            }
            return; // Exit early since we have our session
          }
        } catch (error) {
          console.warn('⚠️ Session refresh failed or timed out:', error);
          
          // Fallback: try getting session directly
          console.log('🔄 Fallback: trying direct session check...');
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('📊 Direct session check result:', {
              hasSession: !!session,
              hasUser: !!session?.user,
              userEmail: session?.user?.email,
              error: sessionError
            });
            
            if (session?.user && !sessionError) {
              console.log('🎯 Got session from direct check, setting user');
              setUser(session.user);
              await loadUserProfile(session.user);
              setLoading(false);
              
              // Clear OAuth flags since we're done
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('oauth_success');
                sessionStorage.removeItem('oauth_processing');
              }
              return; // Exit early since we have our session
            }
          } catch (sessionError) {
            console.error('❌ Direct session check also failed:', sessionError);
          }
          
          // If both refresh and direct session failed, clear flags and set no user
          setUser(null);
          setLoading(false);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_success');
            sessionStorage.removeItem('oauth_processing');
          }
          return;
        }
        
        // Set a timeout to handle cases where auth state change still doesn't fire
        setTimeout(() => {
          if (loading) {
            console.warn('⚠️ Auth state change not received after refresh, defaulting to no user');
            setUser(null);
            setLoading(false);
            // Clear OAuth flags on timeout
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('oauth_success');
              sessionStorage.removeItem('oauth_processing');
            }
          }
        }, 5000); // Increased timeout to 5 seconds
      } else {
        // No OAuth indicator, check for existing session first
        console.log('🔐 No OAuth success indicator, checking for existing session...');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ Found existing session for user:', session.user.email);
            setUser(session.user);
            await loadUserProfile(session.user);
            setLoading(false);
          } else {
            console.log('🔐 No existing session, setting no user');
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('❌ Error checking session:', error);
          setUser(null);
          setLoading(false);
        }
      }
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

    // Start session check (immediate, no async work)
    getSession();

    // Use initialization protection only for auth state listener to prevent duplicate subscriptions
    const authListenerKey = 'rexera_auth_listener_init';
    const listenerAlreadyInitialized = typeof window !== 'undefined' && 
      window.sessionStorage.getItem(authListenerKey) === 'true';
    
    if (initialized || listenerAlreadyInitialized) {
      console.log('⚠️ Auth state listener already initialized, skipping listener setup');
      return;
    }
    
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(authListenerKey, 'true');
    }
    setInitialized(true);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth state change: ${event}`, session?.user?.email || 'no user');
        console.log(`📊 Session details:`, {
          hasSession: !!session,
          hasUser: !!session?.user,
          expiresAt: session?.expires_at,
          accessToken: session?.access_token ? '***present***' : 'missing'
        });
        
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out, redirecting to login');
          setUser(null);
          setProfile(null);
          setLoading(false);
          router.push('/auth/login' as Route);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in successfully!');
          console.log('👤 User data:', {
            id: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          });
          setUser(session.user);
          console.log('📝 Loading user profile...');
          await loadUserProfile(session.user);
          setLoading(false);
          
          // Clear OAuth processing flags on successful sign in
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_success');
            sessionStorage.removeItem('oauth_processing');
          }
          
          console.log('✅ Sign in process completed');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed successfully');
          setUser(session.user);
          setLoading(false);
        } else {
          console.log(`⚠️ Unhandled auth event: ${event}`);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      
      // Clean up init flag only if this is a real unmount (not React StrictMode)
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('rexera_auth_listener_init');
        }
      }, 500);
    };
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