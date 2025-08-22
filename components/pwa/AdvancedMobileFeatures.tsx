'use client';

import { useState, useEffect } from 'react';
import { QrCode, Mic, Camera, Smartphone, Settings, X, HelpCircle, Zap } from 'lucide-react';
import { QRCodeScanner, QRScannerButton, useQRScannerAvailable } from './QRCodeScanner';
import { VoiceSearch, VoiceSearchButton, useVoiceSearchAvailable } from './VoiceSearch';
import { VisualSearch, VisualSearchButton, useVisualSearchAvailable } from './VisualSearch';
import { AdvancedGesture, GestureTutorial } from './AdvancedGestures';
import { usePWA } from './PWAProvider';
import toast from 'react-hot-toast';

interface AdvancedMobileFeaturesProps {
  className?: string;
}

interface FeatureStats {
  qrScansCount: number;
  voiceSearchCount: number;
  visualSearchCount: number;
  gesturesUsed: number;
}

export function AdvancedMobileFeatures({ className = '' }: AdvancedMobileFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [featureStats, setFeatureStats] = useState<FeatureStats>({
    qrScansCount: 0,
    voiceSearchCount: 0,
    visualSearchCount: 0,
    gesturesUsed: 0,
  });
  const [enabledFeatures, setEnabledFeatures] = useState({
    qrScanner: true,
    voiceSearch: true,
    visualSearch: true,
    advancedGestures: true,
    hapticFeedback: true,
    soundEffects: true,
  });

  const { isStandalone, deviceType } = usePWA();
  const isQRAvailable = useQRScannerAvailable();
  const isVoiceAvailable = useVoiceSearchAvailable();
  const isVisualAvailable = useVisualSearchAvailable();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('yumzoom-mobile-features');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setEnabledFeatures(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to load mobile feature settings:', error);
      }
    }

    const savedStats = localStorage.getItem('yumzoom-feature-stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setFeatureStats(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to load feature stats:', error);
      }
    }

    // Show tutorial for first-time users
    const hasSeenTutorial = localStorage.getItem('yumzoom-gestures-tutorial');
    if (!hasSeenTutorial && deviceType === 'mobile') {
      setTimeout(() => setShowTutorial(true), 2000);
    }
  }, [deviceType]);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<typeof enabledFeatures>) => {
    const updated = { ...enabledFeatures, ...newSettings };
    setEnabledFeatures(updated);
    localStorage.setItem('yumzoom-mobile-features', JSON.stringify(updated));
  };

  // Update feature stats
  const updateStats = (feature: keyof FeatureStats) => {
    const newStats = {
      ...featureStats,
      [feature]: featureStats[feature] + 1,
    };
    setFeatureStats(newStats);
    localStorage.setItem('yumzoom-feature-stats', JSON.stringify(newStats));
  };

  // Feature handlers
  const handleQRScan = (result: string) => {
    updateStats('qrScansCount');
    toast.success('QR Code scanned successfully!');
    // Handle the scan result
    console.log('QR Scan result:', result);
  };

  const handleVoiceSearch = (query: string) => {
    updateStats('voiceSearchCount');
    toast.success(`Voice search: "${query}"`);
    // Handle the voice search
    console.log('Voice search query:', query);
  };

  const handleVisualSearch = (results: any[]) => {
    updateStats('visualSearchCount');
    toast.success(`Found ${results.length} visual matches!`);
    // Handle the visual search results
    console.log('Visual search results:', results);
  };

  const handleGestureUsed = () => {
    updateStats('gesturesUsed');
  };

  // Close active feature
  const closeActiveFeature = () => {
    setActiveFeature(null);
  };

  // Feature availability check
  const getAvailableFeatures = () => {
    return {
      qr: isQRAvailable && enabledFeatures.qrScanner,
      voice: isVoiceAvailable && enabledFeatures.voiceSearch,
      visual: isVisualAvailable && enabledFeatures.visualSearch,
      gestures: enabledFeatures.advancedGestures,
    };
  };

  const availableFeatures = getAvailableFeatures();
  const totalAvailable = Object.values(availableFeatures).filter(Boolean).length;

  if (!isStandalone && deviceType !== 'mobile') {
    return null; // Only show on mobile devices or installed PWA
  }

  return (
    <AdvancedGesture
      onSwipeUp={() => {
        if (enabledFeatures.advancedGestures) {
          setShowSettings(true);
          handleGestureUsed();
        }
      }}
      onThreeFingerTap={() => {
        if (enabledFeatures.advancedGestures) {
          setShowTutorial(true);
          handleGestureUsed();
        }
      }}
      enableHapticFeedback={enabledFeatures.hapticFeedback}
      className={className}
    >
      <div className="fixed bottom-4 right-4 z-40">
        {/* Main features button */}
        <div className="relative">
          <button
            onClick={() => setActiveFeature(activeFeature ? null : 'menu')}
            className={`w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
              activeFeature ? 'rotate-45' : ''
            }`}
          >
            {activeFeature ? (
              <X className="w-6 h-6 mx-auto" />
            ) : (
              <Zap className="w-6 h-6 mx-auto" />
            )}
          </button>

          {/* Feature count badge */}
          {totalAvailable > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {totalAvailable}
            </div>
          )}
        </div>

        {/* Feature menu */}
        {activeFeature === 'menu' && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-4 min-w-[280px]">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Mobile Features</h3>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* QR Scanner */}
              {availableFeatures.qr && (
                <div className="flex items-center space-x-3">
                  <QRScannerButton
                    onScan={handleQRScan}
                    className="flex-1 justify-start"
                  >
                    <span>QR Code Scanner</span>
                  </QRScannerButton>
                  <div className="text-xs text-gray-500">
                    {featureStats.qrScansCount} scans
                  </div>
                </div>
              )}

              {/* Voice Search */}
              {availableFeatures.voice && (
                <div className="flex items-center space-x-3">
                  <VoiceSearchButton
                    onSearch={handleVoiceSearch}
                    className="flex-1 justify-start"
                  >
                    <span>Voice Search</span>
                  </VoiceSearchButton>
                  <div className="text-xs text-gray-500">
                    {featureStats.voiceSearchCount} searches
                  </div>
                </div>
              )}

              {/* Visual Search */}
              {availableFeatures.visual && (
                <div className="flex items-center space-x-3">
                  <VisualSearchButton
                    onSearchResults={handleVisualSearch}
                    className="flex-1 justify-start"
                  >
                    <span>Visual Search</span>
                  </VisualSearchButton>
                  <div className="text-xs text-gray-500">
                    {featureStats.visualSearchCount} searches
                  </div>
                </div>
              )}

              {/* Gesture Info */}
              {availableFeatures.gestures && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Advanced Gestures</span>
                    <button
                      onClick={() => setShowTutorial(true)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Learn More
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {featureStats.gesturesUsed} gestures used
                  </div>
                </div>
              )}

              {/* No features available */}
              {totalAvailable === 0 && (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <Smartphone className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">
                    No advanced features available on this device
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Mobile Features Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Feature toggles */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Available Features</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <QrCode className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">QR Code Scanner</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.qrScanner}
                      onChange={(e) => saveSettings({ qrScanner: e.target.checked })}
                      disabled={!isQRAvailable}
                      className="rounded border-gray-300"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mic className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Voice Search</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.voiceSearch}
                      onChange={(e) => saveSettings({ voiceSearch: e.target.checked })}
                      disabled={!isVoiceAvailable}
                      className="rounded border-gray-300"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Camera className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Visual Search</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.visualSearch}
                      onChange={(e) => saveSettings({ visualSearch: e.target.checked })}
                      disabled={!isVisualAvailable}
                      className="rounded border-gray-300"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Advanced Gestures</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.advancedGestures}
                      onChange={(e) => saveSettings({ advancedGestures: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  </label>
                </div>
              </div>

              {/* Experience settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Experience</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Haptic Feedback</span>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.hapticFeedback}
                      onChange={(e) => saveSettings({ hapticFeedback: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm">Sound Effects</span>
                    <input
                      type="checkbox"
                      checked={enabledFeatures.soundEffects}
                      onChange={(e) => saveSettings({ soundEffects: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  </label>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Usage Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{featureStats.qrScansCount}</div>
                    <div className="text-gray-600">QR Scans</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{featureStats.voiceSearchCount}</div>
                    <div className="text-gray-600">Voice Searches</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{featureStats.visualSearchCount}</div>
                    <div className="text-gray-600">Visual Searches</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{featureStats.gesturesUsed}</div>
                    <div className="text-gray-600">Gestures</div>
                  </div>
                </div>
              </div>

              {/* Help */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowTutorial(true);
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm">View Gesture Tutorial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gesture Tutorial */}
      {showTutorial && (
        <GestureTutorial
          onClose={() => {
            setShowTutorial(false);
            localStorage.setItem('yumzoom-gestures-tutorial', 'seen');
          }}
        />
      )}
    </AdvancedGesture>
  );
}

// Hook to check if advanced mobile features are available
export function useAdvancedMobileFeaturesAvailable() {
  const isQRAvailable = useQRScannerAvailable();
  const isVoiceAvailable = useVoiceSearchAvailable();
  const isVisualAvailable = useVisualSearchAvailable();
  const { deviceType } = usePWA();

  return {
    isAvailable: deviceType === 'mobile' && (isQRAvailable || isVoiceAvailable || isVisualAvailable),
    features: {
      qr: isQRAvailable,
      voice: isVoiceAvailable,
      visual: isVisualAvailable,
      gestures: true, // Always available
    },
    deviceType,
  };
}

// Export individual components for use elsewhere
export {
  QRCodeScanner,
  QRScannerButton,
  VoiceSearch,
  VoiceSearchButton,
  VisualSearch,
  VisualSearchButton,
  AdvancedGesture,
  GestureTutorial,
};
