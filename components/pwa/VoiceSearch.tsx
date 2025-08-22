'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import toast from 'react-hot-toast';

interface VoiceSearchProps {
  onSearch?: (query: string) => void;
  onClose?: () => void;
  autoStart?: boolean;
  className?: string;
}

interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export function VoiceSearch({ onSearch, onClose, autoStart = false, className = '' }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [languageCode, setLanguageCode] = useState('en-US');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { updateFilters, search } = useAdvancedSearch();

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = languageCode;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      
      // Play start sound
      if (audioFeedback) {
        playTone(800, 100);
      }
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcriptText;
          maxConfidence = Math.max(maxConfidence, result[0].confidence || 0);
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        setConfidence(maxConfidence);
        handleFinalTranscript(finalTranscript.trim(), maxConfidence);
      } else if (interimTranscript) {
        setTranscript(interimTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('Microphone not accessible. Please check permissions.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Play end sound
      if (audioFeedback) {
        playTone(400, 100);
      }
    };

    recognitionRef.current = recognition;
    return true;
  }, [languageCode, audioFeedback]);

  // Process final transcript with natural language understanding
  const handleFinalTranscript = useCallback(async (text: string, confidence: number) => {
    if (!text || confidence < 0.3) {
      toast.error('Speech not clear enough. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Enhanced natural language processing
      const processedQuery = await processNaturalLanguageQuery(text);
      
      if (onSearch) {
        onSearch(processedQuery.query);
      } else {
        // Apply filters and search
        if (processedQuery.filters) {
          updateFilters(processedQuery.filters);
        }
        
        // Perform search
        await search({ searchQuery: processedQuery.query });
        
        // Navigate to search results
        const searchParams = new URLSearchParams();
        searchParams.set('q', processedQuery.query);
        
        if (processedQuery.filters) {
          Object.entries(processedQuery.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              searchParams.set(key, String(value));
            }
          });
        }
        
        router.push(`/search?${searchParams.toString()}`);
      }

      toast.success(`Searching for: "${processedQuery.query}"`);
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Voice search processing error:', err);
      toast.error('Failed to process voice search');
    } finally {
      setIsProcessing(false);
    }
  }, [onSearch, onClose, updateFilters, search, router]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current && !initializeSpeechRecognition()) {
      return;
    }

    setTranscript('');
    setConfidence(0);
    setError(null);

    try {
      recognitionRef.current.start();
      
      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start voice recognition');
    }
  }, [initializeSpeechRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startListening();
    }
    
    return () => {
      stopListening();
    };
  }, [autoStart, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Mic className="w-6 h-6 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">Voice Search</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Voice visualization */}
      <div className="flex justify-center mb-6">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'bg-amber-100 border-4 border-amber-300 animate-pulse'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
          ) : isListening ? (
            <Mic className="w-12 h-12 text-amber-600" />
          ) : (
            <MicOff className="w-12 h-12 text-gray-400" />
          )}
        </div>
      </div>

      {/* Status and transcript */}
      <div className="text-center mb-6">
        {isProcessing ? (
          <p className="text-sm text-gray-600">Processing your request...</p>
        ) : isListening ? (
          <div>
            <p className="text-sm text-amber-600 font-medium mb-2">Listening...</p>
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">"{transcript}"</p>
                {confidence > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Confidence</span>
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Tap the microphone to start voice search
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Main control button */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          } disabled:bg-gray-300 disabled:text-gray-500`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </span>
          ) : isListening ? (
            <span className="flex items-center justify-center">
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Mic className="w-4 h-4 mr-2" />
              Start Voice Search
            </span>
          )}
        </button>

        {/* Settings */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {audioFeedback ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>Audio Feedback</span>
          </button>

          <select
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="it-IT">Italian</option>
            <option value="pt-BR">Portuguese</option>
            <option value="zh-CN">Chinese</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
          </select>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 text-xs text-gray-500">
        <p className="font-medium mb-1">Voice Search Tips:</p>
        <ul className="space-y-1">
          <li>• "Find Italian restaurants near me"</li>
          <li>• "Show vegetarian pizza places"</li>
          <li>• "Search for highly rated sushi"</li>
          <li>• "Find restaurants under twenty dollars"</li>
        </ul>
      </div>
    </div>
  );
}

// Natural language processing for voice queries
async function processNaturalLanguageQuery(text: string): Promise<{
  query: string;
  filters?: any;
}> {
  const lowercaseText = text.toLowerCase();
  let query = text;
  const filters: any = {};

  // Extract location intent
  const locationPatterns = [
    /near me/i,
    /nearby/i,
    /close to me/i,
    /in my area/i
  ];
  
  if (locationPatterns.some(pattern => pattern.test(text))) {
    filters.useCurrentLocation = true;
    query = query.replace(/\b(near me|nearby|close to me|in my area)\b/gi, '').trim();
  }

  // Extract cuisine types
  const cuisineMap: { [key: string]: string } = {
    'italian': 'Italian',
    'chinese': 'Chinese',
    'mexican': 'Mexican',
    'indian': 'Indian',
    'japanese': 'Japanese',
    'thai': 'Thai',
    'french': 'French',
    'american': 'American',
    'mediterranean': 'Mediterranean',
    'korean': 'Korean',
    'pizza': 'Italian'
  };

  Object.entries(cuisineMap).forEach(([keyword, cuisine]) => {
    if (lowercaseText.includes(keyword)) {
      filters.cuisineType = cuisine;
    }
  });

  // Extract dietary restrictions
  if (/\b(vegetarian|veggie)\b/i.test(text)) {
    filters.isVegetarian = true;
  }
  if (/\bvegan\b/i.test(text)) {
    filters.isVegan = true;
  }
  if (/\b(gluten.?free|gluten.?friendly)\b/i.test(text)) {
    filters.isGlutenfree = true;
  }

  // Extract price range
  const pricePatterns = [
    { pattern: /\b(cheap|budget|affordable|under \$?(\d+))\b/i, range: '$' },
    { pattern: /\b(expensive|upscale|fine dining|over \$?(\d+))\b/i, range: '$$$' },
    { pattern: /\bmid.?range\b/i, range: '$$' }
  ];

  pricePatterns.forEach(({ pattern, range }) => {
    if (pattern.test(text)) {
      filters.priceRange = range;
    }
  });

  // Extract rating filter
  const ratingMatch = text.match(/\b(highly rated|top rated|(\d+)\+?\s*star)/i);
  if (ratingMatch) {
    if (ratingMatch[0].includes('highly') || ratingMatch[0].includes('top')) {
      filters.minRating = 4;
    } else if (ratingMatch[2]) {
      filters.minRating = parseInt(ratingMatch[2]);
    }
  }

  // Clean up the query
  query = query
    .replace(/\b(find|show|search for|get|give me)\b/gi, '')
    .replace(/\b(restaurants?|places?|spots?)\b/gi, '')
    .replace(/\b(with|that have|that are)\b/gi, '')
    .replace(/\b(vegetarian|vegan|gluten.?free)\b/gi, '')
    .replace(/\b(highly rated|top rated|\d+\+?\s*star)\b/gi, '')
    .replace(/\b(cheap|budget|affordable|expensive|upscale|fine dining|mid.?range)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { query: query || 'restaurants', filters };
}

// Audio feedback utility
function playTone(frequency: number, duration: number) {
  if (!('AudioContext' in window)) return;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (err) {
    // Fallback: silent operation
  }
}

// Hook to check voice search availability
export function useVoiceSearchAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
      const hasSpeechRecognition = 'SpeechRecognition' in window;
      setIsAvailable(hasWebkitSpeech || hasSpeechRecognition);
    };

    checkAvailability();
  }, []);

  return isAvailable;
}

// Voice search button component
interface VoiceSearchButtonProps {
  onSearch?: (query: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function VoiceSearchButton({ onSearch, disabled, className = '', children }: VoiceSearchButtonProps) {
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const isAvailable = useVoiceSearchAvailable();

  if (!isAvailable) {
    return (
      <button
        disabled
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed ${className}`}
      >
        <MicOff className="w-4 h-4" />
        <span>Voice search not available</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowVoiceSearch(true)}
        disabled={disabled}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
      >
        <Mic className="w-4 h-4" />
        {children || <span>Voice Search</span>}
      </button>

      {showVoiceSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <VoiceSearch
            onSearch={onSearch}
            onClose={() => setShowVoiceSearch(false)}
            autoStart={true}
          />
        </div>
      )}
    </>
  );
}
