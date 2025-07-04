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
    <div
      className="header"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '12px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
    >
      <div
        className="logo"
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <img
          src="/rexera-logo.svg"
          alt="Rexera Logo"
          style={{
            height: '24px',
            width: 'auto'
          }}
        />
        Rexera HIL Dashboard
      </div>
      
      <div
        className="user-info"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}
      >
        <div
          className="notification-badge"
          style={{
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        >
          3
        </div>
        <span>{getDisplayName()}</span>
        <div
          className="user-avatar"
          style={{
            width: '32px',
            height: '32px',
            background: getAvatarUrl() ? 'transparent' : 'linear-gradient(135deg, #8cc8c0, #64B6AC)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '12px',
            backgroundImage: getAvatarUrl() ? `url(${getAvatarUrl()})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer'
          }}
          onClick={handleSignOut}
          title="Click to sign out"
        >
          {!getAvatarUrl() && getInitials()}
        </div>
      </div>
    </div>
  );
}