module.exports = {
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    node: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-undef': 'off',
    
    // Prevent raw Supabase database operations - use type-safe functions instead
    'no-restricted-syntax': [
      'error',
      {
        'selector': 'CallExpression[callee.type="MemberExpression"][callee.property.name="from"][callee.object.name=/^supabase$/i]',
        'message': 'Direct supabase.from() calls are forbidden. Use type-safe functions from utils/type-safe-db.ts instead.'
      },
      {
        'selector': 'CallExpression[callee.type="MemberExpression"][callee.property.name="insert"]',
        'message': 'Direct .insert() calls are forbidden in business logic. Use type-safe functions from utils/type-safe-db.ts instead.'
      },
      {
        'selector': 'CallExpression[callee.type="MemberExpression"][callee.property.name="update"]',
        'message': 'Direct .update() calls are forbidden in business logic. Use type-safe functions from utils/type-safe-db.ts instead.'
      },
      {
        'selector': 'CallExpression[callee.type="MemberExpression"][callee.property.name="delete"]',
        'message': 'Direct .delete() calls are forbidden in business logic. Use type-safe functions from utils/type-safe-db.ts instead.'
      }
    ]
  },
  ignorePatterns: [
    'dist/',
    '.vercel/',
    'coverage/',
    'node_modules/'
  ],
  overrides: [
    {
      // Allow raw Supabase operations in test utilities and build scripts where they're necessary
      files: [
        'tests/**/*',
        'scripts/**/*'
      ],
      rules: {
        'no-restricted-syntax': 'off'
      }
    }
  ]
};