import { colors, spacing, fonts } from './workflow-detail';

export const fileUploadStyles = {
  container: {
    width: '100%'
  },

  uploadArea: {
    border: `2px dashed ${colors.border.default}`,
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
    backgroundColor: colors.background.secondary,
    cursor: 'pointer'
  },

  uploadAreaHover: {
    borderColor: colors.border.primary,
    backgroundColor: colors.background.tertiary
  },

  uploadAreaUploading: {
    cursor: 'not-allowed',
    backgroundColor: colors.background.tertiary
  },

  uploadIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 16px',
    backgroundColor: colors.border.default,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text.secondary
  },

  spinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${colors.border.default}`,
    borderTop: `3px solid ${colors.primary}`,
    borderRadius: '50%',
    margin: '0 auto 16px'
  },

  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: colors.border.default,
    borderRadius: '2px',
    overflow: 'hidden',
    margin: '8px 0'
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    transition: 'width 0.3s ease'
  },

  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text.primary,
    margin: '0 0 8px',
    fontFamily: fonts.main
  },

  subtitle: {
    fontSize: '14px',
    color: colors.text.secondary,
    margin: '0 0 16px',
    fontFamily: fonts.main
  },

  hint: {
    fontSize: '12px',
    color: colors.text.tertiary,
    margin: '0',
    fontFamily: fonts.main
  },

  error: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.error + '10',
    border: `1px solid ${colors.status.error}30`,
    borderRadius: '6px',
    color: colors.status.error,
    fontSize: '14px',
    fontFamily: fonts.main
  },

  uploadProgress: {
    color: colors.text.secondary,
    fontSize: '14px',
    margin: '8px 0',
    fontFamily: fonts.main
  }
};

export const documentListStyles = {
  container: {
    display: 'grid',
    gap: spacing.md
  },

  documentItem: {
    display: 'flex',
    alignItems: 'center',
    padding: spacing.md,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '6px',
    backgroundColor: colors.background.surface,
    gap: spacing.md
  },

  fileIcon: {
    fontSize: '24px'
  },

  fileInfo: {
    flex: 1,
    minWidth: 0
  },

  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.text.primary,
    margin: '0 0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontFamily: fonts.main
  },

  fileMeta: {
    fontSize: '12px',
    color: colors.text.secondary,
    margin: '0',
    fontFamily: fonts.main
  },

  actions: {
    display: 'flex',
    gap: spacing.sm
  },

  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'opacity 0.2s ease',
    fontFamily: fonts.main
  },

  downloadButton: {
    backgroundColor: colors.primary,
    color: 'white'
  },

  deleteButton: {
    backgroundColor: colors.status.error,
    color: 'white'
  },

  loadingContainer: {
    padding: '20px',
    textAlign: 'center' as const
  },

  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: `2px solid ${colors.border.default}`,
    borderTop: `2px solid ${colors.primary}`,
    borderRadius: '50%',
    margin: '0 auto'
  },

  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontFamily: fonts.main
  },

  emptyState: {
    padding: '32px',
    textAlign: 'center' as const,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '8px',
    backgroundColor: colors.background.secondary,
    fontFamily: fonts.main
  },

  error: {
    padding: spacing.md,
    backgroundColor: colors.status.error + '10',
    border: `1px solid ${colors.status.error}30`,
    borderRadius: '6px',
    color: colors.status.error,
    fontFamily: fonts.main
  }
};