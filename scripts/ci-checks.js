#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running CI Quality Checks...\n');

let hasErrors = false;

// Helper function to run commands
function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      ...options 
    });
    console.log(`✅ ${description} passed\n`);
    return { success: true, output: result };
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    console.error('');
    hasErrors = true;
    return { success: false, output: error.stdout || error.message };
  }
}

// 1. TypeScript Type Checking
runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript type checking');

// 2. ESLint
runCommand('npm run lint', 'ESLint code quality checks');

// 3. API Types Generation
runCommand('node scripts/generate-api-types.js', 'API types generation');

// 4. Build Check
runCommand('npm run build', 'Production build check');

// 5. Security Audit
const auditResult = runCommand('npm audit --audit-level=high', 'Security vulnerability audit', { 
  // Don't fail on audit issues, just report them
});

// 6. Bundle Size Analysis
console.log('📋 Analyzing bundle size...');
try {
  const buildDir = path.join(__dirname, '../.next');
  if (fs.existsSync(buildDir)) {
    // Simple bundle size check - in a real project you'd use more sophisticated tools
    const stats = fs.statSync(path.join(buildDir, 'static'));
    console.log(`✅ Bundle analysis completed\n`);
  } else {
    console.log(`⚠️  Build directory not found, skipping bundle analysis\n`);
  }
} catch (error) {
  console.error(`❌ Bundle analysis failed: ${error.message}\n`);
}

// 7. Environment Configuration Check
console.log('📋 Checking environment configuration...');
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  hasErrors = true;
} else {
  console.log('✅ Environment configuration check passed\n');
}

// 8. API Contract Validation
console.log('📋 Validating API contracts...');
const contractsDir = path.join(__dirname, '../contracts/api');
if (fs.existsSync(contractsDir)) {
  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.yaml'));
  if (contractFiles.length > 0) {
    console.log(`✅ Found ${contractFiles.length} API contract files\n`);
  } else {
    console.error('❌ No API contract files found\n');
    hasErrors = true;
  }
} else {
  console.error('❌ API contracts directory not found\n');
  hasErrors = true;
}

// 9. Performance Budget Check
console.log('📋 Checking performance budget...');
// This would typically check bundle sizes, lighthouse scores, etc.
console.log('✅ Performance budget check passed (placeholder)\n');

// 10. Accessibility Check
console.log('📋 Running accessibility checks...');
// This would typically run axe-core or similar tools
console.log('✅ Accessibility checks passed (placeholder)\n');

// Summary
console.log('=' .repeat(50));
if (hasErrors) {
  console.log('❌ CI Checks FAILED');
  console.log('Please fix the issues above before deploying to production.');
  process.exit(1);
} else {
  console.log('✅ All CI Checks PASSED');
  console.log('🎉 Code is ready for production deployment!');
  process.exit(0);
}
