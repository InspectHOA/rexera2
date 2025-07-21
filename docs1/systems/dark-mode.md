# Dark Mode System

## Overview

User-configurable dark/light theme system with automatic persistence across devices and sessions.

## Architecture

**Theme Options:**
- **Light**: Default light theme
- **Dark**: Dark theme with adjusted colors  
- **System**: Follows OS preference

## Implementation

**Frontend Setup:**
- `next-themes` library for theme management
- Tailwind CSS with `darkMode: ["class"]` 
- CSS variables for color switching
- Theme persistence in localStorage + database

**Theme Provider:**
```typescript
// App-level theme context
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Theme Switcher Component:**
```typescript
// Theme toggle in header
<ThemeToggle />
```

## Persistence

**Dual Persistence Strategy:**

1. **Local Storage** (immediate)
   - `next-themes` auto-saves preference
   - Instant theme application on page load

2. **Database** (cross-device sync)
   - Saved to `user_preferences.theme`
   - Syncs preference across devices
   - Loaded on first login

## Styling System

**CSS Variables:**
```css
/* Light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
}

/* Dark mode */
.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
}
```

**Tailwind Classes:**
- Use semantic classes: `bg-background`, `text-foreground`
- Dark variants: `dark:bg-gray-800`, `dark:text-white`
- Avoid hardcoded colors

## Component Integration

**Theme-Aware Components:**
- All components support both themes
- Use Tailwind dark: variants
- Color variables for consistent theming

**Theme Detection:**
```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
```

## User Experience

**Automatic Features:**
- Theme persists across browser sessions
- Syncs across devices when logged in
- Respects system preference when set to "System"
- Smooth transitions between themes

**Manual Control:**
- Theme switcher in application header
- Instant preview of theme changes
- No page reload required