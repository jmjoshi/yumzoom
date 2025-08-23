'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Users,
  Database,
  Network,
  TrendingUp,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';

interface SecurityMetrics {
  failedLogins: number;
  blockedIPs: number;
  suspiciousActivities: number;
  dataBreachAttempts: number;
  complianceViolations: number;
  activeAlerts: number;
  lastSecurityScan?: Date;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  totalUsers: number;
  activeUsers: number;
  twoFactorEnabled: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  metadata?: any;
}

interface SecurityEvent {
  id: string;
  type: 'auth' | 'database' | 'api' | 'network' | 'compliance';
  action: string;
  status: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userId?: string;
  ipAddress?: string;
  details?: any;
}

export default function EnhancedSecurityDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [metricsRes, alertsRes, eventsRes] = await Promise.all([
        fetch('/api/security/metrics'),
        fetch('/api/security/alerts'),
        fetch('/api/security/events')
      ]);

      const [metricsData, alertsData, eventsData] = await Promise.all([
        metricsRes.json(),
        alertsRes.json(),
        eventsRes.json()
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
      setEvents(eventsData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKeys = async () => {
    try {
      const response = await fetch('/api/security/rotate-keys', {
        method: 'POST',
      });

      if (response.ok) {
        alert('API keys rotation initiated');
        await fetchSecurityData();
      } else {
        alert('Failed to rotate keys');
      }
    } catch (error) {
      alert('Failed to rotate keys');
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchSecurityData();
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const blockIP = async (ipAddress: string) => {
    if (!confirm(`Are you sure you want to block IP address ${ipAddress}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ipAddress, 
          reason: 'Manual block from security dashboard' 
        }),
      });

      if (response.ok) {
        alert('IP address blocked successfully');
        await fetchSecurityData();
      } else {
        alert('Failed to block IP address');
      }
    } catch (error) {
      alert('Failed to block IP address');
    }
  };

  const exportSecurityReport = async () => {
    try {
      const response = await fetch('/api/security/export-report');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading security dashboard...</div>;
  }

  if (!user) {
    return <div>Please log in to access the security dashboard.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Enhanced Security Dashboard</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSecurityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportSecurityReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleRotateKeys} variant="primary" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Rotate Keys
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Threat Level */}
      {metrics && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Threat Level</h2>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
              <Badge className={`px-4 py-2 text-lg font-semibold ${getThreatLevelColor(metrics.threatLevel)}`}>
                {metrics.threatLevel.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.failedLogins}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.blockedIPs}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.activeAlerts}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">2FA Adoption</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.totalUsers > 0 ? Math.round((metrics.twoFactorEnabled / metrics.totalUsers) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.twoFactorEnabled} of {metrics.totalUsers} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metrics.suspiciousActivities}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Breach Attempts</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.dataBreachAttempts}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Violations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.complianceViolations}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <h3 className="font-medium">{alert.type}</h3>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.acknowledged ? 'default' : 'secondary'}>
                      {alert.acknowledged ? 'Acknowledged' : 'New'}
                    </Badge>
                    <Badge className={`${getThreatLevelColor(alert.severity)} border-0`}>
                      {alert.severity}
                    </Badge>
                    {!alert.acknowledged && (
                      <div className="flex space-x-1">
                        <Button 
                          onClick={() => acknowledgeAlert(alert.id)}
                          variant="outline" 
                          size="sm"
                        >
                          Acknowledge
                        </Button>
                        <Button 
                          onClick={() => resolveAlert(alert.id)}
                          variant="outline" 
                          size="sm"
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No recent security alerts</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.length > 0 ? (
              events.slice(0, 20).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <span className="font-medium text-sm">
                        {event.type}:{event.action}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        event.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'failure'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                      {event.ipAddress && (
                        <span className="ml-2 text-xs text-gray-500">
                          IP: {event.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    {event.details && (
                      <Button
                        onClick={() => setShowDetails(prev => ({ 
                          ...prev, 
                          [event.id]: !prev[event.id] 
                        }))}
                        variant="outline"
                        size="sm"
                      >
                        {showDetails[event.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    )}
                    {event.ipAddress && (
                      <Button
                        onClick={() => blockIP(event.ipAddress!)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Block IP
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No recent security events</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
