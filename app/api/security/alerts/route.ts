import { NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/monitoring';

export async function GET() {
  try {
    const recentEvents = securityMonitor.getRecentEvents(24 * 60); // Last 24 hours
    
    const alerts = recentEvents
      .filter(e => e.status === 'failure')
      .map(event => ({
        id: Math.random().toString(36).substr(2, 9),
        type: `${event.type} - ${event.action}`,
        message: JSON.stringify(event.details),
        timestamp: event.timestamp,
        severity: getSeverity(event),
      }))
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    );
  }
}

function getSeverity(event: any): 'high' | 'medium' | 'low' {
  // Define high-severity events
  if (
    event.type === 'auth' && event.action.includes('key_rotation') ||
    event.type === 'api' && event.action === 'access_blocked' ||
    event.details?.failureCount >= 5
  ) {
    return 'high';
  }

  // Define medium-severity events
  if (
    event.type === 'auth' && event.action.includes('failed') ||
    event.type === 'api' && event.action.includes('blocked')
  ) {
    return 'medium';
  }

  return 'low';
}
