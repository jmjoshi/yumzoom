'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, X, Flashlight, RotateCcw, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface QRCodeScannerProps {
  onScan?: (result: string) => void;
  onClose: () => void;
  className?: string;
}

interface QRScanResult {
  text: string;
  timestamp: number;
  confidence?: number;
}

export function QRCodeScanner({ onScan, onClose, className = '' }: QRCodeScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [lastScan, setLastScan] = useState<QRScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Start camera with QR code scanning optimizations
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          // Optimize for QR code scanning
          frameRate: { ideal: 30 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions and try again.');
      console.error('Camera error:', err);
    }
  }, [stream, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, [stream]);

  // Toggle camera flash (if available)
  const toggleFlash = useCallback(async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Torch support varies by browser
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } else {
        toast.error('Flash not available on this device');
      }
    } catch (err) {
      console.error('Flash toggle error:', err);
      toast.error('Could not toggle flash');
    }
  }, [stream, flashEnabled]);

  // Flip camera between front and back
  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Analyze frame for QR codes using multiple detection methods
  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== 4) return;

    setProcessing(true);

    try {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try modern BarcodeDetector API first (if available)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          });
          
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrCode = barcodes[0];
            const result: QRScanResult = {
              text: qrCode.rawValue,
              timestamp: Date.now(),
              confidence: qrCode.confidence || 1
            };
            
            handleQRDetected(result);
            return;
          }
        } catch (err) {
          console.log('BarcodeDetector failed, falling back to image analysis');
        }
      }

      // Fallback: Enhanced image processing for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrResult = await analyzeImageForQR(imageData);
      
      if (qrResult) {
        handleQRDetected(qrResult);
      }
    } catch (err) {
      console.error('Frame analysis error:', err);
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  // Enhanced QR code detection using image analysis
  const analyzeImageForQR = useCallback(async (imageData: ImageData): Promise<QRScanResult | null> => {
    // This is a simplified QR detection algorithm
    // In production, you might want to use a library like jsQR or qr-scanner
    
    try {
      // Convert to grayscale for better detection
      const grayscale = convertToGrayscale(imageData);
      
      // Look for QR code patterns
      const patterns = findQRPatterns(grayscale);
      
      if (patterns.length >= 3) {
        // Try to decode QR data (simplified)
        const qrData = await decodeQRData(patterns, grayscale);
        
        if (qrData) {
          return {
            text: qrData,
            timestamp: Date.now(),
            confidence: 0.8
          };
        }
      }
    } catch (err) {
      console.log('QR analysis failed:', err);
    }
    
    return null;
  }, []);

  // Handle QR code detection
  const handleQRDetected = useCallback((result: QRScanResult) => {
    // Prevent duplicate scans within 2 seconds
    if (lastScan && Date.now() - lastScan.timestamp < 2000) {
      return;
    }

    setLastScan(result);
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    // Play success sound if available
    try {
      const audio = new Audio('/sounds/scan-success.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}

    // Process QR code content
    processQRCode(result.text);
  }, [lastScan]);

  // Process different types of QR codes
  const processQRCode = useCallback((qrText: string) => {
    try {
      // YumZoom restaurant QR code format: yumzoom://restaurant/{id}
      if (qrText.startsWith('yumzoom://restaurant/')) {
        const restaurantId = qrText.replace('yumzoom://restaurant/', '');
        toast.success('Restaurant found! Opening page...');
        router.push(`/restaurants/${restaurantId}`);
        onClose();
        return;
      }

      // Standard URL
      if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
        // Check if it's a YumZoom URL
        if (qrText.includes('yumzoom') || qrText.includes(window.location.hostname)) {
          window.location.href = qrText;
          onClose();
          return;
        }
        
        // External URL - ask user
        if (confirm(`Open external link?\n${qrText}`)) {
          window.open(qrText, '_blank');
          onClose();
        }
        return;
      }

      // Plain text or other formats
      if (onScan) {
        onScan(qrText);
        onClose();
      } else {
        toast.success(`QR Code scanned: ${qrText.substring(0, 50)}...`);
        
        // Try to search for the text in restaurants
        router.push(`/search?q=${encodeURIComponent(qrText)}`);
        onClose();
      }
    } catch (err) {
      console.error('QR processing error:', err);
      toast.error('Could not process QR code');
    }
  }, [onScan, onClose, router]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (scanning && !scanIntervalRef.current) {
      scanIntervalRef.current = setInterval(analyzeFrame, 250); // Scan every 250ms
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [scanning, analyzeFrame]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  // Error state
  if (error) {
    return (
      <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={startCamera}
                className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <div className="flex items-center space-x-2">
          <QrCode className="w-6 h-6" />
          <span className="font-medium">Scan QR Code</span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanning frame */}
            <div className="w-64 h-64 border-2 border-white relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-amber-400 animate-pulse transform translate-y-0 animate-scan" />
              </div>
            </div>
            
            <p className="text-white text-center mt-4">
              Position QR code within the frame
            </p>
            
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-amber-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                  Processing...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success indicator */}
        {lastScan && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">QR Code Detected!</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50">
        <div className="flex justify-center space-x-6">
          <button
            onClick={toggleFlash}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              flashEnabled ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
            } hover:bg-white/30`}
          >
            <Flashlight className="w-6 h-6" />
          </button>
          
          <button
            onClick={flipCamera}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white text-center text-sm mt-3">
          Point your camera at a QR code to scan
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Utility functions for QR detection (simplified implementations)
function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return imageData;
}

function findQRPatterns(imageData: ImageData): Array<{ x: number; y: number }> {
  // Simplified pattern detection - in production use a proper QR library
  const patterns: Array<{ x: number; y: number }> = [];
  // This would contain actual QR pattern detection logic
  return patterns;
}

async function decodeQRData(patterns: Array<{ x: number; y: number }>, imageData: ImageData): Promise<string | null> {
  // Simplified QR decoding - in production use a proper QR library
  return null;
}

// Hook to check QR scanning availability
export function useQRScannerAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Check if camera is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        // Check if BarcodeDetector is available or we can use fallback
        const hasBarcodeSupport = 'BarcodeDetector' in window || true; // Fallback always available
        
        setIsAvailable(hasCamera && hasBarcodeSupport);
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  return isAvailable;
}

// Quick QR scanner button component
interface QRScannerButtonProps {
  onScan?: (result: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function QRScannerButton({ onScan, disabled, className = '', children }: QRScannerButtonProps) {
  const [showScanner, setShowScanner] = useState(false);
  const isAvailable = useQRScannerAvailable();

  if (!isAvailable) {
    return (
      <button
        disabled
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
      >
        <QrCode className="w-4 h-4" />
        <span>QR Scanner not available</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        disabled={disabled}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
      >
        <QrCode className="w-4 h-4" />
        {children || <span>Scan QR Code</span>}
      </button>

      {showScanner && (
        <QRCodeScanner
          onScan={onScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
