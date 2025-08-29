#!/usr/bin/env node

/**
 * HTTPS Security Validation Script
 * Checks for HTTP protocol usage and validates HTTPS implementation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SecurityIssue {
  file: string;
  line?: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

class HttpsSecurityValidator {
  private issues: SecurityIssue[] = [];
  private rootDir: string;

  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Run all HTTPS security validations
   */
  async validateSecurity(): Promise<void> {
    console.log('🔒 Starting HTTPS Security Validation\n');

    await this.checkHttpUrls();
    await this.checkEnvironmentFiles();
    await this.checkConfigurationFiles();
    await this.checkSecurityHeaders();
    await this.checkRedirectConfiguration();
    await this.validateCertificateSetup();

    this.printResults();
  }

  /**
   * Check for HTTP URLs in code
   */
  private async checkHttpUrls(): Promise<void> {
    console.log('🔍 Scanning for HTTP URLs in codebase...');

    const excludePaths = [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      'coverage',
      'public/sw.js',
      'public/workbox-',
      'documents/', // Documentation may contain example HTTP URLs
    ];

    try {
      // Search for HTTP URLs in TypeScript/JavaScript files
      const result = execSync(
        `grep -r "http://" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git .`,
        { cwd: this.rootDir, encoding: 'utf-8' }
      );

      const lines = result.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const [filePath, ...contentParts] = line.split(':');
        const content = contentParts.join(':');
        
        // Skip if in excluded paths
        if (excludePaths.some(excluded => filePath.includes(excluded))) {
          continue;
        }

        // Skip if it's a comment or documentation
        if (content.includes('//') || content.includes('/*') || content.includes('*')) {
          continue;
        }

        // Skip localhost URLs in development files
        if (content.includes('localhost') && (
          filePath.includes('test') || 
          filePath.includes('spec') || 
          filePath.includes('.dev.') ||
          filePath.includes('development')
        )) {
          continue;
        }

        this.addIssue({
          file: filePath,
          issue: `HTTP URL found: ${content.trim()}`,
          severity: 'high',
          recommendation: 'Replace with HTTPS URL or use secure URL generation utility'
        });
      }
    } catch (error) {
      // No matches found (which is good for security)
      console.log('✅ No HTTP URLs found in source code');
    }
  }

  /**
   * Check environment files for HTTP configurations
   */
  private async checkEnvironmentFiles(): Promise<void> {
    console.log('🌍 Checking environment files...');

    const envFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.example',
      '.env.development',
      '.env.production.example',
      '.env.integrations.example',
      '.env.security.example'
    ];

    for (const envFile of envFiles) {
      const filePath = path.join(this.rootDir, envFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('http://') && !line.startsWith('#')) {
            // Allow localhost in development files
            if ((envFile.includes('development') || envFile.includes('local')) && line.includes('localhost')) {
              return;
            }

            this.addIssue({
              file: envFile,
              line: index + 1,
              issue: `HTTP URL in environment variable: ${line.trim()}`,
              severity: envFile.includes('production') ? 'high' : 'medium',
              recommendation: 'Use HTTPS URLs for production environment'
            });
          }
        });
      }
    }
  }

  /**
   * Check configuration files for security settings
   */
  private async checkConfigurationFiles(): Promise<void> {
    console.log('⚙️ Checking configuration files...');

    // Check Next.js config
    const nextConfigPath = path.join(this.rootDir, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8');
      
      if (!content.includes('Strict-Transport-Security')) {
        this.addIssue({
          file: 'next.config.js',
          issue: 'HSTS header not configured',
          severity: 'high',
          recommendation: 'Add Strict-Transport-Security header for HTTPS enforcement'
        });
      }

      if (!content.includes('upgrade-insecure-requests')) {
        this.addIssue({
          file: 'next.config.js',
          issue: 'CSP upgrade-insecure-requests directive not found',
          severity: 'medium',
          recommendation: 'Add upgrade-insecure-requests to Content Security Policy'
        });
      }

      if (!content.includes('redirects')) {
        this.addIssue({
          file: 'next.config.js',
          issue: 'HTTP to HTTPS redirect not configured',
          severity: 'high',
          recommendation: 'Configure automatic HTTP to HTTPS redirects'
        });
      }
    }

    // Check middleware
    const middlewarePath = path.join(this.rootDir, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf-8');
      
      if (!content.includes('https-config')) {
        this.addIssue({
          file: 'middleware.ts',
          issue: 'HTTPS configuration not imported',
          severity: 'medium',
          recommendation: 'Import and use HTTPS configuration utilities'
        });
      }
    }
  }

  /**
   * Check security headers implementation
   */
  private async checkSecurityHeaders(): Promise<void> {
    console.log('🛡️ Checking security headers...');

    const middlewarePath = path.join(this.rootDir, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf-8');
      
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Strict-Transport-Security'
      ];

      for (const header of requiredHeaders) {
        if (!content.includes(header)) {
          this.addIssue({
            file: 'middleware.ts',
            issue: `Security header missing: ${header}`,
            severity: 'high',
            recommendation: `Add ${header} security header to middleware`
          });
        }
      }
    }
  }

  /**
   * Check redirect configuration
   */
  private async checkRedirectConfiguration(): Promise<void> {
    console.log('🔄 Checking redirect configuration...');

    const nextConfigPath = path.join(this.rootDir, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf-8');
      
      if (!content.includes('x-forwarded-proto')) {
        this.addIssue({
          file: 'next.config.js',
          issue: 'HTTP to HTTPS redirect based on x-forwarded-proto not configured',
          severity: 'high',
          recommendation: 'Configure redirects to check x-forwarded-proto header'
        });
      }
    }
  }

  /**
   * Validate SSL/TLS certificate setup
   */
  private async validateCertificateSetup(): Promise<void> {
    console.log('📜 Checking certificate configuration...');

    // Check if there's documentation about certificate setup
    const possibleCertPaths = [
      'certs/',
      'ssl/',
      'certificates/',
      'docs/deployment/',
      'documentation/'
    ];

    let hasCertDocumentation = false;
    
    for (const certPath of possibleCertPaths) {
      const fullPath = path.join(this.rootDir, certPath);
      if (fs.existsSync(fullPath)) {
        hasCertDocumentation = true;
        break;
      }
    }

    if (!hasCertDocumentation) {
      this.addIssue({
        file: 'Project Root',
        issue: 'No SSL/TLS certificate documentation found',
        severity: 'medium',
        recommendation: 'Create documentation for SSL certificate setup and renewal'
      });
    }

    // Check for HTTPS development setup
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      if (packageJson.scripts && packageJson.scripts.dev && 
          !packageJson.scripts['dev:https']) {
        this.addIssue({
          file: 'package.json',
          issue: 'No HTTPS development script configured',
          severity: 'low',
          recommendation: 'Add dev:https script for local HTTPS development'
        });
      }
    }
  }

  /**
   * Add a security issue
   */
  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n🔒 HTTPS Security Validation Results\n');
    console.log('=' .repeat(60));

    if (this.issues.length === 0) {
      console.log('✅ No HTTPS security issues found! Your application is properly configured for secure HTTPS communication.');
      return;
    }

    // Group issues by severity
    const highSeverityIssues = this.issues.filter(i => i.severity === 'high');
    const mediumSeverityIssues = this.issues.filter(i => i.severity === 'medium');
    const lowSeverityIssues = this.issues.filter(i => i.severity === 'low');

    // Print high severity issues
    if (highSeverityIssues.length > 0) {
      console.log('🚨 HIGH SEVERITY ISSUES (Must Fix Before Production):');
      console.log('-'.repeat(50));
      highSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Recommendation: ${issue.recommendation}\n`);
      });
    }

    // Print medium severity issues
    if (mediumSeverityIssues.length > 0) {
      console.log('⚠️  MEDIUM SEVERITY ISSUES (Recommended Fixes):');
      console.log('-'.repeat(50));
      mediumSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Recommendation: ${issue.recommendation}\n`);
      });
    }

    // Print low severity issues
    if (lowSeverityIssues.length > 0) {
      console.log('ℹ️  LOW SEVERITY ISSUES (Optional Improvements):');
      console.log('-'.repeat(50));
      lowSeverityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Recommendation: ${issue.recommendation}\n`);
      });
    }

    console.log('=' .repeat(60));
    console.log(`\n📊 Summary: ${this.issues.length} issues found`);
    console.log(`   🚨 High Severity: ${highSeverityIssues.length}`);
    console.log(`   ⚠️  Medium Severity: ${mediumSeverityIssues.length}`);
    console.log(`   ℹ️  Low Severity: ${lowSeverityIssues.length}`);

    if (highSeverityIssues.length > 0) {
      console.log('\n❌ Production deployment blocked due to high severity security issues.');
      console.log('   Please fix all high severity issues before deploying to production.');
      process.exit(1);
    } else {
      console.log('\n✅ No high severity issues found. Safe for production deployment.');
      if (mediumSeverityIssues.length > 0 || lowSeverityIssues.length > 0) {
        console.log('   Consider addressing medium and low severity issues for enhanced security.');
      }
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new HttpsSecurityValidator();
  validator.validateSecurity().catch(console.error);
}

export { HttpsSecurityValidator };
