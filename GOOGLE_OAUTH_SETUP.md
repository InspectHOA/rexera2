# Google OAuth Setup for Rexera

This document provides step-by-step instructions to configure Google OAuth authentication for the Rexera application.

## Prerequisites

- Supabase project set up and running
- Access to Google Cloud Console
- Vercel deployment URL (e.g., `https://rexera2-frontend-git-main-rexera.vercel.app`)

## Step 1: Configure Google OAuth in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`
     - `https://rexera2-frontend-git-main-rexera.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)
   - Save the Client ID and Client Secret

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click to configure
4. Enable Google provider
5. Enter the Client ID and Client Secret from Step 1
6. Set the redirect URL to: `https://your-supabase-project.supabase.co/auth/v1/callback`
7. Save the configuration

## Step 3: Update Environment Variables

Add the following environment variables to your Vercel deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 4: Test the Authentication Flow

1. Deploy the updated code to Vercel
2. Visit your Vercel URL
3. You should be redirected to `/auth/login`
4. Click "Continue with Google"
5. Complete the Google OAuth flow
6. You should be redirected back to `/dashboard`

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Ensure all redirect URIs are correctly configured in Google Cloud Console
   - Check that the Supabase redirect URL matches exactly

2. **"Invalid client" error**
   - Verify Client ID and Client Secret are correctly entered in Supabase
   - Ensure the Google+ API is enabled

3. **User not redirected after login**
   - Check browser console for JavaScript errors
   - Verify the auth callback page is working correctly

### Environment-Specific URLs:

- **Production**: `https://rexera2-frontend-git-main-rexera.vercel.app`
- **Supabase**: `https://your-supabase-project.supabase.co`
- **Local Development**: `http://localhost:3000`

## Security Notes

- Never expose Client Secret in frontend code
- Use environment variables for all sensitive configuration
- Regularly rotate OAuth credentials
- Monitor authentication logs in Supabase dashboard

## Next Steps

After successful authentication setup:

1. Users will be automatically created in the `auth.users` table
2. User profiles can be created in the `user_profiles` table
3. Implement role-based access control as needed
4. Add additional OAuth providers if required

## Support

If you encounter issues:
1. Check Supabase authentication logs
2. Verify Google Cloud Console configuration
3. Test with different browsers/incognito mode
4. Review Vercel deployment logs