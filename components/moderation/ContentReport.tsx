'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Flag, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContentReportProps {
  contentType: 'review' | 'photo' | 'response' | 'profile';
  contentId: string;
  reporterName?: string;
  triggerComponent?: React.ReactNode;
}

interface ReportFormData {
  category: string;
  reason: string;
}

const REPORT_CATEGORIES = [
  { value: 'inappropriate', label: 'Inappropriate Content', description: 'Contains offensive or inappropriate material' },
  { value: 'spam', label: 'Spam', description: 'Promotional content or repetitive posting' },
  { value: 'fake', label: 'Fake Review', description: 'Appears to be a fake or misleading review' },
  { value: 'harassment', label: 'Harassment', description: 'Contains harassment or bullying behavior' },
  { value: 'other', label: 'Other', description: 'Other violation not listed above' }
];

export function ContentReport({ 
  contentType, 
  contentId, 
  reporterName = 'Anonymous',
  triggerComponent 
}: ContentReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    category: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      setErrorMessage('Please select a report category');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrorMessage('You must be logged in to report content');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/moderation/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          category: formData.category,
          reason: formData.reason.trim() || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      setSubmitStatus('success');
      
      // Reset form after short delay
      setTimeout(() => {
        setIsOpen(false);
        setFormData({ category: '', reason: '' });
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = REPORT_CATEGORIES.find(cat => cat.value === formData.category);

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Flag className="h-4 w-4 mr-1" />
      Report
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerComponent || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Report Submitted Successfully
            </h3>
            <p className="text-sm text-green-600">
              Thank you for helping keep our community safe. We'll review this report promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <option value="">Select a category</option>
                {REPORT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label} - {category.description}
                  </option>
                ))}
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Details (Optional)</label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Provide any additional context that might help our moderation team..."
                rows={3}
                className="resize-none"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Help us understand the issue better</span>
                <span>{formData.reason.length}/500</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-blue-700">
                  <strong>What happens next:</strong>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Our moderation team will review this report</li>
                    <li>• Reports are handled confidentially</li>
                    <li>• We'll take appropriate action if violations are found</li>
                    <li>• False reports may affect your account standing</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                disabled={isSubmitting || !formData.category}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quality Score Display Component
interface QualityScoreProps {
  score: number;
  showDetails?: boolean;
  className?: string;
}

export function QualityScore({ score, showDetails = false, className = '' }: QualityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Quality';
    if (score >= 0.6) return 'Good Quality';
    if (score >= 0.4) return 'Fair Quality';
    return 'Low Quality';
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className={getScoreColor(score)}>
        {getScoreLabel(score)}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          ({Math.round(score * 100)}% quality)
        </span>
      )}
    </div>
  );
}

// Trust Score Display Component
interface TrustScoreProps {
  trustScore: number;
  reputationPoints?: number;
  accountStatus?: string;
  showDetails?: boolean;
  className?: string;
}

export function TrustScore({ 
  trustScore, 
  reputationPoints = 0, 
  accountStatus = 'good_standing',
  showDetails = false, 
  className = '' 
}: TrustScoreProps) {
  const getTrustColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrustLabel = (score: number) => {
    if (score >= 0.8) return 'Trusted Reviewer';
    if (score >= 0.6) return 'Reliable';
    if (score >= 0.4) return 'Active';
    return 'New Member';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good_standing': return '✅';
      case 'warning': return '⚠️';
      case 'restricted': return '⚠️';
      case 'suspended': return '❌';
      default: return '•';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className={getTrustColor(trustScore)}>
        {getStatusIcon(accountStatus)} {getTrustLabel(trustScore)}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {reputationPoints} pts • {Math.round(trustScore * 100)}% trust
        </span>
      )}
    </div>
  );
}
