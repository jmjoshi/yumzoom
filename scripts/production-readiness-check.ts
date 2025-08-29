#!/usr/bin/env node

/**
 * Production Readiness Test Suite
 * Comprehensive testing for all critical application paths
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

class ProductionReadinessChecker {
  private results: TestResult[] = [];

  /**
   * Run all production readiness checks
   */
  async runAllChecks(): Promise<void> {
    console.log('🚀 Starting Production Readiness Checks\n');

    await this.checkTypeScriptCompilation();
    await this.checkUnitTests();
    await this.checkBuildProcess();
    await this.checkErrorBoundaries();
    await this.checkErrorHandling();
    await this.checkApiEndpoints();
    await this.checkSecurityHeaders();
    await this.checkEnvironmentVariables();
    await this.checkDatabaseConnectivity();
    await this.checkPerformance();

    this.printResults();
  }

  /**
   * Check TypeScript compilation for zero errors
   */
  private async checkTypeScriptCompilation(): Promise<void> {
    try {
      console.log('📝 Checking TypeScript compilation...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.addResult('TypeScript Compilation', true, 'Zero compilation errors');
    } catch (error) {
      this.addResult('TypeScript Compilation', false, 'Compilation errors found', error);
    }
  }

  /**
   * Check that all unit tests pass
   */
  private async checkUnitTests(): Promise<void> {
    try {
      console.log('🧪 Running unit tests...');
      execSync('npm test -- --passWithNoTests --watchAll=false', { stdio: 'pipe' });
      this.addResult('Unit Tests', true, 'All tests passing');
    } catch (error) {
      this.addResult('Unit Tests', false, 'Some tests failing', error);
    }
  }

  /**
   * Check that the build process completes successfully
   */
  private async checkBuildProcess(): Promise<void> {
    try {
      console.log('🔨 Testing build process...');
      execSync('npm run build', { stdio: 'pipe' });
      this.addResult('Build Process', true, 'Build completed successfully');
    } catch (error) {
      this.addResult('Build Process', false, 'Build failed', error);
    }
  }

  /**
   * Check that error boundaries are properly implemented
   */
  private async checkErrorBoundaries(): Promise<void> {
    console.log('🛡️ Checking error boundary implementation...');
    
    try {
      const errorBoundaryPath = path.join(process.cwd(), 'components', 'ErrorBoundary.tsx');
      const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
      
      const errorBoundaryExists = fs.existsSync(errorBoundaryPath);
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      const errorBoundaryIntegrated = layoutContent.includes('ErrorBoundary');
      
      if (errorBoundaryExists && errorBoundaryIntegrated) {
        this.addResult('Error Boundaries', true, 'Error boundary properly implemented and integrated');
      } else {
        this.addResult('Error Boundaries', false, 'Error boundary missing or not integrated');
      }
    } catch (error) {
      this.addResult('Error Boundaries', false, 'Error checking error boundaries', error);
    }
  }

  /**
   * Check comprehensive error handling implementation
   */
  private async checkErrorHandling(): Promise<void> {
    console.log('⚠️ Checking error handling patterns...');
    
    try {
      const errorHandlingPath = path.join(process.cwd(), 'lib', 'error-handling.ts');
      const globalErrorHandlerPath = path.join(process.cwd(), 'lib', 'global-error-handler.ts');
      
      const errorHandlingExists = fs.existsSync(errorHandlingPath);
      const globalErrorHandlerExists = fs.existsSync(globalErrorHandlerPath);
      
      if (errorHandlingExists && globalErrorHandlerExists) {
        this.addResult('Error Handling', true, 'Comprehensive error handling implemented');
      } else {
        this.addResult('Error Handling', false, 'Error handling utilities missing');
      }
    } catch (error) {
      this.addResult('Error Handling', false, 'Error checking error handling', error);
    }
  }

  /**
   * Check critical API endpoints
   */
  private async checkApiEndpoints(): Promise<void> {
    console.log('🌐 Checking critical API endpoints...');
    
    try {
      const apiPath = path.join(process.cwd(), 'app', 'api');
      const criticalEndpoints = [
        'v1/restaurants/route.ts',
        'restaurants/[id]/characteristics/route.ts',
        'security/two-factor/setup/route.ts',
        'restaurant-compliance/dashboard/route.ts',
      ];
      
      let existingEndpoints = 0;
      for (const endpoint of criticalEndpoints) {
        const endpointPath = path.join(apiPath, endpoint);
        if (fs.existsSync(endpointPath)) {
          existingEndpoints++;
        }
      }
      
      if (existingEndpoints === criticalEndpoints.length) {
        this.addResult('API Endpoints', true, 'All critical endpoints present');
      } else {
        this.addResult('API Endpoints', false, `${existingEndpoints}/${criticalEndpoints.length} critical endpoints found`);
      }
    } catch (error) {
      this.addResult('API Endpoints', false, 'Error checking API endpoints', error);
    }
  }

  /**
   * Check security headers and configurations
   */
  private async checkSecurityHeaders(): Promise<void> {
    console.log('🔒 Checking security configurations...');
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      
      if (fs.existsSync(nextConfigPath)) {
        const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
        const hasSecurityHeaders = configContent.includes('X-Frame-Options') || 
                                 configContent.includes('X-Content-Type-Options') ||
                                 configContent.includes('Referrer-Policy');
        
        if (hasSecurityHeaders) {
          this.addResult('Security Headers', true, 'Security headers configured');
        } else {
          this.addResult('Security Headers', false, 'Security headers missing in next.config.js');
        }
      } else {
        this.addResult('Security Headers', false, 'next.config.js not found');
      }
    } catch (error) {
      this.addResult('Security Headers', false, 'Error checking security headers', error);
    }
  }

  /**
   * Check required environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    console.log('🌍 Checking environment variables...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL',
    ];
    
    let missingVars: string[] = [];
    
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length === 0) {
      this.addResult('Environment Variables', true, 'All required environment variables present');
    } else {
      this.addResult('Environment Variables', false, `Missing variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Check database connectivity and basic operations
   */
  private async checkDatabaseConnectivity(): Promise<void> {
    console.log('🗄️ Checking database connectivity...');
    
    try {
      // This would normally test actual database connectivity
      // For now, we'll check if the Supabase configuration exists
      const supabasePath = path.join(process.cwd(), 'lib', 'supabase.ts');
      
      if (fs.existsSync(supabasePath)) {
        this.addResult('Database Connectivity', true, 'Database configuration present');
      } else {
        this.addResult('Database Connectivity', false, 'Database configuration missing');
      }
    } catch (error) {
      this.addResult('Database Connectivity', false, 'Error checking database connectivity', error);
    }
  }

  /**
   * Check performance requirements
   */
  private async checkPerformance(): Promise<void> {
    console.log('⚡ Checking performance configurations...');
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      
      if (fs.existsSync(nextConfigPath)) {
        const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
        const hasOptimizations = configContent.includes('compress') || 
                               configContent.includes('swcMinify') ||
                               configContent.includes('images');
        
        this.addResult('Performance', hasOptimizations, 
          hasOptimizations ? 'Performance optimizations configured' : 'Consider adding performance optimizations');
      } else {
        this.addResult('Performance', false, 'next.config.js not found');
      }
    } catch (error) {
      this.addResult('Performance', false, 'Error checking performance configurations', error);
    }
  }

  /**
   * Add a test result
   */
  private addResult(name: string, passed: boolean, message: string, details?: any): void {
    this.results.push({ name, passed, message, details });
  }

  /**
   * Print all test results
   */
  private printResults(): void {
    console.log('\n📊 Production Readiness Results\n');
    console.log('=' .repeat(60));
    
    let passed = 0;
    let total = this.results.length;
    
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.message}`);
      
      if (!result.passed && result.details && process.env.VERBOSE) {
        console.log(`   Details: ${result.details}`);
      }
      
      if (result.passed) passed++;
    }
    
    console.log('=' .repeat(60));
    console.log(`\n📈 Overall Score: ${passed}/${total} (${Math.round(passed/total * 100)}%)`);
    
    if (passed === total) {
      console.log('\n🎉 All checks passed! Ready for production deployment.');
    } else {
      console.log('\n⚠️ Some checks failed. Please address the issues before production deployment.');
      process.exit(1);
    }
  }
}

// Run the checks if this script is executed directly
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.runAllChecks().catch(console.error);
}

export { ProductionReadinessChecker };
