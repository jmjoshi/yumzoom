'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Languages, 
  Eye, 
  Volume2, 
  MousePointer, 
  Palette, 
  Accessibility,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  getAccessibilityPreferences, 
  saveAccessibilityPreferences,
  applyAccessibilityPreferences,
  type AccessibilityPreferences 
} from '../../lib/accessibility/utils';

interface AccessibilityPanelProps {
  className?: string;
}

export function AccessibilityPanel({ className = '' }: AccessibilityPanelProps) {
  const t = useTranslations('accessibility');
  const locale = useLocale();
  const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const prefs = getAccessibilityPreferences();
    setPreferences(prefs);
    applyAccessibilityPreferences(prefs);
  }, []);

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveAccessibilityPreferences({ [key]: value });
  };

  const resetToDefaults = () => {
    const defaults = {
      fontSize: 'medium' as const,
      contrast: 'normal' as const,
      motionReduced: false,
      screenReader: false,
      keyboardNavigation: false,
      colorBlindness: 'none' as const,
      visualAcuity: 'normal' as const,
      hearingLevel: 'normal' as const,
      motorSkills: 'normal' as const,
      cognitiveLevel: 'normal' as const,
    };
    setPreferences(defaults);
    saveAccessibilityPreferences(defaults);
  };

  if (!preferences) {
    return null;
  }

  const AccessibilityButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsExpanded(!isExpanded)}
      className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg"
      aria-label="Accessibility settings"
      aria-expanded={isExpanded}
    >
      <Accessibility className="h-5 w-5" />
    </Button>
  );

  if (!isExpanded) {
    return <AccessibilityButton />;
  }

  return (
    <>
      <AccessibilityButton />
      <div 
        className={`fixed bottom-20 right-4 z-40 w-80 max-h-[80vh] overflow-y-auto ${className}`}
        role="dialog"
        aria-label="Accessibility settings panel"
      >
        <Card className="p-4 bg-white shadow-xl border-2">
          <div className="flex items-center gap-2 mb-4">
            <Accessibility className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Accessibility Settings</h2>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              <Eye className="inline h-4 w-4 mr-1" />
              Font Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                <Button
                  key={size}
                  variant={preferences.fontSize === size ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updatePreference('fontSize', size)}
                  className="text-xs"
                >
                  {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Contrast */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              <Palette className="inline h-4 w-4 mr-1" />
              Contrast
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'high', 'extra-high'] as const).map((contrast) => (
                <Button
                  key={contrast}
                  variant={preferences.contrast === contrast ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updatePreference('contrast', contrast)}
                  className="text-xs"
                >
                  {contrast.charAt(0).toUpperCase() + contrast.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Motion */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.motionReduced}
                onChange={(e) => updatePreference('motionReduced', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Reduce motion and animations</span>
            </label>
          </div>

          {/* Screen Reader */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.screenReader}
                onChange={(e) => updatePreference('screenReader', e.target.checked)}
                className="rounded"
              />
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">Screen reader optimizations</span>
            </label>
          </div>

          {/* Keyboard Navigation */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.keyboardNavigation}
                onChange={(e) => updatePreference('keyboardNavigation', e.target.checked)}
                className="rounded"
              />
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Enhanced keyboard navigation</span>
            </label>
          </div>

          {/* Color Blindness */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Color Vision Support
            </label>
            <select
              value={preferences.colorBlindness}
              onChange={(e) => updatePreference('colorBlindness', e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="none">No color vision issues</option>
              <option value="protanopia">Protanopia (Red-green)</option>
              <option value="deuteranopia">Deuteranopia (Red-green)</option>
              <option value="tritanopia">Tritanopia (Blue-yellow)</option>
            </select>
          </div>

          {/* Visual Acuity */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Visual Acuity
            </label>
            <select
              value={preferences.visualAcuity}
              onChange={(e) => updatePreference('visualAcuity', e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="normal">Normal vision</option>
              <option value="low-vision">Low vision</option>
              <option value="blind">Blind</option>
            </select>
          </div>

          {/* Hearing Level */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Hearing Level
            </label>
            <select
              value={preferences.hearingLevel}
              onChange={(e) => updatePreference('hearingLevel', e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="normal">Normal hearing</option>
              <option value="hard-of-hearing">Hard of hearing</option>
              <option value="deaf">Deaf</option>
            </select>
          </div>

          {/* Motor Skills */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Motor Skills
            </label>
            <select
              value={preferences.motorSkills}
              onChange={(e) => updatePreference('motorSkills', e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="normal">Normal mobility</option>
              <option value="limited-mobility">Limited mobility</option>
              <option value="voice-control">Voice control preferred</option>
            </select>
          </div>

          {/* Cognitive Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Cognitive Support
            </label>
            <select
              value={preferences.cognitiveLevel}
              onChange={(e) => updatePreference('cognitiveLevel', e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="normal">No cognitive support needed</option>
              <option value="learning-disability">Learning disability support</option>
              <option value="memory-impairment">Memory impairment support</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-1" />
              Done
            </Button>
          </div>

          {/* Current Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Active features:</div>
            <div className="flex flex-wrap gap-1">
              {preferences.fontSize !== 'medium' && (
                <Badge variant="secondary" className="text-xs">
                  {preferences.fontSize} text
                </Badge>
              )}
              {preferences.contrast !== 'normal' && (
                <Badge variant="secondary" className="text-xs">
                  {preferences.contrast} contrast
                </Badge>
              )}
              {preferences.motionReduced && (
                <Badge variant="secondary" className="text-xs">
                  Reduced motion
                </Badge>
              )}
              {preferences.screenReader && (
                <Badge variant="secondary" className="text-xs">
                  Screen reader
                </Badge>
              )}
              {preferences.keyboardNavigation && (
                <Badge variant="secondary" className="text-xs">
                  Keyboard navigation
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
