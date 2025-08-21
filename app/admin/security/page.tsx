'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SecurityMetrics {
  failedLogins: number;
  blockedIPs: number;
  activeKeys: number;
  keyRotationsNeeded: number;
  recentAlerts: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

export default function SecurityDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [metricsRes, alertsRes] = await Promise.all([
        fetch('/api/security/metrics'),
        fetch('/api/security/alerts')
      ]);

      const [metricsData, alertsData] = await Promise.all([
        metricsRes.json(),
        alertsRes.json()
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKeys = async () => {
    try {
      const res = await fetch('/api/security/rotate-keys', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to rotate keys');
      
      await fetchSecurityData(); // Refresh data
    } catch (error) {
      console.error('Error rotating keys:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <Button onClick={handleRotateKeys} variant="primary">
          Rotate API Keys
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Failed Login Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.failedLogins || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.blockedIPs || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {metrics?.activeKeys || 0}
            </div>
            {(metrics?.keyRotationsNeeded ?? 0) > 0 && (
              <p className="text-sm text-red-500 mt-2">
                {metrics?.keyRotationsNeeded} key(s) need rotation
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {alerts.map((alert) => (
              <div key={alert.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{alert.type}</h3>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-center py-4 text-gray-500">
                No recent security alerts
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
