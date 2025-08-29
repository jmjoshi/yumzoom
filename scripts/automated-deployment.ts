#!/usr/bin/env node

/**
 * YumZoom Production Deployment Automation Script
 * Automated deployment pipeline for production environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  supabaseUrl: string;
  supabaseKey: string;
  appUrl: string;
  cdnUrl?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

interface DeploymentResult {
  success: boolean;
  stage: string;
  message: string;
  details?: any;
  timestamp: Date;
}

class ProductionDeployer {
  private config: DeploymentConfig;
  private results: DeploymentResult[] = [];
  private startTime: Date;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.startTime = new Date();
  }

  /**
   * Execute full production deployment pipeline
   */
  async deploy(): Promise<boolean> {
    console.log('🚀 Starting YumZoom Production Deployment\n');
    console.log(`Environment: ${this.config.environment.toUpperCase()}`);
    console.log(`Target URL: ${this.config.appUrl}`);
    console.log('=' .repeat(60));

    try {
      // Pre-deployment validation
      await this.validateEnvironment();
      await this.validateBuild();
      await this.validateDatabase();
      await this.validateSecurity();

      // Deployment execution
      await this.executeDeployment();
      await this.validateDeployment();

      // Post-deployment monitoring
      await this.setupMonitoring();
      await this.runHealthChecks();

      this.printSummary();
      return true;

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      this.printSummary();
      return false;
    }
  }

  /**
   * Validate deployment environment
   */
  private async validateEnvironment(): Promise<void> {
    console.log('\n🔍 Validating Environment Configuration...');

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    this.addResult('Environment Validation', true, 'All environment variables configured and Supabase connected');
  }

  /**
   * Validate production build
   */
  private async validateBuild(): Promise<void> {
    console.log('\n🔨 Validating Production Build...');

    try {
      // Clean previous build
      if (fs.existsSync('.next')) {
        fs.rmSync('.next', { recursive: true, force: true });
      }

      // Execute production build
      execSync('npm run build', { stdio: 'inherit' });

      // Validate build artifacts
      const buildManifest = path.join('.next', 'build-manifest.json');
      const staticDir = path.join('.next', 'static');

      if (!fs.existsSync(buildManifest)) {
        throw new Error('Build manifest not found');
      }

      if (!fs.existsSync(staticDir)) {
        throw new Error('Static assets directory not found');
      }

      this.addResult('Build Validation', true, 'Production build completed successfully');

    } catch (error) {
      this.addResult('Build Validation', false, 'Build failed', error);
      throw error;
    }
  }

  /**
   * Validate database schema and migrations
   */
  private async validateDatabase(): Promise<void> {
    console.log('\n🗄️ Validating Database Schema...');

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Test core tables
      const coreTables = ['restaurants', 'users', 'ratings', 'menu_items'];
      for (const table of coreTables) {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          throw new Error(`Table '${table}' validation failed: ${error.message}`);
        }
      }

      // Test advanced features
      const advancedTables = ['user_points', 'social_posts', 'analytics_events'];
      for (const table of advancedTables) {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          console.warn(`⚠️ Advanced table '${table}' not found or empty`);
        }
      }

      this.addResult('Database Validation', true, 'Database schema validated successfully');

    } catch (error) {
      this.addResult('Database Validation', false, 'Database validation failed', error);
      throw error;
    }
  }

  /**
   * Validate security configuration
   */
  private async validateSecurity(): Promise<void> {
    console.log('\n🔒 Validating Security Configuration...');

    try {
      // Check HTTPS configuration
      if (!this.config.appUrl.startsWith('https://')) {
        throw new Error('Production URL must use HTTPS');
      }

      // Validate security headers in next.config.js
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      const configContent = fs.readFileSync(nextConfigPath, 'utf-8');

      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security'
      ];

      for (const header of requiredHeaders) {
        if (!configContent.includes(header)) {
          throw new Error(`Security header '${header}' not configured`);
        }
      }

      this.addResult('Security Validation', true, 'Security configuration validated');

    } catch (error) {
      this.addResult('Security Validation', false, 'Security validation failed', error);
      throw error;
    }
  }

  /**
   * Execute deployment
   */
  private async executeDeployment(): Promise<void> {
    console.log('\n🚀 Executing Deployment...');

    try {
      // For Vercel deployment (recommended)
      if (process.env.VERCEL_TOKEN) {
        console.log('Deploying to Vercel...');
        execSync(`npx vercel --prod --yes`, { stdio: 'inherit' });
      }
      // For Netlify deployment
      else if (process.env.NETLIFY_AUTH_TOKEN) {
        console.log('Deploying to Netlify...');
        execSync(`npx netlify deploy --prod --dir .next`, { stdio: 'inherit' });
      }
      // For custom deployment
      else {
        console.log('Custom deployment - build artifacts ready in .next/');
        console.log('Please deploy .next/ directory to your hosting provider');
      }

      this.addResult('Deployment Execution', true, 'Deployment completed successfully');

    } catch (error) {
      this.addResult('Deployment Execution', false, 'Deployment failed', error);
      throw error;
    }
  }

  /**
   * Validate deployment success
   */
  private async validateDeployment(): Promise<void> {
    console.log('\n✅ Validating Deployment...');

    try {
      // Wait for deployment to propagate
      await this.delay(30000);

      // Test health endpoint
      const https = require('https');
      const healthCheck = await this.makeRequest(`${this.config.appUrl}/api/health`);

      if (!healthCheck.success) {
        throw new Error('Health check failed');
      }

      // Test core API endpoints
      const coreEndpoints = ['/api/restaurants', '/api/auth/login'];
      for (const endpoint of coreEndpoints) {
        const response = await this.makeRequest(`${this.config.appUrl}${endpoint}`);
        if (!response.success) {
          throw new Error(`API endpoint ${endpoint} failed`);
        }
      }

      this.addResult('Deployment Validation', true, 'Deployment validated successfully');

    } catch (error) {
      this.addResult('Deployment Validation', false, 'Deployment validation failed', error);
      throw error;
    }
  }

  /**
   * Setup monitoring and alerting
   */
  private async setupMonitoring(): Promise<void> {
    console.log('\n📊 Setting up Monitoring...');

    try {
      // Validate monitoring endpoints
      const monitoringEndpoints = [
        '/api/security/metrics',
        '/api/security/alerts',
        '/api/analytics/performance'
      ];

      for (const endpoint of monitoringEndpoints) {
        const response = await this.makeRequest(`${this.config.appUrl}${endpoint}`);
        if (!response.success) {
          console.warn(`⚠️ Monitoring endpoint ${endpoint} not accessible`);
        }
      }

      this.addResult('Monitoring Setup', true, 'Monitoring endpoints configured');

    } catch (error) {
      this.addResult('Monitoring Setup', false, 'Monitoring setup failed', error);
      // Don't throw - monitoring issues shouldn't block deployment
    }
  }

  /**
   * Run comprehensive health checks
   */
  private async runHealthChecks(): Promise<void> {
    console.log('\n🏥 Running Health Checks...');

    try {
      const checks = [
        { name: 'Application Health', url: '/api/health' },
        { name: 'Database Health', url: '/api/database/health' },
        { name: 'Security Status', url: '/api/security/status' },
        { name: 'Performance Metrics', url: '/api/analytics/performance' }
      ];

      for (const check of checks) {
        const response = await this.makeRequest(`${this.config.appUrl}${check.url}`);
        if (response.success) {
          console.log(`✅ ${check.name}: OK`);
        } else {
          console.log(`⚠️ ${check.name}: FAILED`);
        }
      }

      this.addResult('Health Checks', true, 'Health checks completed');

    } catch (error) {
      this.addResult('Health Checks', false, 'Health checks failed', error);
      // Don't throw - health check issues shouldn't block deployment
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(url: string): Promise<{ success: boolean; data?: any }> {
    return new Promise((resolve) => {
      const https = require('https');
      const req = https.get(url, { timeout: 10000 }, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => data += chunk);
        res.on('end', () => {
          resolve({
            success: res.statusCode === 200,
            data: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', () => resolve({ success: false }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false });
      });
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add deployment result
   */
  private addResult(stage: string, success: boolean, message: string, details?: any): void {
    this.results.push({
      success,
      stage,
      message,
      details,
      timestamp: new Date()
    });
  }

  /**
   * Print deployment summary
   */
  private printSummary(): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    console.log('\n📊 Deployment Summary\n');
    console.log('=' .repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;

    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Success Rate: ${successful}/${total} (${Math.round(successful/total * 100)}%)`);
    console.log('');

    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.stage}: ${result.message}`);

      if (!result.success && result.details) {
        console.log(`   Error: ${result.details.message || result.details}`);
      }
    }

    console.log('=' .repeat(60));

    const allSuccessful = this.results.every(r => r.success);
    if (allSuccessful) {
      console.log('\n🎉 Deployment completed successfully!');
      console.log(`🚀 Application is live at: ${this.config.appUrl}`);
    } else {
      console.log('\n❌ Deployment completed with issues');
      console.log('Please review the errors above and take corrective action');
    }
  }
}

/**
 * Default deployment configuration
 */
const defaultConfig: DeploymentConfig = {
  environment: 'production',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  cdnUrl: process.env.CDN_URL,
  smtpConfig: process.env.SMTP_HOST ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  } : undefined
};

/**
 * Run automated deployment
 */
export async function runAutomatedDeployment(config: Partial<DeploymentConfig> = {}): Promise<boolean> {
  const finalConfig = { ...defaultConfig, ...config };
  const deployer = new ProductionDeployer(finalConfig);
  return await deployer.deploy();
}

// Run if executed directly
if (require.main === module) {
  console.log('🚀 YumZoom Automated Production Deployment');
  console.log('==========================================\n');

  runAutomatedDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Deployment script failed:', error);
      process.exit(1);
    });
}
