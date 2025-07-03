// Shared styles for workflow detail page
export const colors = {
  primary: '#64B6AC',
  primaryDark: '#5a9f95',
  primaryLight: '#8cc8c0',
  
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    tertiary: '#94a3b8'
  },
  
  background: {
    page: '#f8fafc',
    surface: '#ffffff',
    secondary: '#f1f5f9',
    tertiary: '#f8fafc'
  },
  
  border: {
    light: '#f1f5f9',
    default: '#e2e8f0',
    primary: '#64B6AC'
  },
  
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    neutral: '#cbd5e1'
  }
};

export const fonts = {
  main: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'Monaco, Menlo, monospace'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px'
};

export const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: colors.background.page,
    fontFamily: fonts.main,
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column' as const
  },

  header: {
    background: colors.background.surface,
    borderBottom: `1px solid ${colors.border.default}`,
    padding: `${spacing.md} ${spacing.xl}`,
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
  },

  backButton: {
    background: 'none',
    border: `1px solid ${colors.border.default}`,
    padding: `6px ${spacing.md}`,
    fontSize: '12px',
    color: colors.text.secondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    transition: 'all 0.2s ease'
  },

  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '40% 60%',
    gap: 0
  },

  panel: {
    background: colors.background.surface,
    overflowY: 'auto' as const
  },

  panelHeader: {
    padding: `${spacing.sm} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.border.light}`,
    fontWeight: '600',
    fontSize: '11px',
    color: colors.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `10px ${spacing.md}`,
    background: colors.background.surface,
    border: `1px solid ${colors.border.light}`,
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },

  taskItemActive: {
    background: colors.primaryLight,
    borderColor: colors.primary
  },

  taskItemConditional: {
    background: colors.background.tertiary,
    borderLeft: `3px solid ${colors.status.warning}`
  },

  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0
  },

  tabButton: {
    background: 'none',
    border: 'none',
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease',
    textTransform: 'capitalize' as const
  },

  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: '6px'
  },

  button: {
    primary: {
      padding: `6px ${spacing.md}`,
      fontSize: '11px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
      gap: spacing.xs,
      background: colors.primary,
      color: 'white',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
    },

    secondary: {
      padding: `6px ${spacing.md}`,
      fontSize: '11px',
      fontWeight: '500',
      border: `1px solid ${colors.border.default}`,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
      gap: spacing.xs,
      background: colors.background.surface,
      color: colors.text.secondary
    }
  }
};

export const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return colors.status.success;
    case 'awaiting-review': return colors.status.error;
    case 'pending': return colors.status.neutral;
    default: return colors.status.neutral;
  }
};

export const getSlaStatusStyle = (sla: string) => {
  switch (sla) {
    case 'ON TIME':
      return { color: colors.status.success, background: '#f0fdf4' };
    case 'LATE':
      return { color: colors.status.error, background: '#fef2f2' };
    case 'DUE SOON':
      return { color: colors.status.warning, background: '#fffbeb' };
    default:
      return { color: colors.text.tertiary, background: 'transparent' };
  }
};