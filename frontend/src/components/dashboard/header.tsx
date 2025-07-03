'use client';

import { Bell, Search, Settings, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/provider';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-500 text-white font-semibold text-sm">
              R
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Rexera HIL Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows, clients..."
              className="w-64 rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              3
            </span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-xs text-gray-500">
                {profile?.role}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-medium text-sm">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 
               user?.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}