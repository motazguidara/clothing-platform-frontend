#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contractsDir = path.join(__dirname, '../contracts/api');
const outputDir = path.join(__dirname, '../src/lib/api/generated');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// List of OpenAPI spec files
const specs = [
  { name: 'catalog', file: 'catalog.openapi.yaml' },
  { name: 'auth', file: 'auth.openapi.yaml' },
  { name: 'orders', file: 'orders.openapi.yaml' }
];

console.log('🔄 Generating TypeScript types from OpenAPI specifications...\n');

specs.forEach(({ name, file }) => {
  const specPath = path.join(contractsDir, file);
  const outputPath = path.join(outputDir, `${name}.ts`);
  
  console.log(`📝 Processing ${file}...`);
  
  try {
    // Generate TypeScript types using openapi-typescript
    execSync(`npx openapi-typescript "${specPath}" -o "${outputPath}"`, {
      stdio: 'inherit'
    });
    
    console.log(`✅ Generated types for ${name} API\n`);
  } catch (error) {
    console.error(`❌ Failed to generate types for ${name}:`, error.message);
    process.exit(1);
  }
});

console.log('🎉 All API types generated successfully!');
console.log(`📁 Types available in: ${outputDir}`);
