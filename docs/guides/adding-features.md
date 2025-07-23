# Adding Features

## Step-by-Step Workflow

### 1. Database Changes (if needed)

**Add to migration file:**
```sql
-- /supabase/migrations/xxx_feature_name.sql
ALTER TABLE workflows ADD COLUMN new_field TEXT;
```

**Update shared types:**
```typescript
// /packages/shared/src/types/database.ts
// Types auto-generated from schema
```

### 2. Backend API (if needed)

**Create route:**
```typescript
// /serverless-api/src/routes/my-feature.ts
import { Hono } from 'hono';

const myFeature = new Hono();

myFeature.get('/', async (c) => {
  // Implementation
});

export { myFeature };
```

**Export route:**
```typescript
// /serverless-api/src/routes/index.ts
export { myFeature } from './my-feature';
```

**Mount in app:**
```typescript
// /serverless-api/src/app.ts
import { myFeature } from './routes';
app.route('/api/my-feature', myFeature);
```

### 3. Add Validation

**Create Zod schema:**
```typescript
// /packages/shared/src/schemas/myFeature.ts
export const MyFeatureSchema = z.object({
  field: z.string(),
  // ...
});
```

**Export from shared:**
```typescript
// /packages/shared/src/index.ts
export * from './schemas/myFeature';
```

### 4. Frontend Components

**Create component:**
```typescript
// /frontend/src/components/my-feature/MyComponent.tsx
'use client';

export function MyComponent() {
  // Implementation with TypeScript + shared types
}
```

**Add to page:**
```typescript
// /frontend/src/app/my-page/page.tsx
import { MyComponent } from '@/components/my-feature/MyComponent';
```

### 5. Add Documentation

**OpenAPI (if API endpoint):**
```typescript
// /serverless-api/src/schemas/openapi/paths.ts
'/api/my-feature': {
  get: {
    summary: 'Description',
    // ...
  }
}
```

### 6. Testing

```bash
# Type checking
pnpm type-check

# Linting  
pnpm lint

# Tests
pnpm test
```

## Common Patterns

### Real-time Updates
```typescript
// Supabase subscription
useEffect(() => {
  const subscription = supabase
    .channel('my-feature')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'my_table' }, 
       (payload) => { /* handle update */ })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

### API Client
```typescript
// /frontend/src/lib/api/my-feature.ts
export const myFeatureApi = {
  async list() {
    const response = await fetch('/api/my-feature');
    return response.json();
  }
};
```

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
  // Don't throw - show user-friendly error
}
```

## Checklist

- [ ] Database schema updated
- [ ] Shared types exported  
- [ ] API endpoints documented
- [ ] Frontend components created
- [ ] Real-time subscriptions (if needed)
- [ ] Error handling implemented
- [ ] Type checking passes
- [ ] Code review ready