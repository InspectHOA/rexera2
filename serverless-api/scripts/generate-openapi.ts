#!/usr/bin/env tsx

/**
 * OpenAPI Specification Generator
 * 
 * Automatically generates OpenAPI spec from Hono route definitions
 * Run with: pnpm openapi:generate
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

async function generateOpenAPISpec() {
  try {
    // Load environment variables
    config();
    
    // Set mock environment variables for OpenAPI generation
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = 'https://mock.supabase.co';
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
    }
    
    console.log('🔄 Generating OpenAPI specification...');

    // Import and use our comprehensive OpenAPI spec
    const { buildOpenApiSpec } = await import('../src/schemas/openapi/index.js');
    const spec = buildOpenApiSpec();

    // Ensure the output directory exists
    const outputDir = join(process.cwd(), 'generated');
    await fs.mkdir(outputDir, { recursive: true });

    // Write the spec to file
    const outputPath = join(outputDir, 'openapi.json');
    await fs.writeFile(outputPath, JSON.stringify(spec, null, 2));

    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Routes: ${Object.keys(spec.paths || {}).length}`);
    console.log(`🏷️  Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
    
    // Also generate a TypeScript version for type safety
    const tsOutputPath = join(outputDir, 'openapi.ts');
    const tsContent = `// Auto-generated OpenAPI specification
// Generated at: ${new Date().toISOString()}
// Do not edit manually - run 'pnpm openapi:generate' to regenerate

export const openApiSpec = ${JSON.stringify(spec, null, 2)} as const;

export type OpenAPISpec = typeof openApiSpec;
`;
    
    await fs.writeFile(tsOutputPath, tsContent);
    console.log(`📝 TypeScript types: ${tsOutputPath}`);

  } catch (error) {
    console.error('❌ Failed to generate OpenAPI specification:', error);
    process.exit(1);
  }
}

// Run if called directly
generateOpenAPISpec();

export { generateOpenAPISpec };