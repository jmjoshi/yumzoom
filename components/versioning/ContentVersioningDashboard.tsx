'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  History,
  Clock,
  User,
  ArrowLeft,
  RotateCcw,
  Eye,
  GitBranch,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContentVersion {
  version_id: string;
  version_number: number;
  content_data: any;
  change_summary: string;
  changed_by_name: string;
  change_reason: string;
  created_at: string;
  is_current: boolean;
  changes_count: number;
}

interface VersionDetails {
  version: ContentVersion & { changed_by_name: string };
  changes: any[];
  metadata: any[];
}

export function ContentVersioningDashboard() {
  const searchParams = useSearchParams();
  const initialContentType = searchParams.get('contentType') || 'restaurants';
  const initialContentId = searchParams.get('contentId');

  const [activeTab, setActiveTab] = useState(initialContentType);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionDetails | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);
  const [specificContentId, setSpecificContentId] = useState<string | null>(initialContentId);

  useEffect(() => {
    if (specificContentId) {
      loadSpecificContentVersions(activeTab, specificContentId);
    } else {
      loadVersions(activeTab);
    }
  }, [activeTab, specificContentId]);

  const loadVersions = async (contentType: string) => {
    setLoading(true);
    try {
      // This would load all content items of the specified type
      // For now, we'll show a placeholder
      setVersions([]);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificContentVersions = async (contentType: string, contentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/content-versioning/history?contentType=${contentType}&contentId=${contentId}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVersions(data.history || []);
      }
    } catch (error) {
      console.error('Error loading specific content versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersionDetails = async (versionId: string) => {
    try {
      const response = await fetch(`/api/content-versioning/history/${versionId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        const details = await response.json();
        setSelectedVersion(details);
      }
    } catch (error) {
      console.error('Error loading version details:', error);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm('Are you sure you want to rollback to this version? This will create a new version with the current state and then apply the rollback.')) {
      return;
    }

    setRollbackLoading(versionId);
    try {
      const response = await fetch('/api/content-versioning/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          versionId,
          reason: 'Manual rollback from admin dashboard'
        })
      });

      if (response.ok) {
        alert('Content successfully rolled back!');
        if (specificContentId) {
          loadSpecificContentVersions(activeTab, specificContentId);
        } else {
          loadVersions(activeTab);
        }
        setSelectedVersion(null);
      } else {
        alert('Failed to rollback content');
      }
    } catch (error) {
      console.error('Error performing rollback:', error);
      alert('Error performing rollback');
    } finally {
      setRollbackLoading(null);
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSpecificContentId(null);
    setVersions([]);
  };

  const handleBackToOverview = () => {
    setSpecificContentId(null);
    setVersions([]);
    // Update URL without page reload
    window.history.replaceState({}, '', '/admin/versioning');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getContentTypeDisplay = (type: string) => {
    switch (type) {
      case 'restaurants': return 'Restaurants';
      case 'menu_items': return 'Menu Items';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-blue-600" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Content Versioning System</h1>
          <p className="text-muted-foreground">
            {specificContentId
              ? `Viewing version history for specific content item`
              : 'Track and manage content changes with full version history'
            }
          </p>
        </div>
        {specificContentId && (
          <Button variant="outline" onClick={handleBackToOverview}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Overview
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Changes Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Rollbacks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Conflicts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="menu_items">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {getContentTypeDisplay(activeTab)} Version History
                {specificContentId && ` - Specific Item`}
              </CardTitle>
              <CardDescription>
                {specificContentId
                  ? `Viewing version history for the selected ${getContentTypeDisplay(activeTab).toLowerCase().slice(0, -1)}`
                  : `View and manage version history for ${getContentTypeDisplay(activeTab).toLowerCase()}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading version history...</p>
                  </div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No version history yet
                  </h3>
                  <p className="text-gray-500">
                    Version history will appear here when content is modified.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <VersionHistoryItem
                      key={version.version_id}
                      version={version}
                      onViewDetails={() => loadVersionDetails(version.version_id)}
                      onRollback={() => handleRollback(version.version_id)}
                      rollbackLoading={rollbackLoading === version.version_id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Version Details Modal */}
      {selectedVersion && (
        <VersionDetailsModal
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
          onRollback={() => handleRollback(selectedVersion.version.version_id)}
          rollbackLoading={rollbackLoading === selectedVersion.version.version_id}
        />
      )}
    </div>
  );
}

// Version History Item Component
function VersionHistoryItem({
  version,
  onViewDetails,
  onRollback,
  rollbackLoading
}: {
  version: ContentVersion;
  onViewDetails: () => void;
  onRollback: () => void;
  rollbackLoading: boolean;
}) {
  return (
    <Card className={`border-l-4 ${version.is_current ? 'border-l-green-500' : 'border-l-blue-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={version.is_current ? 'default' : 'secondary'}>
                v{version.version_number}
              </Badge>
              {version.is_current && (
                <Badge className="bg-green-100 text-green-800">
                  Current
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {new Date(version.created_at).toLocaleString()}
              </span>
            </div>

            <h3 className="font-medium mb-1">{version.change_summary}</h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{version.changed_by_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>{version.changes_count} changes</span>
              </div>
            </div>

            {version.change_reason && (
              <p className="text-sm text-muted-foreground mt-2">
                {version.change_reason}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
            {!version.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRollback}
                disabled={rollbackLoading}
                className="text-orange-600 hover:text-orange-800"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {rollbackLoading ? 'Rolling back...' : 'Rollback'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Version Details Modal Component
function VersionDetailsModal({
  version,
  onClose,
  onRollback,
  rollbackLoading
}: {
  version: VersionDetails;
  onClose: () => void;
  onRollback: () => void;
  rollbackLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Version Details</h2>
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>

          {/* Version Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant={version.version.is_current ? 'default' : 'secondary'}>
                  v{version.version.version_number}
                </Badge>
                {version.version.is_current && (
                  <Badge className="bg-green-100 text-green-800">
                    Current Version
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {version.version.change_summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Changed By</label>
                  <p className="text-sm text-muted-foreground">{version.version.changed_by_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Changed At</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(version.version.created_at).toLocaleString()}
                  </p>
                </div>
                {version.version.change_reason && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Reason</label>
                    <p className="text-sm text-muted-foreground">{version.version.change_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Field Changes</CardTitle>
              <CardDescription>
                Detailed changes made in this version
              </CardDescription>
            </CardHeader>
            <CardContent>
              {version.changes.length === 0 ? (
                <p className="text-muted-foreground">No field changes recorded</p>
              ) : (
                <div className="space-y-3">
                  {version.changes.map((change, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <Badge
                        className={
                          change.change_type === 'added' ? 'bg-green-100 text-green-800' :
                          change.change_type === 'deleted' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {change.change_type}
                      </Badge>
                      <div className="flex-1">
                        <span className="font-medium">{change.field_name}</span>
                        <div className="text-sm text-muted-foreground">
                          {change.old_value && change.new_value ? (
                            <span>
                              <span className="line-through text-red-600">{change.old_value}</span>
                              {' → '}
                              <span className="text-green-600">{change.new_value}</span>
                            </span>
                          ) : change.new_value ? (
                            <span className="text-green-600">{change.new_value}</span>
                          ) : (
                            <span className="text-red-600">Removed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Data */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Content Data</CardTitle>
              <CardDescription>
                Complete content snapshot for this version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(version.version.content_data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!version.version.is_current && (
              <Button
                variant="danger"
                onClick={onRollback}
                disabled={rollbackLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {rollbackLoading ? 'Rolling back...' : 'Rollback to This Version'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
