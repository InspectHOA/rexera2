'use client';

import { useAuth } from '@/lib/auth/provider';

export function DashboardHeader() {
  const { user, profile, signOut } = useAuth();

  // Get user display name from Google OAuth data or profile
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'User' || name.includes('@')) {
      return user?.email?.charAt(0).toUpperCase() || 'U';
    }
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user avatar URL from Google OAuth
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border border-gray-200 p-3 mb-5 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary-500 flex items-center justify-center text-white font-semibold text-xs">
          R
        </div>
        <span className="text-lg font-semibold text-gray-900">Rexera HIL Dashboard</span>
      </div>
      
      <div className="flex items-center gap-3 text-sm">
        <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shadow-sm">
          3
        </div>
        <span className="text-gray-700">{getDisplayName()}</span>
        <button
          onClick={handleSignOut}
          title="Click to sign out"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: getAvatarUrl() ? 'transparent' : 'linear-gradient(135deg, #8cc8c0, #64B6AC)',
            backgroundImage: getAvatarUrl() ? `url(${getAvatarUrl()})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!getAvatarUrl() && getInitials()}
        </button>
      </div>
    </header>
  );
}