type LogLevel = 'info' | 'warn' | 'error';
type SecurityEvent = {
  type: 'auth' | 'database' | 'api';
  action: string;
  status: 'success' | 'failure';
  details?: any;
  timestamp: Date;
};

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  private constructor() {}

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  public logSecurityEvent(
    type: SecurityEvent['type'],
    action: string,
    status: SecurityEvent['status'],
    details?: any
  ) {
    const event: SecurityEvent = {
      type,
      action,
      status,
      details,
      timestamp: new Date(),
    };

    this.events.unshift(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole('info', `Security Event: ${type} - ${action} - ${status}`);
    }

    // In production, you would send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(event);
    }

    // Alert on suspicious activity
    if (status === 'failure') {
      this.handleFailure(event);
    }
  }

  private logToConsole(level: LogLevel, message: string) {
    switch (level) {
      case 'info':
        console.log(`[Security] ${message}`);
        break;
      case 'warn':
        console.warn(`[Security Warning] ${message}`);
        break;
      case 'error':
        console.error(`[Security Alert] ${message}`);
        break;
    }
  }

  private async sendToLoggingService(event: SecurityEvent) {
    // TODO: Implement connection to a logging service like:
    // - AWS CloudWatch
    // - DataDog
    // - New Relic
    try {
      // Example implementation
      const payload = {
        ...event,
        environment: process.env.NODE_ENV,
        application: 'yumzoom',
      };
      
      // Uncomment and configure for your logging service
      /*
      await fetch('YOUR_LOGGING_SERVICE_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_SERVICE_KEY}`
        },
        body: JSON.stringify(payload)
      });
      */
    } catch (error) {
      console.error('Failed to send security event to logging service:', error);
    }
  }

  private handleFailure(event: SecurityEvent) {
    // Count recent failures
    const recentFailures = this.events
      .filter(e => 
        e.status === 'failure' &&
        e.type === event.type &&
        e.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
      );

    // Alert on multiple failures
    if (recentFailures.length >= 5) {
      this.logToConsole('error', `Multiple security failures detected for ${event.type}`);
      this.sendSecurityAlert(event, recentFailures.length);
    }
  }

  private async sendSecurityAlert(event: SecurityEvent, failureCount: number) {
    // TODO: Implement your alert mechanism (email, SMS, etc.)
    // Example implementation
    const alert = {
      severity: 'HIGH',
      message: `Security Alert: Multiple failures detected`,
      details: {
        type: event.type,
        failureCount,
        timeWindow: '5 minutes',
        lastEventDetails: event.details
      }
    };

    // Log the alert in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Security Alert]', alert);
    }

    // In production, send to your alert service
    if (process.env.NODE_ENV === 'production') {
      // Uncomment and configure for your alert service
      /*
      await fetch('YOUR_ALERT_SERVICE_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ALERT_SERVICE_KEY}`
        },
        body: JSON.stringify(alert)
      });
      */
    }
  }

  public getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
