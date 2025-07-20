/**
 * Dark Mode Audit and Migration Utility
 * 
 * This utility helps identify and fix hardcoded colors that need to be 
 * replaced with CSS variables for dark mode support.
 */

export const HARDCODED_COLORS_TO_REPLACE = {
  // Background colors
  'bg-white': 'bg-card',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-muted',
  'bg-blue-50': 'bg-primary/5',
  'bg-blue-100': 'bg-primary/10',
  'bg-red-50': 'bg-destructive/10',
  'bg-green-50': 'bg-green-50 dark:bg-green-950',
  'bg-yellow-50': 'bg-yellow-50 dark:bg-yellow-950',
  'bg-orange-50': 'bg-orange-50 dark:bg-orange-950',

  // Text colors
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-300': 'text-muted-foreground',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-blue-700': 'text-blue-700 dark:text-blue-300',
  'text-green-600': 'text-green-600 dark:text-green-400',
  'text-green-700': 'text-green-700 dark:text-green-300',
  'text-red-600': 'text-destructive',
  'text-red-700': 'text-destructive',
  'text-orange-600': 'text-orange-600 dark:text-orange-400',
  'text-yellow-600': 'text-yellow-600 dark:text-yellow-400',

  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-100': 'border-border',
  'border-blue-200': 'border-primary/20',
  'border-red-200': 'border-destructive/20',

  // Hover states
  'hover:bg-gray-50': 'hover:bg-muted/50',
  'hover:bg-gray-100': 'hover:bg-muted',
  'hover:bg-blue-50': 'hover:bg-primary/10',
  'hover:text-gray-700': 'hover:text-foreground',
  'hover:text-gray-900': 'hover:text-foreground',

  // Button colors
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary',
  'hover:bg-blue-700': 'hover:bg-primary/90',
  'text-white': 'text-primary-foreground',
};

export const DARK_MODE_UTILITY_CLASSES = {
  // Background utilities
  'dm-bg': 'bg-background',
  'dm-bg-card': 'bg-card',
  'dm-bg-muted': 'bg-muted',
  'dm-bg-primary': 'bg-primary text-primary-foreground',
  'dm-bg-destructive': 'bg-destructive text-destructive-foreground',

  // Text utilities
  'dm-text': 'text-foreground',
  'dm-text-muted': 'text-muted-foreground',

  // Border utilities
  'dm-border': 'border-border',

  // Interactive utilities
  'dm-hover': 'hover:bg-muted/50',
  'dm-focus': 'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',

  // Component patterns
  'dm-panel': 'bg-card border border-border shadow-sm rounded-lg',
  'dm-button-primary': 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
  'dm-button-secondary': 'bg-muted text-muted-foreground hover:bg-muted/80 transition-colors',
  'dm-button-ghost': 'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
  'dm-input': 'bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-ring',
  'dm-modal': 'bg-card border border-border shadow-xl rounded-lg',
  'dm-list-item': 'hover:bg-muted/50 cursor-pointer transition-colors',
  'dm-list-item-selected': 'bg-primary/10 border-primary/20',
};

/**
 * Generate a migration guide for converting hardcoded colors to dark mode
 */
export function generateMigrationGuide(componentPath: string): string {
  return `
# Dark Mode Migration Guide for ${componentPath}

## Quick Replacements

Replace these hardcoded colors with CSS variables:

${Object.entries(HARDCODED_COLORS_TO_REPLACE)
  .map(([old, replacement]) => `- \`${old}\` → \`${replacement}\``)
  .join('\n')}

## Utility Classes Available

Use these pre-built utility classes for common patterns:

${Object.entries(DARK_MODE_UTILITY_CLASSES)
  .map(([className, description]) => `- \`${className}\`: ${description}`)
  .join('\n')}

## Component-Specific Patterns

### For Email/Communication Interfaces:
- \`dm-email-thread\`: Thread list container
- \`dm-email-header\`: Email header sections
- \`dm-email-item\`: Individual email items
- \`dm-email-item-selected\`: Selected email state
- \`dm-avatar-inbound\`: Inbound message avatars
- \`dm-avatar-outbound\`: Outbound message avatars

### For Forms:
- \`dm-input\`: Input fields
- \`dm-select\`: Select dropdowns
- \`dm-button-primary\`: Primary buttons
- \`dm-button-secondary\`: Secondary buttons
- \`dm-button-ghost\`: Ghost buttons

### For Data Display:
- \`dm-panel\`: Panel containers
- \`dm-list-item\`: List items
- \`dm-list-item-selected\`: Selected states
- \`dm-modal\`: Modal dialogs

## Testing

After applying changes:
1. Test in both light and dark modes
2. Check hover and focus states
3. Verify accessibility contrast ratios
4. Ensure consistency with dashboard
`;
}

/**
 * Common patterns for different component types
 */
export const COMPONENT_PATTERNS = {
  modal: {
    container: 'dm-modal',
    header: 'dm-text border-b dm-border',
    body: 'dm-text',
    footer: 'border-t dm-border',
  },
  
  form: {
    label: 'dm-text text-sm font-medium',
    input: 'dm-input',
    button: 'dm-button-primary',
    error: 'text-destructive text-sm',
  },
  
  list: {
    container: 'dm-panel',
    item: 'dm-list-item',
    itemSelected: 'dm-list-item-selected',
    header: 'dm-text font-medium',
    description: 'dm-text-muted text-sm',
  },
  
  email: {
    threadList: 'dm-email-thread',
    threadItem: 'dm-email-item',
    threadItemSelected: 'dm-email-item-selected',
    content: 'dm-email-content',
    inbound: 'dm-email-inbound',
    outbound: 'dm-email-outbound',
  }
};