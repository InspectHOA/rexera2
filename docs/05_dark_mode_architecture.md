# Dark Mode Architecture Proposal

This document outlines the architecture for implementing a dark mode feature in the Rexera 2.0 frontend.

## 1. Overview

The goal is to allow users to switch between light and dark themes and to persist their choice. The implementation will leverage the existing `next-themes` library and the `user_preferences` table in the database.

## 2. Architecture

### 2.1. Theme Toggling

A theme-switcher component will be created to allow users to toggle between "Light", "Dark", and "System" modes. This component will use the `useTheme` hook from `next-themes` to change the theme.

### 2.2. Persistence

The user's theme preference will be persisted in two ways:

1.  **Local Storage**: `next-themes` will automatically persist the theme in the user's local storage. This ensures the theme is immediately applied on subsequent visits.
2.  **Database**: The user's preference will be saved to the `theme` column in the `user_preferences` table. This allows the preference to be synced across devices.

### 2.3. Integration

The existing `ThemeProvider` component, which wraps the `NextThemesProvider`, will be used to provide the theme context to the application. The `tailwind.config.js` file is already configured for dark mode with the `darkMode: ["class"]` setting. The CSS variables in `globals.css` for the `.dark` class will be used for styling.

### 2.4. Database Schema

The `user_preferences` table already has a `theme` column that can be used to store the user's preference. No database schema changes are required.

### 2.5. Component Modifications

The following components will be created or modified:

-   **`ThemeSwitcher` (New)**: A new component that allows the user to select a theme. This will likely be a dropdown menu with "Light", "Dark", and "System" options.
-   **`Header` (Modification)**: The `Header` component will be modified to include the `ThemeSwitcher` component.
-   **`useUserPreferences` hook (New)**: A new hook will be created to fetch and update the user's theme preference in the database.

## 3. Implementation Plan

1.  **Create the `ThemeSwitcher` component**: This component will use the `useTheme` hook to change the theme.
2.  **Create the `useUserPreferences` hook**: This hook will handle fetching and updating the user's theme preference in the `user_preferences` table.
3.  **Integrate the `ThemeSwitcher` into the `Header`**: The `ThemeSwitcher` will be added to the application's header.
4.  **Update the `ThemeProvider`**: The `ThemeProvider` will be updated to use the `useUserPreferences` hook to set the initial theme from the database.

## 4. Mermaid Diagram

```mermaid
sequenceDiagram
    participant User
    participant ThemeSwitcher
    participant NextThemes
    participant Database

    User->>ThemeSwitcher: Selects "Dark" theme
    ThemeSwitcher->>NextThemes: setTheme('dark')
    NextThemes->>User: Applies dark theme to UI
    NextThemes-->>Browser: Saves theme to local storage
    ThemeSwitcher->>Database: Updates user_preferences.theme to 'dark'