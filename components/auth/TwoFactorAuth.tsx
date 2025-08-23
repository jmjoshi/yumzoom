'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Shield, Copy, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorStatus {
  isEnabled: boolean;
  lastUsed?: Date;
  backupCodesRemaining: number;
}

export default function TwoFactorAuth() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTwoFactorStatus();
    }
  }, [user]);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/security/two-factor/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const initiateTwoFactorSetup = async () => {
    setIsSettingUp(true);
    setError(null);

    try {
      const response = await fetch('/api/security/two-factor/setup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSetup(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      setError('Failed to setup 2FA');
    } finally {
      setIsSettingUp(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!verificationToken) {
      setError('Please enter the verification token');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/security/two-factor/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (response.ok) {
        setSuccess('Two-factor authentication enabled successfully!');
        setSetup(null);
        setVerificationToken('');
        await fetchTwoFactorStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid verification token');
      }
    } catch (error) {
      setError('Failed to enable 2FA');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableTwoFactor = async () => {
    setIsDisabling(true);
    setError(null);

    try {
      const response = await fetch('/api/security/two-factor/disable', {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Two-factor authentication disabled');
        await fetchTwoFactorStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      const response = await fetch('/api/security/two-factor/regenerate-codes', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSetup({ ...setup!, backupCodes: data.backupCodes });
        setShowBackupCodes(true);
        setSuccess('Backup codes regenerated successfully');
        await fetchTwoFactorStatus();
      } else {
        setError('Failed to regenerate backup codes');
      }
    } catch (error) {
      setError('Failed to regenerate backup codes');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  const downloadBackupCodes = (codes: string[]) => {
    const content = `YumZoom Two-Factor Authentication Backup Codes

Generated: ${new Date().toLocaleDateString()}
Account: ${user?.email}

${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

IMPORTANT:
- Keep these codes in a safe place
- Each code can only be used once
- Use these codes if you lose access to your authenticator app
- Generate new codes if you suspect these have been compromised`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yumzoom-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <div>Please log in to manage two-factor authentication.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">
                    {status.isEnabled
                      ? 'Enabled and protecting your account'
                      : 'Disabled - your account is less secure'}
                  </p>
                </div>
                <Badge variant={status.isEnabled ? 'default' : 'secondary'}>
                  {status.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {status.isEnabled && (
                <>
                  {status.lastUsed && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Last used: {status.lastUsed.toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Codes</p>
                      <p className="text-sm text-gray-600">
                        {status.backupCodesRemaining} codes remaining
                      </p>
                    </div>
                    {status.backupCodesRemaining <= 2 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Low
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={regenerateBackupCodes}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Backup Codes
                    </Button>
                    <Button
                      onClick={disableTwoFactor}
                      variant="outline"
                      size="sm"
                      disabled={isDisabling}
                      className="text-red-600 hover:text-red-700"
                    >
                      Disable 2FA
                    </Button>
                  </div>
                </>
              )}

              {!status.isEnabled && !setup && (
                <Button
                  onClick={initiateTwoFactorSetup}
                  disabled={isSettingUp}
                  className="w-full sm:w-auto"
                >
                  {isSettingUp ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </Button>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Setup Process */}
      {setup && (
        <div className="space-y-6">
          {/* Step 1: Scan QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Set up your authenticator app</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCodeSVG value={setup.qrCodeUrl} size={200} />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {setup.secret}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(setup.secret)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Verify */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Enter verification code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app to verify the setup
                </p>
                
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                  <Button
                    onClick={enableTwoFactor}
                    disabled={isVerifying || verificationToken.length !== 6}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Save your backup codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg">
                  {setup.backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm">
                      {index + 1}. {code}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => copyToClipboard(setup.backupCodes.join('\n'))}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Codes
                  </Button>
                  <Button
                    onClick={() => downloadBackupCodes(setup.backupCodes)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Codes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show regenerated backup codes */}
      {showBackupCodes && setup && status?.isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Your New Backup Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These are your new backup codes. Your old codes are no longer valid.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg">
                {setup.backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm">
                    {index + 1}. {code}
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => copyToClipboard(setup.backupCodes.join('\n'))}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
                <Button
                  onClick={() => downloadBackupCodes(setup.backupCodes)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Codes
                </Button>
                <Button
                  onClick={() => setShowBackupCodes(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Use a reputable authenticator app like Google Authenticator, Authy, or 1Password</p>
            <p>• Store your backup codes in a secure location, separate from your authenticator device</p>
            <p>• Never share your authenticator codes or backup codes with anyone</p>
            <p>• If you lose your authenticator device, use a backup code to sign in and set up a new device</p>
            <p>• Consider setting up 2FA on multiple devices for redundancy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
