#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function cleanupConsoleStatements(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
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
    fs.writeFileSync(filePath, content);
    console.log(`Cleaned: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let cleaned = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
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

console.log('🧹 Cleaning up console statements...');
const cleaned = processDirectory('./frontend/src');
console.log(`✅ Cleaned ${cleaned} files`);