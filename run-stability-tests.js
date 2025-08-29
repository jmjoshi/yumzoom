#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Running Production Readiness Tests...\n');

const tests = [
  {
    name: 'Error Handling Tests',
    command: 'npx jest __tests__/error-handling.test.ts --verbose',
  },
  {
    name: 'ErrorBoundary Tests', 
    command: 'npx jest __tests__/ErrorBoundary.test.tsx --verbose',
  },
  {
    name: 'API Tests',
    command: 'npx jest __tests__/api/restaurants.test.ts --verbose',
  },
  {
    name: 'TypeScript Compilation (Test Files)',
    command: 'npx tsc --noEmit --project tsconfig.test.json',
  },
];

let allPassed = true;

for (const test of tests) {
  console.log(`\n📋 Running: ${test.name}`);
  console.log('='.repeat(50));
  
  try {
    const output = execSync(test.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('✅ PASSED');
    if (output.trim()) {
      console.log('Output:', output.trim());
    }
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
    if (error.stdout) {
      console.log('Stdout:', error.stdout);
    }
    if (error.stderr) {
      console.log('Stderr:', error.stderr);
    }
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('🎉 All tests PASSED! Section 3.1 Application Stability: COMPLETE');
  process.exit(0);
} else {
  console.log('💥 Some tests FAILED! Please review the errors above.');
  process.exit(1);
}
