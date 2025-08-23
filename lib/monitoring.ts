type LogLevel = 'info' | 'warn' | 'error' | 'critical';
type SecurityEvent = {
  type: 'auth' | 'database' | 'api' | 'network' | 'compliance';
  action: string;
  status: 'success' | 'failure' | 'warning';
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
};

type SecurityAlert = {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata?: any;
};

type SecurityMetrics = {
  failedLogins: number;
  blockedIPs: number;
  suspiciousActivities: number;
  dataBreachAttempts: number;
  complianceViolations: number;
  activeAlerts: number;
  lastSecurityScan?: Date;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
};

type ThreatPattern = {
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
};

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private readonly MAX_EVENTS = 10000;
  private readonly MAX_ALERTS = 1000;
  private threatIntelligence: Map<string, any> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private threatPatterns: ThreatPattern[] = [];

  private constructor() {
    this.initializeThreatIntelligence();
    this.initializeThreatPatterns();
  }

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
    details?: any,
    severity: SecurityEvent['severity'] = 'medium',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ) {
    const event: SecurityEvent = {
      type,
      action,
      status,
      severity,
      details,
      timestamp: new Date(),
      userId,
      ipAddress,
      userAgent,
      sessionId,
    };

    // Add to events array
    this.events.unshift(event);

    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Log to console
    this.logToConsole(this.getLogLevel(severity), this.formatEventMessage(event));

    // Send to external logging service
    this.sendToLoggingService(event).catch(console.error);

    // Handle critical events immediately
    if (severity === 'critical' || status === 'failure') {
      this.handleCriticalEvent(event);
    }

    // Analyze for threat patterns
    this.analyzeThreatPatterns(event);

    // Check for compliance violations
    this.checkComplianceViolations(event);

    // Track suspicious IPs
    if (ipAddress && (status === 'failure' || severity === 'high')) {
      this.trackSuspiciousIP(ipAddress, event);
    }
  }

  public createAlert(
    type: string,
    message: string,
    severity: SecurityAlert['severity'],
    metadata?: any
  ): string {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type,
      message,
      severity,
      timestamp: new Date(),
      acknowledged: false,
      metadata,
    };

    this.alerts.unshift(alert);

    // Keep only the most recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }

    // Send immediate notification for high/critical alerts
    if (severity === 'high' || severity === 'critical') {
      this.sendImmediateAlert(alert);
    }

    this.logToConsole('warn', `Security Alert Created: ${type} - ${message}`);

    return alert.id;
  }

  public getActiveAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  public getAllAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logToConsole('info', `Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.resolvedAt = new Date();
      this.logToConsole('info', `Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  public getSecurityMetrics(): SecurityMetrics {
    const recentEvents = this.getRecentEvents(60); // Last 60 minutes
    const activeAlerts = this.getActiveAlerts();

    return {
      failedLogins: recentEvents.filter(e => 
        e.type === 'auth' && e.action.includes('login') && e.status === 'failure'
      ).length,
      blockedIPs: this.suspiciousIPs.size,
      suspiciousActivities: recentEvents.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length,
      dataBreachAttempts: recentEvents.filter(e => 
        e.action.includes('breach') || e.action.includes('unauthorized_access')
      ).length,
      complianceViolations: recentEvents.filter(e => 
        e.type === 'compliance'
      ).length,
      activeAlerts: activeAlerts.length,
      lastSecurityScan: new Date(),
      threatLevel: this.calculateThreatLevel(recentEvents, activeAlerts),
    };
  }

  public isSuspiciousIP(ipAddress: string): boolean {
    return this.suspiciousIPs.has(ipAddress);
  }

  public blockIP(ipAddress: string, reason: string): void {
    this.suspiciousIPs.add(ipAddress);
    this.logSecurityEvent(
      'network',
      'ip_blocked',
      'warning',
      { ipAddress, reason },
      'high'
    );
  }

  public unblockIP(ipAddress: string): void {
    this.suspiciousIPs.delete(ipAddress);
    this.logSecurityEvent(
      'network',
      'ip_unblocked',
      'success',
      { ipAddress },
      'medium'
    );
  }

  public getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  public startContinuousMonitoring(): void {
    // Run security checks every minute
    setInterval(() => {
      this.performSecurityHealthCheck();
    }, 60000);

    // Run threat analysis every 5 minutes
    setInterval(() => {
      this.performThreatAnalysis();
    }, 300000);

    this.logToConsole('info', 'Continuous security monitoring started');
  }

  private initializeThreatIntelligence(): void {
    this.threatIntelligence.set('known_attack_patterns', [
      'sql_injection',
      'xss_attack',
      'brute_force',
      'ddos',
      'csrf',
      'directory_traversal'
    ]);

    this.threatIntelligence.set('suspicious_user_agents', [
      'sqlmap',
      'nikto',
      'burp',
      'nmap',
      'masscan'
    ]);
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        pattern: 'brute_force_login',
        description: 'Multiple failed login attempts from same IP',
        severity: 'high',
        indicators: ['multiple_login_failures', 'same_ip_address', 'short_time_window']
      },
      {
        pattern: 'sql_injection_attempt',
        description: 'Potential SQL injection in request parameters',
        severity: 'critical',
        indicators: ['sql_keywords', 'special_characters', 'unusual_parameter_values']
      },
      {
        pattern: 'data_exfiltration',
        description: 'Unusual data access patterns',
        severity: 'critical',
        indicators: ['bulk_data_access', 'unusual_time', 'suspicious_queries']
      }
    ];
  }

  private formatEventMessage(event: SecurityEvent): string {
    return `[${event.severity.toUpperCase()}] ${event.type}:${event.action} - ${event.status}`;
  }

  private getLogLevel(severity: SecurityEvent['severity']): LogLevel {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warn';
      case 'high': return 'error';
      case 'critical': return 'critical';
      default: return 'info';
    }
  }

  private handleCriticalEvent(event: SecurityEvent): void {
    // Create immediate alert for critical events
    this.createAlert(
      event.type,
      `Critical security event: ${event.action}`,
      event.severity,
      { event }
    );

    // Count recent similar events
    const recentSimilar = this.events.filter(e => 
      e.type === event.type &&
      e.action === event.action &&
      e.status === 'failure' &&
      e.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentSimilar.length >= 5) {
      this.createAlert(
        'security_pattern',
        `Multiple security failures detected: ${event.type}:${event.action}`,
        'critical',
        { failureCount: recentSimilar.length, timeWindow: '5 minutes' }
      );
    }
  }

  private analyzeThreatPatterns(event: SecurityEvent): void {
    // Check against known threat patterns
    this.threatPatterns.forEach(pattern => {
      if (this.matchesThreatPattern(event, pattern)) {
        this.createAlert(
          'threat_pattern',
          `Threat pattern detected: ${pattern.description}`,
          pattern.severity,
          { pattern: pattern.pattern, event }
        );
      }
    });
  }

  private matchesThreatPattern(event: SecurityEvent, pattern: ThreatPattern): boolean {
    // Implement pattern matching logic
    switch (pattern.pattern) {
      case 'brute_force_login':
        return this.detectBruteForcePattern(event);
      case 'sql_injection_attempt':
        return this.detectSQLInjectionPattern(event);
      case 'data_exfiltration':
        return this.detectDataExfiltrationPattern(event);
      default:
        return false;
    }
  }

  private detectBruteForcePattern(event: SecurityEvent): boolean {
    if (event.type !== 'auth' || !event.action.includes('login') || event.status !== 'failure') {
      return false;
    }

    if (!event.ipAddress) return false;

    const recentFailures = this.events.filter(e => 
      e.type === 'auth' &&
      e.action.includes('login') &&
      e.status === 'failure' &&
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > Date.now() - 10 * 60 * 1000 // Last 10 minutes
    );

    return recentFailures.length >= 5;
  }

  private detectSQLInjectionPattern(event: SecurityEvent): boolean {
    if (event.type !== 'database' && event.type !== 'api') return false;

    const sqlKeywords = ['select', 'union', 'insert', 'delete', 'drop', 'exec', 'script'];
    const eventString = JSON.stringify(event.details || '').toLowerCase();

    return sqlKeywords.some(keyword => eventString.includes(keyword));
  }

  private detectDataExfiltrationPattern(event: SecurityEvent): boolean {
    if (event.type !== 'database' || event.action !== 'data_access') return false;

    // Check for bulk data access
    const details = event.details || {};
    return details.recordCount > 1000 || details.dataSize > 10000000; // 10MB
  }

  private checkComplianceViolations(event: SecurityEvent): void {
    // GDPR compliance checks
    if (event.type === 'database' && event.action.includes('personal_data')) {
      if (!event.details?.consent_given) {
        this.createAlert(
          'gdpr_violation',
          'Personal data accessed without consent',
          'high',
          { event }
        );
      }
    }

    // Data retention checks
    if (event.action === 'data_export' || event.action === 'data_deletion') {
      this.logSecurityEvent(
        'compliance',
        'data_subject_rights_request',
        'success',
        event.details,
        'medium'
      );
    }
  }

  private trackSuspiciousIP(ipAddress: string, event: SecurityEvent): void {
    const recentEvents = this.events.filter(e => 
      e.ipAddress === ipAddress &&
      e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    );

    const suspiciousEvents = recentEvents.filter(e => 
      e.status === 'failure' || e.severity === 'high' || e.severity === 'critical'
    );

    if (suspiciousEvents.length >= 10) {
      this.blockIP(ipAddress, `Multiple suspicious activities: ${suspiciousEvents.length} events in last hour`);
    }
  }

  private calculateThreatLevel(
    recentEvents: SecurityEvent[], 
    activeAlerts: SecurityAlert[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = recentEvents.filter(e => e.severity === 'high').length;
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;

    if (criticalEvents > 0 || criticalAlerts > 0) return 'critical';
    if (highSeverityEvents > 5 || activeAlerts.length > 10) return 'high';
    if (highSeverityEvents > 0 || activeAlerts.length > 3) return 'medium';
    return 'low';
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private performSecurityHealthCheck(): void {
    const metrics = this.getSecurityMetrics();
    
    if (metrics.threatLevel === 'critical') {
      this.createAlert(
        'system_health',
        'Critical threat level detected',
        'critical',
        { metrics }
      );
    }

    // Check for system anomalies
    if (metrics.failedLogins > 100) {
      this.createAlert(
        'authentication',
        'Unusually high number of failed logins',
        'high',
        { count: metrics.failedLogins }
      );
    }
  }

  private performThreatAnalysis(): void {
    const recentEvents = this.getRecentEvents(60);
    
    // Analyze event patterns
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Alert on unusual activity spikes
    Object.entries(eventsByType).forEach(([type, count]) => {
      if (count > 50) { // Threshold for unusual activity
        this.createAlert(
          'activity_spike',
          `Unusual activity spike in ${type}: ${count} events`,
          'medium',
          { type, count }
        );
      }
    });
  }

  private logToConsole(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    switch (level) {
      case 'info':
        console.log(`[${timestamp}] [Security] ${message}`);
        break;
      case 'warn':
        console.warn(`[${timestamp}] [Security Warning] ${message}`);
        break;
      case 'error':
        console.error(`[${timestamp}] [Security Alert] ${message}`);
        break;
      case 'critical':
        console.error(`[${timestamp}] [CRITICAL SECURITY ALERT] ${message}`);
        break;
    }
  }

  private async sendToLoggingService(event: SecurityEvent) {
    try {
      const payload = {
        ...event,
        environment: process.env.NODE_ENV,
        application: 'yumzoom',
        version: '1.0.0',
      };
      
      // In production, send to your logging service
      if (process.env.NODE_ENV === 'production' && process.env.LOGGING_SERVICE_URL) {
        await fetch(process.env.LOGGING_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_SERVICE_KEY}`
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Failed to send security event to logging service:', error);
    }
  }

  private async sendImmediateAlert(alert: SecurityAlert) {
    try {
      // Send email notification for critical alerts
      if (process.env.SECURITY_ALERT_EMAIL) {
        // Import notifications dynamically to avoid circular dependency
        const { notificationService } = await import('./notifications');
        await notificationService.sendSecurityAlert(
          alert.type,
          alert.message,
          alert
        );
      }

      // Send to external alert service
      if (process.env.ALERT_SERVICE_URL) {
        await fetch(process.env.ALERT_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ALERT_SERVICE_KEY}`
          },
          body: JSON.stringify(alert)
        });
      }
    } catch (error) {
      console.error('Failed to send immediate alert:', error);
    }
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
