'use client';

import { useTranslations } from 'next-intl';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Accessibility,
  Volume2,
  Eye,
  Car,
  Users,
  MessageSquare,
  FileText,
  Heart,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { type RestaurantAccessibility } from '../../lib/accessibility/utils';

interface AccessibilityInfoProps {
  accessibility: RestaurantAccessibility;
  className?: string;
  showReportIssue?: boolean;
  onReportIssue?: () => void;
}

export function AccessibilityInfo({ 
  accessibility, 
  className = '',
  showReportIssue = true,
  onReportIssue
}: AccessibilityInfoProps) {
  const t = useTranslations('accessibility');

  const features = [
    {
      key: 'wheelchairAccessible',
      label: t('wheelchairAccessible'),
      icon: Accessibility,
      available: accessibility.wheelchairAccessible,
    },
    {
      key: 'hearingLoop',
      label: t('hearingLoop'),
      icon: Volume2,
      available: accessibility.hearingLoop,
    },
    {
      key: 'brailleMenu',
      label: t('brailleMenu'),
      icon: FileText,
      available: accessibility.brailleMenu,
    },
    {
      key: 'accessibleParking',
      label: t('accessibleParking'),
      icon: Car,
      available: accessibility.accessibleParking,
    },
    {
      key: 'accessibleRestroom',
      label: t('accessibleRestroom'),
      icon: Users,
      available: accessibility.accessibleRestroom,
    },
    {
      key: 'signLanguageService',
      label: t('signLanguageService'),
      icon: MessageSquare,
      available: accessibility.signLanguageService,
    },
    {
      key: 'largePrintMenu',
      label: t('largePrintMenu'),
      icon: Eye,
      available: accessibility.largePrintMenu,
    },
    {
      key: 'serviceAnimalsWelcome',
      label: t('serviceAnimalsWelcome'),
      icon: Heart,
      available: accessibility.serviceAnimalsWelcome,
    },
  ];

  const availableFeatures = features.filter(feature => feature.available);
  const unavailableFeatures = features.filter(feature => !feature.available);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Accessibility className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">{t('accessibilityFeatures')}</h3>
      </div>

      {availableFeatures.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Available Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="flex items-center gap-2 p-2 bg-green-50 rounded-md"
                >
                  <Icon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{feature.label}</span>
                  <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unavailableFeatures.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Not Available / Unknown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unavailableFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-md opacity-60"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accessibility.accessibilityNotes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Additional Information</h4>
          <p className="text-sm text-blue-700">{accessibility.accessibilityNotes}</p>
        </div>
      )}

      {accessibility.lastVerified && (
        <div className="text-xs text-gray-500 mb-3">
          Last verified: {new Date(accessibility.lastVerified).toLocaleDateString()}
          {accessibility.verifiedBy && ` by ${accessibility.verifiedBy}`}
        </div>
      )}

      {showReportIssue && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReportIssue}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-4 w-4" />
            {t('reportAccessibilityIssue')}
          </Button>
        </div>
      )}

      {availableFeatures.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No accessibility information available</p>
          <p className="text-xs mt-1">
            Help improve accessibility by sharing information about this restaurant
          </p>
        </div>
      )}
    </Card>
  );
}

interface AccessibilityBadgeProps {
  accessibility: RestaurantAccessibility;
  className?: string;
  variant?: 'full' | 'compact' | 'icon-only';
}

export function AccessibilityBadge({ 
  accessibility, 
  className = '',
  variant = 'compact'
}: AccessibilityBadgeProps) {
  const features = [
    { key: 'wheelchairAccessible', icon: Accessibility, available: accessibility.wheelchairAccessible },
    { key: 'hearingLoop', icon: Volume2, available: accessibility.hearingLoop },
    { key: 'brailleMenu', icon: FileText, available: accessibility.brailleMenu },
    { key: 'serviceAnimalsWelcome', icon: Heart, available: accessibility.serviceAnimalsWelcome },
  ];

  const availableCount = features.filter(f => f.available).length;

  if (variant === 'icon-only') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {features.map((feature) => {
          const Icon = feature.icon;
          return feature.available ? (
            <Icon key={feature.key} className="h-4 w-4 text-green-600" />
          ) : null;
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return availableCount > 0 ? (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Accessibility className="h-3 w-3" />
        <span className="text-xs">{availableCount} accessible features</span>
      </Badge>
    ) : null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {features.map((feature) => {
        const Icon = feature.icon;
        return feature.available ? (
          <Badge key={feature.key} variant="secondary" className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            <span className="text-xs">Accessible</span>
          </Badge>
        ) : null;
      })}
    </div>
  );
}
