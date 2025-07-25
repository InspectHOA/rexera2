/**
 * Test fixtures for counterparties
 */

import type { CreateCounterpartySchema } from '@rexera/shared';
import { z } from 'zod';

export const validCounterpartyFixtures = {
  hoa: {
    name: 'Test HOA Association',
    type: 'hoa' as const,
    email: 'contact@testhoa.com',
    phone: '555-0123',
    address: '123 Main St, Test City, TS 12345',
    notes: 'Test HOA for integration testing'
  },
  lender: {
    name: 'Test Bank & Trust',
    type: 'lender' as const,
    email: 'loans@testbank.com',
    phone: '555-0456',
    address: '456 Bank Ave, Test City, TS 12345',
    notes: 'Test lender for integration testing'
  },
  municipality: {
    name: 'Test City Municipality',
    type: 'municipality' as const,
    email: 'admin@testcity.gov',
    phone: '555-0789',
    address: '789 City Hall Dr, Test City, TS 12345',
    notes: 'Test municipality for integration testing'
  },
  utility: {
    name: 'Test Electric Company',
    type: 'utility' as const,
    email: 'service@testelectric.com',
    phone: '555-0321',
    address: '321 Power St, Test City, TS 12345',
    notes: 'Test utility for integration testing'
  },
  taxAuthority: {
    name: 'Test County Tax Office',
    type: 'tax_authority' as const,
    email: 'tax@testcounty.gov',
    phone: '555-0654',
    address: '654 Tax Office Blvd, Test City, TS 12345',
    notes: 'Test tax authority for integration testing'
  }
};

export const invalidCounterpartyFixtures = {
  missingName: {
    type: 'hoa' as const,
    email: 'contact@example.com'
  },
  missingType: {
    name: 'Test Company',
    email: 'contact@example.com'
  },
  invalidType: {
    name: 'Test Company',
    type: 'invalid_type',
    email: 'contact@example.com'
  },
  invalidEmail: {
    name: 'Test Company',
    type: 'hoa' as const,
    email: 'not-an-email'
  },
  tooLongName: {
    name: 'A'.repeat(256),
    type: 'hoa' as const,
    email: 'contact@example.com'
  }
};

export const updateCounterpartyFixtures = {
  validUpdate: {
    name: 'Updated Test Company',
    email: 'updated@example.com',
    phone: '555-9999'
  },
  invalidUpdate: {
    type: 'invalid_type',
    email: 'not-an-email'
  }
};

export const searchFixtures = {
  validSearches: [
    { q: 'Test', type: 'hoa', limit: 10 },
    { q: 'Bank', type: 'lender', limit: 5 },
    { q: 'City', limit: 20 },
    { q: 'Electric' }
  ],
  invalidSearches: [
    { q: '', type: 'hoa' }, // Empty query
    { q: 'Test', type: 'invalid_type' }, // Invalid type
    { q: 'Test', limit: -1 }, // Invalid limit
    { q: 'Test', limit: 101 } // Limit too high
  ]
};

export const filterFixtures = {
  validFilters: [
    { type: 'hoa', page: 1, limit: 10, sort: 'name', order: 'asc' as const },
    { search: 'Test', page: 2, limit: 5, sort: 'created_at', order: 'desc' as const },
    { include: 'workflows' as const },
    { type: 'lender', search: 'Bank', include: 'workflows' as const }
  ],
  invalidFilters: [
    { type: 'invalid_type' },
    { page: 0 },
    { page: -1 },
    { limit: 0 },
    { limit: 101 },
    { sort: 'invalid_field' },
    { order: 'invalid_order' }
  ]
};