'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';

export default function DebugNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  // supabase client is imported above

  useEffect(() => {
    setDebugInfo({
      authLoading,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      timestamp: new Date().toISOString()
    });
  }, [user, authLoading]);

  const runDatabaseTests = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      // Test 1: Check auth session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        hasSession: !!session.session,
        user: session.session?.user ? {
          id: session.session.user.id,
          email: session.session.user.email
        } : null,
        error: sessionError?.message
      };

      // Test 2: Check user profile
      if (session.session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.session.user.id)
          .single();
          
        results.profile = {
          exists: !!profile,
          data: profile,
          error: profileError?.message
        };
      }

      // Test 3: Query notifications
      const { data: notifications, error: notifError } = await supabase
        .from('hil_notifications')
        .select('*')
        .limit(10);
        
      results.notifications = {
        count: notifications?.length || 0,
        data: notifications,
        error: notifError?.message
      };

      // Test 4: Check authentication status
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
      results.authCheck = {
        hasUser: !!authUser,
        userId: authUser?.id,
        error: authError?.message
      };

      // Test 5: Try to create a test notification
      if (session.session?.user) {
        const { data: testNotif, error: createError } = await supabase
          .from('hil_notifications')
          .insert({
            user_id: session.session.user.id,
            type: 'WORKFLOW_UPDATE',
            title: 'Debug Test Notification',
            message: 'This is a test notification created for debugging',
            priority: 'NORMAL',
            metadata: { test: true, created_at: new Date().toISOString() }
          })
          .select()
          .single();
          
        results.testCreate = {
          success: !!testNotif,
          data: testNotif,
          error: createError?.message
        };
      }

    } catch (error: any) {
      results.globalError = error.message;
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Notifications Debug Page</h1>
      
      {/* Auth Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <pre className="bg-white p-3 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Button */}
      <button
        onClick={runDatabaseTests}
        disabled={isRunning}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {isRunning ? 'Running Tests...' : 'Run Database Tests'}
      </button>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <pre className="bg-white p-3 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Sign in using Google OAuth if not already signed in</li>
          <li>Click "Run Database Tests" to check notification system</li>
          <li>Review the test results to identify any issues</li>
          <li>Common issues: RLS policies, missing user profile, auth token issues</li>
        </ol>
      </div>
    </div>
  );
}