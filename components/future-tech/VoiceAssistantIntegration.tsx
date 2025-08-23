'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Speaker, 
  Smartphone, 
  Home, 
  Settings, 
  Volume2,
  MessageSquare,
  Search,
  MapPin,
  Star,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { useRouter } from 'next/navigation';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import toast from 'react-hot-toast';

interface VoiceAssistantConfig {
  enabled: boolean;
  wakeWord: string;
  language: string;
  responseVoice: string;
  voiceSpeed: number;
  autoListen: boolean;
  contextAware: boolean;
  smartHomeIntegration: boolean;
}

interface VoiceCommand {
  command: string;
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
}

interface VoiceResponse {
  text: string;
  speech: string;
  action?: {
    type: string;
    data: any;
  };
}

interface SmartSpeakerIntegration {
  platform: 'alexa' | 'google' | 'siri' | 'cortana';
  connected: boolean;
  deviceId?: string;
  capabilities: string[];
}

interface VoiceAssistantProps {
  className?: string;
  onCommand?: (command: VoiceCommand) => void;
  config?: Partial<VoiceAssistantConfig>;
}

export function VoiceAssistantIntegration({ className = '', onCommand, config: initialConfig }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [config, setConfig] = useState<VoiceAssistantConfig>({
    enabled: true,
    wakeWord: 'hey yumzoom',
    language: 'en-US',
    responseVoice: 'female',
    voiceSpeed: 1.0,
    autoListen: false,
    contextAware: true,
    smartHomeIntegration: false,
    ...initialConfig,
  });
  const [smartSpeakers, setSmartSpeakers] = useState<SmartSpeakerIntegration[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{ user: string; assistant: string; timestamp: Date }>>([]);

  const router = useRouter();
  const { search, updateFilters } = useAdvancedSearch();

  // Voice recognition setup
  const recognition = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ? new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)()
    : null;

  // Voice synthesis setup
  const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = config.language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (config.autoListen) {
          setTimeout(() => startListening(), 1000);
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setCurrentTranscript(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };
    }

    // Initialize smart speaker connections
    initializeSmartSpeakers();
  }, [config]);

  // Initialize smart speaker integrations
  const initializeSmartSpeakers = async () => {
    // Mock smart speaker discovery - in real implementation, would use platform APIs
    const mockSpeakers: SmartSpeakerIntegration[] = [
      {
        platform: 'alexa',
        connected: false,
        capabilities: ['voice_search', 'restaurant_info', 'reservations', 'reviews'],
      },
      {
        platform: 'google',
        connected: false,
        capabilities: ['voice_search', 'restaurant_info', 'directions', 'reviews'],
      },
      {
        platform: 'siri',
        connected: false,
        capabilities: ['voice_search', 'restaurant_info', 'shortcuts'],
      },
    ];

    setSmartSpeakers(mockSpeakers);
  };

  // Start voice listening
  const startListening = useCallback(() => {
    if (!recognition || !config.enabled) {
      toast.error('Voice recognition not available');
      return;
    }

    try {
      recognition.start();
      toast.success('Listening...');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast.error('Failed to start listening');
    }
  }, [recognition, config.enabled]);

  // Stop voice listening
  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  // Process voice command
  const processVoiceCommand = async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      // Check for wake word if enabled
      if (config.wakeWord && !transcript.toLowerCase().includes(config.wakeWord.toLowerCase())) {
        return;
      }

      // Parse command intent
      const command = parseVoiceCommand(transcript);
      
      if (onCommand) {
        onCommand(command);
      }

      // Process command
      const response = await executeVoiceCommand(command);
      
      // Speak response
      if (response && synthesis) {
        speakResponse(response.speech || response.text);
      }

      setLastResponse(response);
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        user: transcript,
        assistant: response?.text || 'Command processed',
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Voice command processing error:', error);
      toast.error('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse voice command into structured format
  const parseVoiceCommand = (transcript: string): VoiceCommand => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Restaurant search commands
    if (lowerTranscript.includes('find') || lowerTranscript.includes('search') || lowerTranscript.includes('look for')) {
      return {
        command: transcript,
        intent: 'restaurant_search',
        parameters: extractSearchParameters(lowerTranscript),
        confidence: 0.9,
      };
    }

    // Restaurant information commands
    if (lowerTranscript.includes('tell me about') || lowerTranscript.includes('information')) {
      return {
        command: transcript,
        intent: 'restaurant_info',
        parameters: { restaurantName: extractRestaurantName(lowerTranscript) },
        confidence: 0.8,
      };
    }

    // Navigation commands
    if (lowerTranscript.includes('directions') || lowerTranscript.includes('navigate')) {
      return {
        command: transcript,
        intent: 'navigation',
        parameters: { restaurantName: extractRestaurantName(lowerTranscript) },
        confidence: 0.8,
      };
    }

    // Reservation commands
    if (lowerTranscript.includes('book') || lowerTranscript.includes('reserve') || lowerTranscript.includes('reservation')) {
      return {
        command: transcript,
        intent: 'reservation',
        parameters: extractReservationParameters(lowerTranscript),
        confidence: 0.7,
      };
    }

    // Review commands
    if (lowerTranscript.includes('review') || lowerTranscript.includes('rating')) {
      return {
        command: transcript,
        intent: 'review',
        parameters: { restaurantName: extractRestaurantName(lowerTranscript) },
        confidence: 0.7,
      };
    }

    // Favorites commands
    if (lowerTranscript.includes('favorite') || lowerTranscript.includes('bookmark')) {
      return {
        command: transcript,
        intent: 'favorites',
        parameters: { 
          action: lowerTranscript.includes('add') ? 'add' : lowerTranscript.includes('remove') ? 'remove' : 'list',
          restaurantName: extractRestaurantName(lowerTranscript)
        },
        confidence: 0.8,
      };
    }

    // General help
    if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do')) {
      return {
        command: transcript,
        intent: 'help',
        parameters: {},
        confidence: 0.9,
      };
    }

    return {
      command: transcript,
      intent: 'unknown',
      parameters: {},
      confidence: 0.1,
    };
  };

  // Extract search parameters from voice command
  const extractSearchParameters = (text: string) => {
    const params: any = {};

    // Extract cuisine type
    const cuisineMatches = text.match(/\b(italian|chinese|mexican|indian|thai|japanese|american|french|korean|mediterranean)\b/gi);
    if (cuisineMatches && cuisineMatches.length > 0) {
      params.cuisineType = cuisineMatches[0];
    }

    // Extract location
    if (text.includes('near me') || text.includes('nearby')) {
      params.location = 'current';
    } else {
      const locationMatch = text.match(/\bin\s+([a-zA-Z\s]+?)(?:\s+(?:for|with|that)|$)/);
      if (locationMatch) {
        params.location = locationMatch[1].trim();
      }
    }

    // Extract price range
    if (text.includes('cheap') || text.includes('budget') || text.includes('affordable')) {
      params.priceRange = '$';
    } else if (text.includes('expensive') || text.includes('upscale') || text.includes('fine dining')) {
      params.priceRange = '$$$';
    } else if (text.includes('mid range') || text.includes('moderate')) {
      params.priceRange = '$$';
    }

    // Extract rating
    const ratingMatch = text.match(/(\d+)\s*star/);
    if (ratingMatch) {
      params.minimumRating = parseInt(ratingMatch[1]);
    } else if (text.includes('highly rated') || text.includes('top rated')) {
      params.minimumRating = 4;
    }

    // Extract dietary restrictions
    if (text.includes('vegetarian')) params.isVegetarian = true;
    if (text.includes('vegan')) params.isVegan = true;
    if (text.includes('gluten free')) params.isGlutenFree = true;

    return params;
  };

  // Extract restaurant name from text
  const extractRestaurantName = (text: string) => {
    // Simple extraction - in real implementation, would use NLP
    const nameMatch = text.match(/(?:about|for|to)\s+([a-zA-Z\s'&]+?)(?:\s+restaurant|$)/i);
    return nameMatch ? nameMatch[1].trim() : '';
  };

  // Extract reservation parameters
  const extractReservationParameters = (text: string) => {
    const params: any = {};
    
    // Extract date/time
    const timeMatch = text.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch) {
      params.time = timeMatch[1];
    }

    const dateMatch = text.match(/(?:on|for)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\/\d+)/i);
    if (dateMatch) {
      params.date = dateMatch[1];
    }

    // Extract party size
    const partyMatch = text.match(/for\s+(\d+)\s+(?:people|person)/i);
    if (partyMatch) {
      params.partySize = parseInt(partyMatch[1]);
    }

    params.restaurantName = extractRestaurantName(text);
    
    return params;
  };

  // Execute voice command
  const executeVoiceCommand = async (command: VoiceCommand): Promise<VoiceResponse | null> => {
    switch (command.intent) {
      case 'restaurant_search':
        return await handleRestaurantSearch(command.parameters);
      
      case 'restaurant_info':
        return await handleRestaurantInfo(command.parameters);
      
      case 'navigation':
        return await handleNavigation(command.parameters);
      
      case 'reservation':
        return await handleReservation(command.parameters);
      
      case 'review':
        return await handleReview(command.parameters);
      
      case 'favorites':
        return await handleFavorites(command.parameters);
      
      case 'help':
        return handleHelp();
      
      default:
        return {
          text: "I'm sorry, I didn't understand that command. Try saying 'help' to see what I can do.",
          speech: "I'm sorry, I didn't understand that command. Try saying help to see what I can do.",
        };
    }
  };

  // Handle restaurant search
  const handleRestaurantSearch = async (params: any): Promise<VoiceResponse> => {
    try {
      // Apply filters
      if (params.cuisineType) updateFilters({ cuisineType: params.cuisineType });
      if (params.priceRange) updateFilters({ priceRange: params.priceRange });
      if (params.minRating) updateFilters({ minRating: params.minRating });
      if (params.isVegetarian) updateFilters({ isVegetarian: true });
      if (params.isVegan) updateFilters({ isVegan: true });
      if (params.isGlutenfree) updateFilters({ isGlutenfree: true });

      // Perform search
      await search({ searchQuery: params.cuisineType || 'restaurants' });

      // Navigate to results
      router.push('/search');

      return {
        text: `Found restaurants matching your criteria. Check your search results.`,
        speech: `I found several restaurants that match your criteria. You can see the results on your screen now.`,
        action: {
          type: 'navigate',
          data: { path: '/search' },
        },
      };
    } catch (error) {
      return {
        text: 'Sorry, I encountered an error while searching for restaurants.',
        speech: 'Sorry, I encountered an error while searching for restaurants.',
      };
    }
  };

  // Handle restaurant info request
  const handleRestaurantInfo = async (params: any): Promise<VoiceResponse> => {
    if (!params.restaurantName) {
      return {
        text: 'Please specify which restaurant you want information about.',
        speech: 'Please specify which restaurant you want information about.',
      };
    }

    // Mock restaurant info - in real implementation, would fetch from API
    return {
      text: `${params.restaurantName} is a highly rated restaurant. Would you like to see more details or make a reservation?`,
      speech: `${params.restaurantName} is a highly rated restaurant. Would you like to see more details or make a reservation?`,
    };
  };

  // Handle navigation request
  const handleNavigation = async (params: any): Promise<VoiceResponse> => {
    if (!params.restaurantName) {
      return {
        text: 'Please specify which restaurant you want directions to.',
        speech: 'Please specify which restaurant you want directions to.',
      };
    }

    return {
      text: `Opening directions to ${params.restaurantName}.`,
      speech: `Opening directions to ${params.restaurantName}.`,
      action: {
        type: 'navigation',
        data: { restaurantName: params.restaurantName },
      },
    };
  };

  // Handle reservation request
  const handleReservation = async (params: any): Promise<VoiceResponse> => {
    const { restaurantName, date, time, partySize } = params;
    
    if (!restaurantName) {
      return {
        text: 'Please specify which restaurant you want to make a reservation at.',
        speech: 'Please specify which restaurant you want to make a reservation at.',
      };
    }

    return {
      text: `I'll help you make a reservation at ${restaurantName}${date ? ` for ${date}` : ''}${time ? ` at ${time}` : ''}${partySize ? ` for ${partySize} people` : ''}.`,
      speech: `I'll help you make a reservation at ${restaurantName}. Opening the reservation page now.`,
      action: {
        type: 'reservation',
        data: params,
      },
    };
  };

  // Handle review request
  const handleReview = async (params: any): Promise<VoiceResponse> => {
    if (!params.restaurantName) {
      return {
        text: 'Please specify which restaurant you want to review.',
        speech: 'Please specify which restaurant you want to review.',
      };
    }

    return {
      text: `Opening the review page for ${params.restaurantName}.`,
      speech: `Opening the review page for ${params.restaurantName}.`,
      action: {
        type: 'review',
        data: params,
      },
    };
  };

  // Handle favorites request
  const handleFavorites = async (params: any): Promise<VoiceResponse> => {
    const { action, restaurantName } = params;

    switch (action) {
      case 'add':
        return {
          text: `Added ${restaurantName} to your favorites.`,
          speech: `Added ${restaurantName} to your favorites.`,
        };
      case 'remove':
        return {
          text: `Removed ${restaurantName} from your favorites.`,
          speech: `Removed ${restaurantName} from your favorites.`,
        };
      default:
        return {
          text: 'Opening your favorites list.',
          speech: 'Opening your favorites list.',
          action: {
            type: 'navigate',
            data: { path: '/favorites' },
          },
        };
    }
  };

  // Handle help request
  const handleHelp = (): VoiceResponse => {
    return {
      text: 'I can help you search for restaurants, get information, make reservations, navigate, manage favorites, and read reviews. Try saying "Find Italian restaurants near me" or "Make a reservation at Mario\'s".',
      speech: 'I can help you search for restaurants, get information, make reservations, navigate, manage favorites, and read reviews. Try saying find Italian restaurants near me, or make a reservation.',
    };
  };

  // Speak response using text-to-speech
  const speakResponse = (text: string) => {
    if (!synthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.voiceSpeed;
    utterance.lang = config.language;
    
    // Set voice preference
    const voices = synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(config.language.split('-')[0]) && 
      voice.name.toLowerCase().includes(config.responseVoice)
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthesis.speak(utterance);
  };

  // Connect to smart speaker
  const connectSmartSpeaker = async (platform: string) => {
    // Mock connection - in real implementation, would use platform-specific APIs
    setSmartSpeakers(prev => prev.map(speaker => 
      speaker.platform === platform 
        ? { ...speaker, connected: !speaker.connected, deviceId: speaker.connected ? undefined : `${platform}-device-1` }
        : speaker
    ));

    toast.success(`${platform} ${smartSpeakers.find(s => s.platform === platform)?.connected ? 'disconnected' : 'connected'}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Voice Assistant Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Voice Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={!config.enabled || isProcessing}
              variant={isListening ? "danger" : "primary"}
              className="flex-1"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setConfig(prev => ({ ...prev, autoListen: !prev.autoListen }))}
            >
              Auto Listen: {config.autoListen ? 'ON' : 'OFF'}
            </Button>
          </div>

          {currentTranscript && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Last Command:</p>
              <p className="text-gray-700">{currentTranscript}</p>
            </div>
          )}

          {lastResponse && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">Assistant Response:</p>
              <p className="text-blue-700">{lastResponse.text}</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Processing command...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Speaker Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Speaker className="h-5 w-5 mr-2" />
            Smart Speaker Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {smartSpeakers.map((speaker) => (
            <div key={speaker.platform} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {speaker.platform === 'alexa' && <Speaker className="h-5 w-5 text-blue-600" />}
                  {speaker.platform === 'google' && <Home className="h-5 w-5 text-red-600" />}
                  {speaker.platform === 'siri' && <Smartphone className="h-5 w-5 text-gray-600" />}
                </div>
                <div>
                  <p className="font-medium capitalize">{speaker.platform}</p>
                  <p className="text-sm text-gray-600">
                    {speaker.connected ? `Connected (${speaker.deviceId})` : 'Not connected'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={speaker.connected ? "default" : "secondary"}>
                  {speaker.connected ? 'Connected' : 'Available'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectSmartSpeaker(speaker.platform)}
                >
                  {speaker.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Voice Assistant Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Voice Assistant Enabled</label>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Context Awareness</label>
              <Switch
                checked={config.contextAware}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, contextAware: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Smart Home Integration</label>
              <Switch
                checked={config.smartHomeIntegration}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smartHomeIntegration: checked }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Voice Speed: {config.voiceSpeed}x</label>
              <Slider
                value={[config.voiceSpeed]}
                onValueChange={(values: number[]) => setConfig(prev => ({ ...prev, voiceSpeed: values[0] }))}
                min={0.5}
                max={2.0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Wake Word</label>
              <input
                type="text"
                value={config.wakeWord}
                onChange={(e) => setConfig(prev => ({ ...prev, wakeWord: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hey yumzoom"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Language</label>
              <select
                value={config.language}
                onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label className="text-sm font-medium">Response Voice</label>
              <select
                value={config.responseVoice}
                onChange={(e) => setConfig(prev => ({ ...prev, responseVoice: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversationHistory.slice(-5).map((conversation, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm"><strong>You:</strong> {conversation.user}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-sm"><strong>Assistant:</strong> {conversation.assistant}</p>
                  </div>
                  <p className="text-xs text-gray-500">{conversation.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook to check voice assistant availability
export function useVoiceAssistantAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      const hasSpeechSynthesis = 'speechSynthesis' in window;
      setIsAvailable(hasSpeechRecognition && hasSpeechSynthesis);
    };

    checkAvailability();
  }, []);

  return isAvailable;
}

// Voice Assistant Button Component
interface VoiceAssistantButtonProps {
  onActivate?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceAssistantButton({ onActivate, disabled = false, className = '' }: VoiceAssistantButtonProps) {
  const [showAssistant, setShowAssistant] = useState(false);
  const isAvailable = useVoiceAssistantAvailable();

  const handleActivate = () => {
    if (onActivate) {
      onActivate();
    } else {
      setShowAssistant(true);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleActivate}
        disabled={disabled}
        className={className}
        variant="outline"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Voice Assistant
      </Button>

      {showAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Voice Assistant</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssistant(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <VoiceAssistantIntegration />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
