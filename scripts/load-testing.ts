#!/usr/bin/env node

/**
 * YumZoom Load Testing Suite
 * Comprehensive load testing for production readiness
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

interface LoadTestResult {
  endpoint: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
}

interface LoadTestConfig {
  baseUrl: string;
  endpoints: string[];
  concurrentUsers: number[];
  testDuration: number; // seconds
  rampUpTime: number; // seconds
}

class LoadTester {
  private results: LoadTestResult[] = [];
  private config: LoadTestConfig;

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  /**
   * Run comprehensive load testing
   */
  async runLoadTests(): Promise<void> {
    console.log('🚀 Starting Load Testing Suite\n');
    console.log(`Base URL: ${this.config.baseUrl}`);
    console.log(`Test Duration: ${this.config.testDuration}s`);
    console.log(`Ramp Up Time: ${this.config.rampUpTime}s\n`);

    for (const endpoint of this.config.endpoints) {
      console.log(`\n📊 Testing endpoint: ${endpoint}`);

      for (const users of this.config.concurrentUsers) {
        console.log(`   Concurrent users: ${users}`);
        const result = await this.testEndpoint(endpoint, users);
        this.results.push(result);

        this.printResult(result);
      }
    }

    this.printSummary();
  }

  /**
   * Test a specific endpoint with given concurrent users
   */
  private async testEndpoint(endpoint: string, concurrentUsers: number): Promise<LoadTestResult> {
    const fullUrl = `${this.config.baseUrl}${endpoint}`;
    const results: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    const startTime = Date.now();
    const endTime = startTime + (this.config.testDuration * 1000);

    // Create user simulation promises
    const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
      const userResults: number[] = [];
      let userSuccessful = 0;
      let userFailed = 0;

      // Ramp up delay
      const rampUpDelay = (this.config.rampUpTime * 1000 * userIndex) / concurrentUsers;
      await this.delay(rampUpDelay);

      while (Date.now() < endTime) {
        try {
          const responseTime = await this.makeRequest(fullUrl);
          userResults.push(responseTime);
          userSuccessful++;

          // Add small delay between requests (100-500ms)
          await this.delay(100 + Math.random() * 400);
        } catch (error) {
          userFailed++;
          // Add delay on error
          await this.delay(1000);
        }
      }

      return { userResults, userSuccessful, userFailed };
    });

    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);

    // Aggregate results
    for (const userResult of userResults) {
      results.push(...userResult.userResults);
      successfulRequests += userResult.userSuccessful;
      failedRequests += userResult.userFailed;
    }

    const totalRequests = successfulRequests + failedRequests;
    const averageResponseTime = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0;
    const minResponseTime = results.length > 0 ? Math.min(...results) : 0;
    const maxResponseTime = results.length > 0 ? Math.max(...results) : 0;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const throughput = totalRequests / this.config.testDuration;

    return {
      endpoint,
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      errorRate,
      throughput
    };
  }

  /**
   * Make HTTP request and measure response time
   */
  private async makeRequest(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.startsWith('https:') ? https : http;

      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseTime);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
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
   * Print individual test result
   */
  private printResult(result: LoadTestResult): void {
    const status = result.errorRate < 5 ? '✅' : result.errorRate < 10 ? '⚠️' : '❌';

    console.log(`      ${status} ${result.endpoint} (${result.concurrentUsers} users)`);
    console.log(`         Requests: ${result.totalRequests} (${result.successfulRequests} success, ${result.failedRequests} failed)`);
    console.log(`         Response Time: ${result.averageResponseTime.toFixed(0)}ms avg (${result.minResponseTime}ms - ${result.maxResponseTime}ms)`);
    console.log(`         Error Rate: ${result.errorRate.toFixed(2)}%`);
    console.log(`         Throughput: ${result.throughput.toFixed(2)} req/s`);
  }

  /**
   * Print comprehensive summary
   */
  private printSummary(): void {
    console.log('\n📊 Load Testing Summary\n');
    console.log('=' .repeat(80));

    // Overall statistics
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedRequests, 0);
    const overallErrorRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;

    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful: ${totalSuccessful} (${((totalSuccessful / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed: ${totalFailed} (${overallErrorRate.toFixed(2)}%)`);
    console.log(`Overall Error Rate: ${overallErrorRate.toFixed(2)}%`);

    // Performance analysis
    console.log('\n🎯 Performance Analysis:');

    const criticalEndpoints = this.results.filter(r =>
      r.endpoint.includes('/api/') && r.concurrentUsers >= 50
    );

    if (criticalEndpoints.length > 0) {
      const avgResponseTime = criticalEndpoints.reduce((sum, r) => sum + r.averageResponseTime, 0) / criticalEndpoints.length;
      const maxErrorRate = Math.max(...criticalEndpoints.map(r => r.errorRate));

      console.log(`Average API Response Time (50+ users): ${avgResponseTime.toFixed(0)}ms`);
      console.log(`Maximum Error Rate: ${maxErrorRate.toFixed(2)}%`);

      // Recommendations
      console.log('\n💡 Recommendations:');
      if (avgResponseTime > 1000) {
        console.log('⚠️ Consider optimizing database queries or adding caching');
      }
      if (maxErrorRate > 5) {
        console.log('⚠️ High error rate detected - investigate server capacity');
      }
      if (avgResponseTime <= 500 && maxErrorRate <= 2) {
        console.log('✅ Performance meets production requirements');
      }
    }

    console.log('=' .repeat(80));

    // Production readiness assessment
    const productionReady = overallErrorRate < 5 &&
                           this.results.every(r => r.averageResponseTime < 2000);

    if (productionReady) {
      console.log('\n🎉 Load testing PASSED - Ready for production!');
    } else {
      console.log('\n⚠️ Load testing FAILED - Address performance issues before production');
    }
  }
}

/**
 * Default load testing configuration
 */
const defaultConfig: LoadTestConfig = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  endpoints: [
    '/',
    '/restaurants',
    '/api/restaurants',
    '/api/auth/login',
    '/api/ratings',
    '/search',
    '/dashboard'
  ],
  concurrentUsers: [10, 25, 50, 100],
  testDuration: 60, // 60 seconds
  rampUpTime: 10 // 10 seconds
};

/**
 * Run load tests with custom configuration
 */
export async function runLoadTests(config: Partial<LoadTestConfig> = {}): Promise<LoadTestResult[]> {
  const finalConfig = { ...defaultConfig, ...config };
  const tester = new LoadTester(finalConfig);
  await tester.runLoadTests();
  return tester['results'];
}

// Run if executed directly
if (require.main === module) {
  const config = {
    ...defaultConfig,
    baseUrl: process.env.LOAD_TEST_URL || defaultConfig.baseUrl
  };

  console.log('🔥 YumZoom Load Testing Suite');
  console.log('==============================\n');

  runLoadTests(config).catch(error => {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  });
}
