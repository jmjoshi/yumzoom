'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, Image as ImageIcon } from 'lucide-react';

interface CameraComponentProps {
  onPhotoCapture: (file: File) => void;
  onClose: () => void;
  className?: string;
}

export function CameraComponent({ onPhotoCapture, onClose, className = '' }: CameraComponentProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  }, [stream, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageUrl);

      // Create File object
      const file = new File([blob], `restaurant-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      onPhotoCapture(file);
      stopCamera();
    }, 'image/jpeg', 0.8);
  }, [onPhotoCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Start camera when component mounts
  useState(() => {
    startCamera();
    return () => stopCamera();
  });

  // Restart camera when facing mode changes
  useState(() => {
    if (stream) {
      startCamera();
    }
  });

  if (error) {
    return (
      <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        <div className="p-4 bg-black/50">
          <div className="flex justify-center space-x-4">
            <button
              onClick={retakePhoto}
              className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retake</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700"
            >
              <Check className="w-5 h-5" />
              <span>Use Photo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Camera controls overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={flipCamera}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>

        {/* Capture button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={capturePhoto}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
          >
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Hook to check camera availability
export function useCameraAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useState(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setIsAvailable(hasCamera);
      } catch {
        setIsAvailable(false);
      }
    };

    checkCamera();
  });

  return isAvailable;
}

// Quick camera button component
interface CameraButtonProps {
  onPhotoCapture: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function CameraButton({ onPhotoCapture, disabled, className = '' }: CameraButtonProps) {
  const [showCamera, setShowCamera] = useState(false);
  const isCameraAvailable = useCameraAvailable();

  if (!isCameraAvailable) {
    return (
      <button
        disabled
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
      >
        <ImageIcon className="w-4 h-4" />
        <span>Camera not available</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowCamera(true)}
        disabled={disabled}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
      >
        <Camera className="w-4 h-4" />
        <span>Take Photo</span>
      </button>

      {showCamera && (
        <CameraComponent
          onPhotoCapture={(file) => {
            onPhotoCapture(file);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
