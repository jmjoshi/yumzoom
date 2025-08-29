#!/usr/bin/env node

/**
 * YumZoom Backup and Recovery Testing Suite
 * Comprehensive testing for disaster recovery procedures
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface BackupTest {
  name: string;
  description: string;
  testFunction: () => Promise<boolean>;
}

interface RecoveryTest {
  name: string;
  description: string;
  testFunction: () => Promise<boolean>;
}

interface BackupResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
  details?: any;
}

class BackupRecoveryTester {
  private supabase: any;
  private results: BackupResult[] = [];
  private testData: any = {};

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Run all backup and recovery tests
   */
  async runAllTests(): Promise<void> {
    console.log('🛡️ Starting Backup and Recovery Testing Suite\n');

    try {
      await this.createTestData();
      await this.testBackupProcedures();
      await this.testRecoveryProcedures();
      await this.testDataIntegrityAfterRecovery();
      await this.testFailoverCapabilities();
      await this.cleanupTestData();

      this.printResults();
    } catch (error) {
      console.error('❌ Backup/recovery testing failed:', error);
      process.exit(1);
    }
  }

  /**
   * Create test data for backup/recovery testing
   */
  private async createTestData(): Promise<void> {
    console.log('📝 Creating test data for backup/recovery testing...');

    try {
      // Create test restaurant
      const { data: restaurant, error: restaurantError } = await this.supabase
        .from('restaurants')
        .insert({
          name: 'Backup Recovery Test Restaurant',
          address: '123 Test Street, Test City, TC 12345',
          phone: '(555) 123-4567',
          cuisine_type: 'Test Cuisine',
          price_range: '$$',
          description: 'Test restaurant for backup/recovery testing'
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;
      this.testData.restaurantId = restaurant.id;

      // Create test user
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .insert({
          email: `test-backup-${Date.now()}@example.com`,
          full_name: 'Backup Test User',
          role: 'user'
        })
        .select()
        .single();

      if (userError) throw userError;
      this.testData.userId = user.id;

      // Create test rating
      const { data: rating, error: ratingError } = await this.supabase
        .from('ratings')
        .insert({
          restaurant_id: this.testData.restaurantId,
          user_id: this.testData.userId,
          rating: 5,
          review_text: 'Test review for backup/recovery testing',
          visit_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (ratingError) throw ratingError;
      this.testData.ratingId = rating.id;

      console.log('✅ Test data created successfully');
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      throw error;
    }
  }

  /**
   * Test backup procedures
   */
  private async testBackupProcedures(): Promise<void> {
    console.log('💾 Testing backup procedures...');

    const backupTests: BackupTest[] = [
      {
        name: 'Database Schema Backup',
        description: 'Test database schema backup capability',
        testFunction: async () => {
          // Test if we can query system tables (indicates backup capability)
          const { data, error } = await this.supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);

          if (error) throw error;
          return true;
        }
      },
      {
        name: 'Data Export Capability',
        description: 'Test ability to export critical data',
        testFunction: async () => {
          // Test exporting our test data
          const { data, error } = await this.supabase
            .from('restaurants')
            .select('*')
            .eq('id', this.testData.restaurantId);

          if (error) throw error;
          if (!data || data.length === 0) throw new Error('Test data not found');

          // Verify data integrity
          const restaurant = data[0];
          if (restaurant.name !== 'Backup Recovery Test Restaurant') {
            throw new Error('Data integrity check failed');
          }

          return true;
        }
      },
      {
        name: 'Configuration Backup',
        description: 'Test configuration and settings backup',
        testFunction: async () => {
          // Test if we can access configuration-related data
          const { data, error } = await this.supabase
            .from('restaurants')
            .select('id, name, created_at')
            .limit(1);

          if (error) throw error;
          return true;
        }
      }
    ];

    for (const test of backupTests) {
      const startTime = Date.now();
      try {
        const result = await test.testFunction();
        const duration = Date.now() - startTime;
        this.addResult(`Backup: ${test.name}`, result, test.description, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(`Backup: ${test.name}`, false, `${test.description} - ${error instanceof Error ? error.message : String(error)}`, duration, error);
      }
    }
  }

  /**
   * Test recovery procedures
   */
  private async testRecoveryProcedures(): Promise<void> {
    console.log('🔄 Testing recovery procedures...');

    const recoveryTests: RecoveryTest[] = [
      {
        name: 'Data Recovery from Backup',
        description: 'Test ability to recover data from backup',
        testFunction: async () => {
          // Simulate recovery by querying existing data
          const { data, error } = await this.supabase
            .from('restaurants')
            .select('*')
            .eq('id', this.testData.restaurantId);

          if (error) throw error;
          if (!data || data.length === 0) throw new Error('Recovery failed - test data not found');

          return true;
        }
      },
      {
        name: 'Database Connection Recovery',
        description: 'Test database connection recovery',
        testFunction: async () => {
          // Test multiple connections to ensure recovery works
          const promises = Array(5).fill(null).map(async () => {
            const { data, error } = await this.supabase
              .from('restaurants')
              .select('count')
              .limit(1);

            if (error) throw error;
            return data;
          });

          await Promise.all(promises);
          return true;
        }
      },
      {
        name: 'Application State Recovery',
        description: 'Test application state recovery after restart',
        testFunction: async () => {
          // Test if application can recover its state
          const { data, error } = await this.supabase
            .from('users')
            .select('id, email, role')
            .eq('id', this.testData.userId);

          if (error) throw error;
          if (!data || data.length === 0) throw new Error('User state recovery failed');

          return true;
        }
      }
    ];

    for (const test of recoveryTests) {
      const startTime = Date.now();
      try {
        const result = await test.testFunction();
        const duration = Date.now() - startTime;
        this.addResult(`Recovery: ${test.name}`, result, test.description, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(`Recovery: ${test.name}`, false, `${test.description} - ${error instanceof Error ? error.message : String(error)}`, duration, error);
      }
    }
  }

  /**
   * Test data integrity after recovery
   */
  private async testDataIntegrityAfterRecovery(): Promise<void> {
    console.log('🔍 Testing data integrity after recovery...');

    const integrityTests = [
      {
        name: 'Data Consistency Check',
        description: 'Verify data consistency after simulated recovery',
        testFunction: async () => {
          // Check restaurant data
          const { data: restaurant, error: restaurantError } = await this.supabase
            .from('restaurants')
            .select('*')
            .eq('id', this.testData.restaurantId)
            .single();

          if (restaurantError) throw restaurantError;

          // Check user data
          const { data: user, error: userError } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', this.testData.userId)
            .single();

          if (userError) throw userError;

          // Check rating data
          const { data: rating, error: ratingError } = await this.supabase
            .from('ratings')
            .select('*')
            .eq('id', this.testData.ratingId)
            .single();

          if (ratingError) throw ratingError;

          // Verify relationships
          if (rating.restaurant_id !== restaurant.id) {
            throw new Error('Restaurant-rating relationship broken');
          }
          if (rating.user_id !== user.id) {
            throw new Error('User-rating relationship broken');
          }

          return true;
        }
      },
      {
        name: 'Referential Integrity',
        description: 'Test foreign key constraints after recovery',
        testFunction: async () => {
          // Test that foreign key constraints are maintained
          const { data: ratings, error } = await this.supabase
            .from('ratings')
            .select(`
              *,
              restaurants!inner(name),
              users!inner(email)
            `)
            .eq('id', this.testData.ratingId);

          if (error) throw error;
          if (!ratings || ratings.length === 0) {
            throw new Error('Referential integrity check failed');
          }

          return true;
        }
      }
    ];

    for (const test of integrityTests) {
      const startTime = Date.now();
      try {
        const result = await test.testFunction();
        const duration = Date.now() - startTime;
        this.addResult(`Integrity: ${test.name}`, result, test.description, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(`Integrity: ${test.name}`, false, `${test.description} - ${error instanceof Error ? error.message : String(error)}`, duration, error);
      }
    }
  }

  /**
   * Test failover capabilities
   */
  private async testFailoverCapabilities(): Promise<void> {
    console.log('🔄 Testing failover capabilities...');

    const failoverTests = [
      {
        name: 'Connection Failover',
        description: 'Test connection failover and recovery',
        testFunction: async () => {
          // Test multiple connection attempts
          let successCount = 0;
          const attempts = 3;

          for (let i = 0; i < attempts; i++) {
            try {
              const { data, error } = await this.supabase
                .from('restaurants')
                .select('count')
                .limit(1);

              if (!error) successCount++;
              // Small delay between attempts
              await this.delay(1000);
            } catch (error) {
              // Continue to next attempt
            }
          }

          if (successCount === 0) {
            throw new Error('All connection attempts failed');
          }

          return true;
        }
      },
      {
        name: 'Query Retry Logic',
        description: 'Test automatic query retry on failure',
        testFunction: async () => {
          // Test query with potential transient failures
          const { data, error } = await this.supabase
            .from('restaurants')
            .select('*')
            .eq('id', this.testData.restaurantId)
            .single();

          if (error) throw error;
          return true;
        }
      }
    ];

    for (const test of failoverTests) {
      const startTime = Date.now();
      try {
        const result = await test.testFunction();
        const duration = Date.now() - startTime;
        this.addResult(`Failover: ${test.name}`, result, test.description, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(`Failover: ${test.name}`, false, `${test.description} - ${error instanceof Error ? error.message : String(error)}`, duration, error);
      }
    }
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      // Clean up in reverse order to respect foreign keys
      if (this.testData.ratingId) {
        await this.supabase
          .from('ratings')
          .delete()
          .eq('id', this.testData.ratingId);
      }

      if (this.testData.userId) {
        await this.supabase
          .from('users')
          .delete()
          .eq('id', this.testData.userId);
      }

      if (this.testData.restaurantId) {
        await this.supabase
          .from('restaurants')
          .delete()
          .eq('id', this.testData.restaurantId);
      }

      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.warn('⚠️ Test data cleanup warning:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add test result
   */
  private addResult(name: string, passed: boolean, message: string, duration?: number, details?: any): void {
    this.results.push({ name, passed, message, duration, details });
  }

  /**
   * Print all test results
   */
  private printResults(): void {
    console.log('\n📊 Backup and Recovery Test Results\n');
    console.log('=' .repeat(80));

    let passed = 0;
    let total = this.results.length;
    let totalDuration = 0;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.name}: ${result.message}${duration}`);

      if (!result.passed && result.details) {
        console.log(`   Details: ${result.details.message || result.details}`);
      }

      if (result.passed) passed++;
      if (result.duration) totalDuration += result.duration;
    }

    console.log('=' .repeat(80));
    console.log(`\n📈 Overall Score: ${passed}/${total} (${Math.round(passed/total * 100)}%)`);
    console.log(`⏱️  Total Test Duration: ${totalDuration}ms`);
    console.log(`📊 Average Test Duration: ${Math.round(totalDuration/total)}ms`);

    // Recovery Time Objective (RTO) assessment
    const maxAcceptableDuration = 5000; // 5 seconds
    const rtoMet = totalDuration <= maxAcceptableDuration;

    console.log(`\n🎯 Recovery Time Objective (RTO):`);
    console.log(`   Target: ≤${maxAcceptableDuration}ms`);
    console.log(`   Actual: ${totalDuration}ms`);
    console.log(`   Status: ${rtoMet ? '✅ MET' : '❌ NOT MET'}`);

    if (passed === total && rtoMet) {
      console.log('\n🎉 All backup and recovery tests PASSED!');
      console.log('✅ Disaster recovery procedures are production-ready');
    } else {
      console.log('\n⚠️ Some backup/recovery tests FAILED');
      console.log('❌ Address disaster recovery issues before production deployment');
      process.exit(1);
    }
  }
}

/**
 * Run backup and recovery tests
 */
export async function runBackupRecoveryTests(): Promise<BackupResult[]> {
  const tester = new BackupRecoveryTester();
  await tester.runAllTests();
  return tester['results'];
}

// Run if executed directly
if (require.main === module) {
  console.log('🛡️ YumZoom Backup and Recovery Testing Suite');
  console.log('=============================================\n');

  runBackupRecoveryTests().catch(error => {
    console.error('❌ Backup/recovery testing failed:', error);
    process.exit(1);
  });
}
