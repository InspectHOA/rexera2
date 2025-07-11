#!/usr/bin/env tsx

/**
 * Console Statement Cleanup Utility
 * 
 * Purpose: Remove console.* statements from TypeScript/JavaScript files
 * Usage: tsx scripts/utils/cleanup-console.ts
 * Requirements: Run from project root directory
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function cleanupConsoleStatements(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Remove console.log statements (multiline and single line)
  content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
  content = content.replace(/console\.error\([^)]*\);?\s*/g, '');
  content = content.replace(/console\.warn\([^)]*\);?\s*/g, '');
  content = content.replace(/console\.info\([^)]*\);?\s*/g, '');
  
  // Handle multiline console statements
  content = content.replace(/console\.(log|error|warn|info)\(\s*[^)]*\n[^)]*\);?\s*/g, '');
  
  // Clean up empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== originalContent) {
    writeFileSync(filePath, content);
    console.log(`Cleaned: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dirPath: string): number {
  const files = readdirSync(dirPath);
  let cleaned = 0;
  
  for (const file of files) {
    const fullPath = join(dirPath, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      cleaned += processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (cleanupConsoleStatements(fullPath)) {
        cleaned++;
      }
    }
  }
  
  return cleaned;
}

async function main() {
  try {
    console.log('🧹 Cleaning up console statements...');
    const cleaned = processDirectory('./frontend/src');
    console.log(`✅ Cleaned ${cleaned} files`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}