'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';

function ThemeSync() {
  const { setTheme, theme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);

  // Fetch theme from database on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchTheme() {
      try {
        const res = await fetch('/api/user/preferences');
        const data = await res.json();
        
        if (isMounted && data.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
      } catch (error) {
        console.warn('Failed to fetch theme preference:', error);
        // Gracefully degrade - use local storage/system preference
      } finally {
        if (isMounted) {
          setHasLoadedFromDB(true);
          setIsInitialized(true);
        }
      }
    }

    fetchTheme();

    return () => {
      isMounted = false;
    };
  }, [setTheme, theme]);

  // Save theme to database when it changes (but not on initial load)
  const saveTheme = useCallback(async (themeToSave: string) => {
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: themeToSave }),
      });
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      // Gracefully degrade - theme will still work locally
    }
  }, []);

  useEffect(() => {
    // Only save to database after initial load to prevent race conditions
    if (isInitialized && hasLoadedFromDB && theme) {
      saveTheme(theme);
    }
  }, [theme, isInitialized, hasLoadedFromDB, saveTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}