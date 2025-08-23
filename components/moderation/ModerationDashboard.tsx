'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { 
  Shield, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  MessageSquare,
  Image,
  User,
  TrendingUp,
  Activity
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContentReport {
  id: string;
  reporter_user_id: string;
  content_type: string;
  content_id: string;
  report_category: string;
  report_reason: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
}

interface ModerationQueueItem {
  id: string;
  content_type: string;
  content_id: string;
  content_data: any;
  moderation_reason: string;
  ai_confidence_score?: number;
  priority_level: number;
  status: string;
  created_at: string;
}

interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  queue_items: number;
  high_priority_items: number;
  resolved_today: number;
}

export function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total_reports: 0,
    pending_reports: 0,
    queue_items: 0,
    high_priority_items: 0,
    resolved_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      // Load reports
      const reportsResponse = await fetch('/api/moderation/reports', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }

      // Load queue items
      const queueResponse = await fetch('/api/moderation/queue', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setQueueItems(queueData.queue_items || []);
      }

      // Calculate stats
      const pendingReports = reports.filter(r => r.status === 'pending').length;
      const highPriorityItems = queueItems.filter(q => q.priority_level === 1).length;
      const resolvedToday = reports.filter(r => 
        r.status === 'resolved' && 
        new Date(r.reviewed_at || '').toDateString() === new Date().toDateString()
      ).length;

      setStats({
        total_reports: reports.length,
        pending_reports: pendingReports,
        queue_items: queueItems.length,
        high_priority_items: highPriorityItems,
        resolved_today: resolvedToday
      });

    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, status: string, notes?: string) => {
    setProcessingItem(reportId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/moderation/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          report_id: reportId,
          status,
          admin_notes: notes
        })
      });

      if (response.ok) {
        await loadModerationData(); // Reload data
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleQueueAction = async (queueId: string, decision: string, notes?: string) => {
    setProcessingItem(queueId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/moderation/queue', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          queue_id: queueId,
          decision,
          notes,
          action_taken: decision
        })
      });

      if (response.ok) {
        await loadModerationData(); // Reload data
      }
    } catch (error) {
      console.error('Error processing queue item:', error);
    } finally {
      setProcessingItem(null);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <MessageSquare className="h-4 w-4" />;
      case 'photo': return <Image className="h-4 w-4" />;
      case 'response': return <MessageSquare className="h-4 w-4" />;
      case 'profile': return <User className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'inappropriate': return 'bg-red-100 text-red-800';
      case 'spam': return 'bg-orange-100 text-orange-800';
      case 'fake': return 'bg-yellow-100 text-yellow-800';
      case 'harassment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Content Moderation Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage platform content quality</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total_reports}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending_reports}</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.queue_items}</p>
                <p className="text-sm text-muted-foreground">Queue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.high_priority_items}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved_today}</p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Content Reports</TabsTrigger>
          <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Recent Reports
                </CardTitle>
                <CardDescription>Latest content reports requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getContentTypeIcon(report.content_type)}
                        <div>
                          <Badge className={getCategoryColor(report.report_category)}>
                            {report.report_category}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.content_type} • {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* High Priority Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  High Priority Queue
                </CardTitle>
                <CardDescription>AI-flagged content requiring immediate review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {queueItems
                    .filter(item => item.priority_level === 1)
                    .slice(0, 5)
                    .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getContentTypeIcon(item.content_type)}
                        <div>
                          <p className="font-medium text-sm">{item.moderation_reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.content_type} • {item.ai_confidence_score && `${Math.round(item.ai_confidence_score * 100)}% confidence`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(item.priority_level)}>
                        High Priority
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
              <CardDescription>Review and manage user-submitted content reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <ReportItem
                    key={report.id}
                    report={report}
                    onAction={handleReportAction}
                    processing={processingItem === report.id}
                  />
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No content reports to review
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Queue</CardTitle>
              <CardDescription>AI-flagged content requiring manual review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queueItems.map((item) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    onAction={handleQueueAction}
                    processing={processingItem === item.id}
                  />
                ))}
                {queueItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No items in moderation queue
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['inappropriate', 'spam', 'fake', 'harassment', 'other'].map(category => {
                    const count = reports.filter(r => r.report_category === category).length;
                    const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['review', 'photo', 'response', 'profile'].map(type => {
                    const count = reports.filter(r => r.content_type === type).length;
                    const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Report Item Component
function ReportItem({ 
  report, 
  onAction, 
  processing 
}: { 
  report: ContentReport; 
  onAction: (id: string, status: string, notes?: string) => void;
  processing: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(report.report_category)}>
                {report.report_category}
              </Badge>
              <Badge variant="outline">{report.content_type}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(report.created_at).toLocaleString()}
              </span>
            </div>
            
            {report.report_reason && (
              <p className="text-sm text-gray-700 mb-3">{report.report_reason}</p>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>

            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add admin notes..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction(report.id, 'reviewed', notes)}
                      disabled={processing}
                    >
                      Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onAction(report.id, 'resolved', notes)}
                      disabled={processing}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAction(report.id, 'dismissed', notes)}
                      disabled={processing}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
            {report.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Queue Item Component
function QueueItem({ 
  item, 
  onAction, 
  processing 
}: { 
  item: ModerationQueueItem; 
  onAction: (id: string, decision: string, notes?: string) => void;
  processing: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className={`border-l-4 ${item.priority_level === 1 ? 'border-l-red-500' : item.priority_level === 2 ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getPriorityColor(item.priority_level)}>
                Priority {item.priority_level}
              </Badge>
              <Badge variant="outline">{item.content_type}</Badge>
              {item.ai_confidence_score && (
                <Badge variant="secondary">
                  {Math.round(item.ai_confidence_score * 100)}% confidence
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
            
            <p className="text-sm font-medium mb-2">{item.moderation_reason}</p>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetails ? 'Hide' : 'Review'} Content
            </Button>

            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <div className="space-y-3">
                  {item.content_data && (
                    <div className="text-sm">
                      <strong>Content:</strong>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border">
                        {JSON.stringify(item.content_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add moderation notes..."
                    rows={2}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onAction(item.id, 'approved', notes)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onAction(item.id, 'rejected', notes)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Badge variant={item.status === 'pending' ? 'destructive' : 'secondary'}>
            {item.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'inappropriate': return 'bg-red-100 text-red-800';
    case 'spam': return 'bg-orange-100 text-orange-800';
    case 'fake': return 'bg-yellow-100 text-yellow-800';
    case 'harassment': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: number) {
  switch (priority) {
    case 1: return 'bg-red-100 text-red-800';
    case 2: return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-green-100 text-green-800';
  }
}
