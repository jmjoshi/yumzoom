import { NextResponse } from 'next/server';
import { secretsManager } from '@/lib/secrets';
import { securityMonitor } from '@/lib/monitoring';
import { keyRotationService } from '@/lib/key-rotation';

export async function GET() {
  try {
    const recentEvents = securityMonitor.getRecentEvents(60);
    const keyHealth = secretsManager.getKeyHealth();
    
    const metrics = {
      failedLogins: recentEvents.filter(e => 
        e.type === 'auth' && e.status === 'failure'
      ).length,
      blockedIPs: recentEvents.filter(e => 
        e.type === 'api' && e.action === 'access_blocked'
      ).length,
      activeKeys: Object.values(keyHealth).filter(k => k.isValid).length,
      keyRotationsNeeded: Object.values(keyHealth).filter(
        k => k.daysUntilExpiration <= 7
      ).length,
      recentAlerts: recentEvents.filter(e => e.status === 'failure').length,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
