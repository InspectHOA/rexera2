import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono();

// Predefined document tags for real estate workflows
const PREDEFINED_TAGS = [
  // Document Types
  'contract',
  'deed',
  'title',
  'insurance',
  'inspection',
  'appraisal',
  'survey',
  'disclosure',
  'amendment',
  'addendum',
  'closing',
  'escrow',
  'resale-cert',
  'lender-q',
  'hoa-docs',
  'ccnrs',
  
  // Document Status
  'draft',
  'review',
  'approved',
  'signed',
  'executed',
  'final',
  
  // Process Stage
  'pre-approval',
  'listing',
  'offer',
  'under-contract',
  'due-diligence',
  'financing',
  'closing-prep',
  'post-closing',
  
  // Priority/Urgency
  'urgent',
  'high-priority',
  'time-sensitive',
  
  // Client Communication
  'client-review',
  'client-signature',
  'client-copy',
  
  // Legal/Compliance
  'legal-review',
  'compliance',
  'regulatory',
  'notarized'
].sort(); // Sort alphabetically for consistent ordering

// Response schema
const TagsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.string()),
  count: z.number()
});

// Get all predefined tags
app.get('/', (c) => {
  return c.json({
    success: true,
    data: PREDEFINED_TAGS,
    count: PREDEFINED_TAGS.length
  });
});

// Search tags (for autocomplete)
app.get('/search', (c) => {
  const q = c.req.query('q');
  
  if (!q || q.length === 0 || q.length > 50) {
    return c.json({
      success: false,
      error: 'Query parameter "q" is required and must be 1-50 characters'
    }, 400);
  }
  
  const filteredTags = PREDEFINED_TAGS.filter(tag => 
    tag.toLowerCase().includes(q.toLowerCase())
  );
  
  return c.json({
    success: true,
    data: filteredTags,
    count: filteredTags.length
  });
});

export { app as tagsRoutes, PREDEFINED_TAGS };
export type TagsResponse = z.infer<typeof TagsResponseSchema>;