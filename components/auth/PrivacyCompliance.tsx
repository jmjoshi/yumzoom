'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PrivacySettings {
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  activityTracking: boolean;
  emailNotifications: boolean;
  dataRetention: 'standard' | 'minimal' | 'extended';
}

interface DataRequest {
  id: string;
  type: 'export' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

interface ConsentRecord {
  consentType: string;
  granted: boolean;
  grantedAt: Date;
  version: string;
}

export default function PrivacyCompliance() {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPrivacyData();
    }
  }, [user]);

  const fetchPrivacyData = async () => {
    try {
      const [settingsRes, consentRes, requestsRes] = await Promise.all([
        fetch('/api/privacy/settings'),
        fetch('/api/privacy/consent'),
        fetch('/api/privacy/requests')
      ]);

      const [settings, consent, requests] = await Promise.all([
        settingsRes.json(),
        consentRes.json(),
        requestsRes.json()
      ]);

      setPrivacySettings(settings);
      setConsentRecords(consent);
      setDataRequests(requests);
    } catch (error) {
      setError('Failed to load privacy data');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: any) => {
    try {
      const newSettings = { ...privacySettings!, [key]: value };
      
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setPrivacySettings(newSettings);
        setSuccess('Privacy settings updated');
      } else {
        setError('Failed to update settings');
      }
    } catch (error) {
      setError('Failed to update settings');
    }
  };

  const requestDataExport = async (type: 'gdpr' | 'ccpa' | 'general' = 'general') => {
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: type }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Data export request submitted. Request ID: ${data.requestId}`);
        await fetchPrivacyData();
      } else {
        setError('Failed to request data export');
      }
    } catch (error) {
      setError('Failed to request data export');
    }
  };

  const requestDataDeletion = async (type: 'gdpr' | 'ccpa' | 'general' = 'general') => {
    if (!confirm('Are you sure you want to request account deletion? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: type }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Data deletion request submitted. Request ID: ${data.requestId}`);
        await fetchPrivacyData();
      } else {
        setError('Failed to request data deletion');
      }
    } catch (error) {
      setError('Failed to request data deletion');
    }
  };

  const updateConsent = async (consentType: string, granted: boolean) => {
    try {
      const response = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          consents: { [consentType]: granted }
        }),
      });

      if (response.ok) {
        setSuccess('Consent preferences updated');
        await fetchPrivacyData();
      } else {
        setError('Failed to update consent');
      }
    } catch (error) {
      setError('Failed to update consent');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="default"><Settings className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'completed':
        return <Badge variant="primary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading privacy settings...</div>;
  }

  if (!user) {
    return <div>Please log in to manage your privacy settings.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Privacy & Data Protection</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {privacySettings && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Processing</p>
                    <p className="text-sm text-gray-600">Allow processing of your data for platform functionality</p>
                  </div>
                  <Switch
                    checked={privacySettings.dataProcessing}
                    onCheckedChange={(checked) => updatePrivacySetting('dataProcessing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Communications</p>
                    <p className="text-sm text-gray-600">Receive promotional emails and offers</p>
                  </div>
                  <Switch
                    checked={privacySettings.marketing}
                    onCheckedChange={(checked) => updatePrivacySetting('marketing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-gray-600">Help us improve by sharing usage data</p>
                  </div>
                  <Switch
                    checked={privacySettings.analytics}
                    onCheckedChange={(checked) => updatePrivacySetting('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activity Tracking</p>
                    <p className="text-sm text-gray-600">Track your activity for personalized recommendations</p>
                  </div>
                  <Switch
                    checked={privacySettings.activityTracking}
                    onCheckedChange={(checked) => updatePrivacySetting('activityTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={privacySettings.emailNotifications}
                    onCheckedChange={(checked) => updatePrivacySetting('emailNotifications', checked)}
                  />
                </div>

                <div>
                  <p className="font-medium mb-2">Profile Visibility</p>
                  <div className="space-y-2">
                    {['public', 'friends', 'private'].map((visibility) => (
                      <label key={visibility} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={visibility}
                          checked={privacySettings.profileVisibility === visibility}
                          onChange={() => updatePrivacySetting('profileVisibility', visibility)}
                        />
                        <span className="capitalize">{visibility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Data Retention</p>
                  <div className="space-y-2">
                    {[
                      { value: 'minimal', label: 'Minimal (Delete after 1 year)' },
                      { value: 'standard', label: 'Standard (Delete after 7 years)' },
                      { value: 'extended', label: 'Extended (Keep indefinitely)' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="dataRetention"
                          value={option.value}
                          checked={privacySettings.dataRetention === option.value}
                          onChange={() => updatePrivacySetting('dataRetention', option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card>
          <CardHeader>
            <CardTitle>Consent Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Manage your consent for different types of data processing. You can withdraw consent at any time.
              </p>
              
              {consentRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{record.consentType.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">
                      {record.granted ? 'Granted' : 'Withdrawn'} on {record.grantedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={record.granted ? 'default' : 'secondary'}>
                      {record.granted ? 'Active' : 'Withdrawn'}
                    </Badge>
                    <Button
                      onClick={() => updateConsent(record.consentType, !record.granted)}
                      variant="outline"
                      size="sm"
                    >
                      {record.granted ? 'Withdraw' : 'Grant'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Rights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle>Data Export (Right to Access)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download a copy of all your personal data stored in our system.
              </p>
              
              <div className="space-y-2">
                <Button onClick={() => requestDataExport('general')} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
                <Button onClick={() => requestDataExport('gdpr')} variant="outline" className="w-full">
                  Request GDPR Export
                </Button>
                <Button onClick={() => requestDataExport('ccpa')} variant="outline" className="w-full">
                  Request CCPA Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Data Deletion (Right to be Forgotten)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Request deletion of your personal data. This action cannot be undone.
              </p>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Account deletion is permanent and cannot be reversed. You will lose access to all your data.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={() => requestDataDeletion('general')} 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Account Deletion
                </Button>
                <Button 
                  onClick={() => requestDataDeletion('gdpr')} 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Request GDPR Deletion
                </Button>
                <Button 
                  onClick={() => requestDataDeletion('ccpa')} 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Request CCPA Deletion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {dataRequests.length > 0 ? (
            <div className="space-y-4">
              {dataRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      {request.type === 'export' ? (
                        <Download className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                      <p className="font-medium capitalize">{request.type} Request</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested: {request.requestedAt.toLocaleDateString()}
                    </p>
                    {request.completedAt && (
                      <p className="text-sm text-gray-600">
                        Completed: {request.completedAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request.status)}
                    {request.status === 'completed' && request.downloadUrl && request.type === 'export' && (
                      <Button
                        onClick={() => window.open(request.downloadUrl, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No data requests found</p>
          )}
        </CardContent>
      </Card>

      {/* Legal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Rights Under GDPR</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure (right to be forgotten)</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your Rights Under CCPA</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </div>

            <div>
              <p>
                For questions about your privacy rights or to file a complaint, contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@yumzoom.com" className="text-primary-600 hover:underline">
                  privacy@yumzoom.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
