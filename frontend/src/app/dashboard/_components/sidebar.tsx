'use client';

import { 
  BarChart3, 
  Bot, 
  FileText, 
  Home, 
  MessageSquare, 
  Settings, 
  Users, 
  Workflow 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Route } from 'next';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' as const, icon: Home },
  { name: 'Workflows', href: '/dashboard/workflows' as const, icon: Workflow },
  { name: 'Tasks', href: '/dashboard/tasks' as const, icon: FileText },
  { name: 'Agents', href: '/dashboard/agents' as const, icon: Bot },
  { name: 'Communications', href: '/dashboard/communications' as const, icon: MessageSquare },
  { name: 'Reports', href: '/dashboard/reports' as const, icon: BarChart3 },
  { name: 'Clients', href: '/dashboard/clients' as const, icon: Users },
  { name: 'Settings', href: '/dashboard/settings' as const, icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href as Route}
                className={cn(
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center border-l-4 px-3 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}