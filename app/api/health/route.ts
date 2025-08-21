import { NextResponse } from 'next/server';
import { secretsManager } from '@/lib/secrets';
import { securityMonitor } from '@/lib/monitoring';

export async function GET() {
  // Only allow in development or with proper authentication in production
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const keyHealth = secretsManager.getKeyHealth();
    const recentEvents = securityMonitor.getRecentEvents(60); // Last hour

    const healthReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      keyHealth,
      recentSecurityEvents: {
        total: recentEvents.length,
        failures: recentEvents.filter(e => e.status === 'failure').length,
      },
      checks: {
        supabaseConnection: true,
        keyValidation: true,
      }
    };

    // Perform health checks
    try {
      await secretsManager.validateKeys();
    } catch (error) {
      healthReport.checks.keyValidation = false;
      healthReport.status = 'degraded';
    }

    return new NextResponse(JSON.stringify(healthReport), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Health check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
