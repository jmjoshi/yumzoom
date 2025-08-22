'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Search, ImageIcon, Loader2, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CameraComponent } from './CameraComponent';
import toast from 'react-hot-toast';

interface VisualSearchProps {
  onSearchResults?: (results: any[]) => void;
  onClose?: () => void;
  className?: string;
}

interface VisualSearchResult {
  type: 'restaurant' | 'food' | 'menu_item';
  confidence: number;
  data: any;
}

interface ImageAnalysisResult {
  labels: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  objects: Array<{
    name: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;
  text: Array<{
    text: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;
}

export function VisualSearch({ onSearchResults, onClose, className = '' }: VisualSearchProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VisualSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle photo capture from camera
  const handlePhotoCapture = useCallback(async (file: File) => {
    setCapturedImage(URL.createObjectURL(file));
    setShowCamera(false);
    setError(null);
    
    // Start analysis immediately
    await analyzeImage(file);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select an image under 10MB.');
      return;
    }

    setUploadedFile(file);
    setCapturedImage(URL.createObjectURL(file));
    setShowCamera(false);
    setError(null);
    
    await analyzeImage(file);
  }, []);

  // Analyze image for food, restaurants, and menu items
  const analyzeImage = useCallback(async (imageFile: File) => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResults([]);

    try {
      // Convert image to base64 for analysis
      const base64Image = await fileToBase64(imageFile);
      
      // Multiple analysis approaches
      const results = await Promise.allSettled([
        analyzeWithGoogleVision(base64Image),
        analyzeWithLocalCV(imageFile),
        analyzeWithFoodDetection(base64Image),
        analyzeWithOCR(base64Image)
      ]);

      // Combine results from all analysis methods
      const combinedResults = await combineAnalysisResults(results);
      
      setAnalysisResults(combinedResults);
      
      if (combinedResults.length === 0) {
        setError('No restaurants or food items detected in the image. Try a clearer photo.');
      } else {
        // Automatically search for the best results
        await performVisualSearch(combinedResults);
      }
      
    } catch (err) {
      console.error('Image analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Perform search based on visual analysis results
  const performVisualSearch = useCallback(async (results: VisualSearchResult[]) => {
    try {
      const searchPromises = results
        .filter(result => result.confidence > 0.6) // Only use high-confidence results
        .slice(0, 3) // Limit to top 3 results
        .map(result => searchByVisualResult(result));

      const searchResults = await Promise.all(searchPromises);
      const flatResults = searchResults.flat();

      if (onSearchResults) {
        onSearchResults(flatResults);
      } else {
        // Navigate to search results
        const searchQuery = results[0]?.data?.name || 'food';
        router.push(`/search?q=${encodeURIComponent(searchQuery)}&visual=true`);
      }

      toast.success(`Found ${flatResults.length} matching results`);
    } catch (err) {
      console.error('Visual search error:', err);
      toast.error('Failed to search for visual results');
    }
  }, [onSearchResults, router]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setUploadedFile(null);
    setAnalysisResults([]);
    setError(null);
    setShowCamera(true);
  }, []);

  if (showCamera) {
    return (
      <div className={`fixed inset-0 bg-black z-50 ${className}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 text-white">
            <h2 className="text-lg font-semibold">Visual Search</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Camera component */}
          <div className="flex-1">
            <CameraComponent
              onPhotoCapture={handlePhotoCapture}
              onClose={() => onClose?.()}
            />
          </div>

          {/* Upload option */}
          <div className="p-4 bg-black/50">
            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-md hover:bg-white/30"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Upload from Gallery</span>
              </button>
            </div>
            <p className="text-white text-center text-sm mt-2">
              Take a photo of food or a restaurant to search
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-white z-50 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Visual Search Results</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Captured image */}
          <div className="p-4 border-b">
            <div className="relative">
              <img
                src={capturedImage!}
                alt="Captured for analysis"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={retakePhoto}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Analysis status */}
          {analyzing && (
            <div className="p-6 text-center">
              <div className="inline-flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-lg text-gray-700">Analyzing image...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Using AI to identify food and restaurants
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !analyzing && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={retakePhoto}
                    className="text-sm text-red-600 hover:text-red-700 mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis results */}
          {analysisResults.length > 0 && !analyzing && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Analysis Complete</span>
                </div>

                {analysisResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {result.data.name || `${result.type} detected`}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                          {Math.round(result.confidence * 100)}% confidence
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'restaurant'
                              ? 'bg-blue-100 text-blue-800'
                              : result.type === 'food'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {result.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    {result.data.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {result.data.description}
                      </p>
                    )}

                    <button
                      onClick={() => searchByVisualResult(result)}
                      className="flex items-center space-x-2 text-sm bg-amber-600 text-white px-3 py-2 rounded-md hover:bg-amber-700"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search for this</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage tips */}
          <div className="p-6 border-t bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Visual Search Tips</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>📸 <strong>Food Photos:</strong> Take clear photos of dishes to find similar menu items</p>
              <p>🏪 <strong>Restaurant Signs:</strong> Capture storefronts or signs to identify restaurants</p>
              <p>📋 <strong>Menus:</strong> Photograph menus to extract text and find similar restaurants</p>
              <p>💡 <strong>Best Results:</strong> Use good lighting and avoid blurry images</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-3">
            <button
              onClick={retakePhoto}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Take Another Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Upload Different Image
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

// Utility functions

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Mock analysis functions (in production, integrate with actual AI services)
async function analyzeWithGoogleVision(base64Image: string): Promise<ImageAnalysisResult> {
  // Simulate Google Vision API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    labels: [
      { name: 'Pizza', confidence: 0.95, category: 'Food' },
      { name: 'Italian Cuisine', confidence: 0.87, category: 'Cuisine' },
      { name: 'Restaurant', confidence: 0.78, category: 'Place' }
    ],
    objects: [],
    text: [
      { text: 'MENU', boundingBox: { x: 10, y: 10, width: 100, height: 30 }, confidence: 0.9 }
    ]
  };
}

async function analyzeWithLocalCV(imageFile: File): Promise<ImageAnalysisResult> {
  // Simulate local computer vision analysis
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    labels: [
      { name: 'Pasta', confidence: 0.82, category: 'Food' },
      { name: 'Dining', confidence: 0.76, category: 'Activity' }
    ],
    objects: [
      { name: 'Plate', boundingBox: { x: 50, y: 50, width: 200, height: 200 }, confidence: 0.9 }
    ],
    text: []
  };
}

async function analyzeWithFoodDetection(base64Image: string): Promise<ImageAnalysisResult> {
  // Simulate specialized food detection
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    labels: [
      { name: 'Margherita Pizza', confidence: 0.91, category: 'Dish' },
      { name: 'Mozzarella', confidence: 0.85, category: 'Ingredient' },
      { name: 'Basil', confidence: 0.79, category: 'Ingredient' }
    ],
    objects: [],
    text: []
  };
}

async function analyzeWithOCR(base64Image: string): Promise<ImageAnalysisResult> {
  // Simulate OCR analysis
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    labels: [],
    objects: [],
    text: [
      { text: "Tony's Pizzeria", boundingBox: { x: 20, y: 20, width: 150, height: 40 }, confidence: 0.95 },
      { text: '$12.99', boundingBox: { x: 180, y: 60, width: 60, height: 20 }, confidence: 0.88 }
    ]
  };
}

async function combineAnalysisResults(results: PromiseSettledResult<ImageAnalysisResult>[]): Promise<VisualSearchResult[]> {
  const visualResults: VisualSearchResult[] = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const analysis = result.value;
      
      // Convert labels to visual search results
      analysis.labels.forEach(label => {
        if (label.confidence > 0.7) {
          const type = label.category === 'Food' || label.category === 'Dish' ? 'food' : 
                      label.category === 'Place' ? 'restaurant' : 'menu_item';
          
          visualResults.push({
            type,
            confidence: label.confidence,
            data: {
              name: label.name,
              category: label.category,
              description: `Detected ${label.name} with ${Math.round(label.confidence * 100)}% confidence`
            }
          });
        }
      });
      
      // Convert text detection to search results
      analysis.text.forEach(textItem => {
        if (textItem.confidence > 0.8) {
          visualResults.push({
            type: 'restaurant',
            confidence: textItem.confidence,
            data: {
              name: textItem.text,
              description: `Restaurant name detected from image`
            }
          });
        }
      });
    }
  });
  
  // Remove duplicates and sort by confidence
  const uniqueResults = visualResults
    .filter((result, index, self) => 
      self.findIndex(r => r.data.name === result.data.name) === index
    )
    .sort((a, b) => b.confidence - a.confidence);
  
  return uniqueResults;
}

async function searchByVisualResult(result: VisualSearchResult): Promise<any[]> {
  // Mock search implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: '1',
      name: `Restaurant serving ${result.data.name}`,
      type: result.type,
      confidence: result.confidence,
      match_reason: `Visual match for ${result.data.name}`
    }
  ];
}

// Hook to check visual search availability
export function useVisualSearchAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Check if camera is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        // Check if necessary APIs are available
        const hasCanvas = 'HTMLCanvasElement' in window;
        const hasFileReader = 'FileReader' in window;
        
        setIsAvailable(hasCamera && hasCanvas && hasFileReader);
      } catch {
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  return isAvailable;
}

// Visual search button component
interface VisualSearchButtonProps {
  onSearchResults?: (results: any[]) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function VisualSearchButton({ onSearchResults, disabled, className = '', children }: VisualSearchButtonProps) {
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const isAvailable = useVisualSearchAvailable();

  if (!isAvailable) {
    return (
      <button
        disabled
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
      >
        <Camera className="w-4 h-4" />
        <span>Visual search not available</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowVisualSearch(true)}
        disabled={disabled}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
      >
        <Camera className="w-4 h-4" />
        {children || <span>Visual Search</span>}
      </button>

      {showVisualSearch && (
        <VisualSearch
          onSearchResults={onSearchResults}
          onClose={() => setShowVisualSearch(false)}
        />
      )}
    </>
  );
}
