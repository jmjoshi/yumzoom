'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  MapPin, 
  Star, 
  Navigation, 
  Compass, 
  Eye, 
  EyeOff, 
  Settings, 
  Layers,
  Target,
  Info,
  Phone,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ARRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  distance: number;
  address: string;
  phone?: string;
  hours?: string;
  position: {
    x: number;
    y: number;
    z: number; // depth/distance
  };
  bearing: number; // degrees from north
  isVisible: boolean;
}

interface ARSettings {
  maxDistance: number; // km
  showRatings: boolean;
  showPrices: boolean;
  showDistance: boolean;
  minimumRating: number;
  cuisineFilter: string[];
  overlayOpacity: number;
  markerSize: number;
}

interface ARDiscoveryProps {
  className?: string;
  onRestaurantSelect?: (restaurant: ARRestaurant) => void;
  onClose?: () => void;
}

export function ARRestaurantDiscovery({ className = '', onRestaurantSelect, onClose }: ARDiscoveryProps) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<ARRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ARRestaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ARSettings>({
    maxDistance: 2.0,
    showRatings: true,
    showPrices: true,
    showDistance: true,
    minimumRating: 3.0,
    cuisineFilter: [],
    overlayOpacity: 0.8,
    markerSize: 1.0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();

  // Sample restaurant data - in real implementation, this would come from API
  const sampleRestaurants: Omit<ARRestaurant, 'position' | 'bearing' | 'isVisible'>[] = [
    {
      id: '1',
      name: 'The Italian Corner',
      cuisine: 'Italian',
      rating: 4.5,
      priceRange: '$$',
      distance: 0.3,
      address: '123 Main St',
      phone: '(555) 123-4567',
      hours: '11:00 AM - 10:00 PM',
    },
    {
      id: '2',
      name: 'Sushi Zen',
      cuisine: 'Japanese',
      rating: 4.8,
      priceRange: '$$$',
      distance: 0.7,
      address: '456 Oak Ave',
      phone: '(555) 987-6543',
      hours: '5:00 PM - 11:00 PM',
    },
    {
      id: '3',
      name: 'Burger Paradise',
      cuisine: 'American',
      rating: 4.2,
      priceRange: '$',
      distance: 0.5,
      address: '789 Elm St',
      phone: '(555) 456-7890',
      hours: '10:00 AM - 12:00 AM',
    },
    {
      id: '4',
      name: 'Cafe Mexicano',
      cuisine: 'Mexican',
      rating: 4.6,
      priceRange: '$$',
      distance: 1.2,
      address: '321 Pine St',
      phone: '(555) 654-3210',
      hours: '12:00 PM - 9:00 PM',
    },
  ];

  // Initialize camera and AR session
  const initializeAR = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get user location
      const position = await getCurrentPosition();
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });

      // Initialize camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Initialize device orientation
      if ('DeviceOrientationEvent' in window) {
        const handleOrientation = (event: DeviceOrientationEvent) => {
          setDeviceOrientation({
            alpha: event.alpha || 0,
            beta: event.beta || 0,
            gamma: event.gamma || 0,
          });
        };

        window.addEventListener('deviceorientation', handleOrientation);
      }

      // Load nearby restaurants
      await loadNearbyRestaurants(position.coords.latitude, position.coords.longitude);

      setIsActive(true);
      toast.success('AR mode activated');
    } catch (error) {
      console.error('Failed to initialize AR:', error);
      toast.error('Failed to start AR mode. Please check camera permissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  };

  // Load nearby restaurants (mock implementation)
  const loadNearbyRestaurants = async (lat: number, lng: number) => {
    // In real implementation, this would fetch from your restaurant API
    const restaurantsWithPositions: ARRestaurant[] = sampleRestaurants.map((restaurant, index) => {
      // Calculate position based on distance and bearing
      const bearing = (index * 90) % 360; // Spread restaurants around
      const position = calculateARPosition(restaurant.distance, bearing);
      
      return {
        ...restaurant,
        position,
        bearing,
        isVisible: true,
      };
    });

    setRestaurants(restaurantsWithPositions);
  };

  // Calculate AR position for restaurant marker
  const calculateARPosition = (distance: number, bearing: number) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Convert bearing to screen coordinates
    const bearingRad = (bearing * Math.PI) / 180;
    const x = screenWidth / 2 + (Math.sin(bearingRad) * 200);
    const y = screenHeight / 2 - (distance * 50); // Closer restaurants appear lower
    
    return { x, y, z: distance };
  };

  // Filter restaurants based on settings
  const filteredRestaurants = restaurants.filter(restaurant => {
    if (restaurant.distance > settings.maxDistance) return false;
    if (restaurant.rating < settings.minimumRating) return false;
    if (settings.cuisineFilter.length > 0 && !settings.cuisineFilter.includes(restaurant.cuisine)) return false;
    return true;
  });

  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant: ARRestaurant) => {
    setSelectedRestaurant(restaurant);
    if (onRestaurantSelect) {
      onRestaurantSelect(restaurant);
    }
  };

  // Navigate to restaurant page
  const navigateToRestaurant = (restaurant: ARRestaurant) => {
    router.push(`/restaurants/${restaurant.id}`);
  };

  // Get directions to restaurant
  const getDirections = (restaurant: ARRestaurant) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
    window.open(mapsUrl, '_blank');
  };

  // Call restaurant
  const callRestaurant = (restaurant: ARRestaurant) => {
    if (restaurant.phone) {
      window.open(`tel:${restaurant.phone}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Stop AR session
  const stopAR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
    setSelectedRestaurant(null);
    if (onClose) {
      onClose();
    }
  };

  // Render AR overlay
  const renderAROverlay = () => {
    if (!isActive) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: restaurant.position.x,
              top: restaurant.position.y,
              opacity: settings.overlayOpacity,
              transform: `scale(${settings.markerSize})`,
            }}
          >
            <Card 
              className="bg-white/90 backdrop-blur-sm border-2 border-blue-500 shadow-lg min-w-[200px] cursor-pointer hover:bg-white/95 transition-all"
              onClick={() => handleRestaurantSelect(restaurant)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {restaurant.cuisine}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {settings.showRatings && (
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                      <span className="text-xs">{restaurant.rating}</span>
                    </div>
                  )}
                  
                  {settings.showPrices && (
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs">{restaurant.priceRange}</span>
                    </div>
                  )}
                  
                  {settings.showDistance && (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-xs">{restaurant.distance.toFixed(1)} km</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {!isActive ? (
        // AR Start Screen
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <div className="text-center mb-8">
            <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AR Restaurant Discovery</h2>
            <p className="text-gray-600">
              Use your camera to discover restaurants around you with augmented reality
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <Button
              onClick={initializeAR}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Starting AR...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Start AR Discovery
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              AR Settings
            </Button>
          </div>

          {showSettings && (
            <Card className="w-full max-w-md mt-6">
              <CardHeader>
                <CardTitle className="text-lg">AR Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Max Distance: {settings.maxDistance} km</label>
                  <Slider
                    value={[settings.maxDistance]}
                    onValueChange={(values: number[]) => setSettings(prev => ({ ...prev, maxDistance: values[0] }))}
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Minimum Rating: {settings.minimumRating}</label>
                  <Slider
                    value={[settings.minimumRating]}
                    onValueChange={(values: number[]) => setSettings(prev => ({ ...prev, minimumRating: values[0] }))}
                    min={1.0}
                    max={5.0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Ratings</label>
                    <Switch
                      checked={settings.showRatings}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showRatings: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Prices</label>
                    <Switch
                      checked={settings.showPrices}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showPrices: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Distance</label>
                    <Switch
                      checked={settings.showDistance}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showDistance: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // AR Camera View
        <div className="relative w-full h-full">
          {/* Camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* AR Overlay */}
          {renderAROverlay()}

          {/* AR Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <div className="text-white text-sm">
                <div className="flex items-center mb-1">
                  <Compass className="h-3 w-3 mr-1" />
                  <span>Bearing: {Math.round(deviceOrientation.alpha)}°</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  <span>{filteredRestaurants.length} restaurants found</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white/90 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={stopAR}
                className="bg-white/90 backdrop-blur-sm"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Restaurant Details Panel */}
          {selectedRestaurant && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{selectedRestaurant.name}</h3>
                      <p className="text-gray-600">{selectedRestaurant.cuisine}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRestaurant(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      <span>{selectedRestaurant.rating}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span>{selectedRestaurant.priceRange}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                      <span>{selectedRestaurant.distance.toFixed(1)} km</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{selectedRestaurant.address}</span>
                    </div>
                    {selectedRestaurant.hours && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{selectedRestaurant.hours}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigateToRestaurant(selectedRestaurant)}
                      className="flex-1"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => getDirections(selectedRestaurant)}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                    {selectedRestaurant.phone && (
                      <Button
                        variant="outline"
                        onClick={() => callRestaurant(selectedRestaurant)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to check AR availability
export function useARAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasGeolocation = !!navigator.geolocation;
      const hasOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
      
      setIsAvailable(hasCamera && hasGeolocation && hasOrientation);
    };

    checkAvailability();
  }, []);

  return isAvailable;
}

// AR Discovery Button Component
interface ARDiscoveryButtonProps {
  onStartAR?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ARDiscoveryButton({ onStartAR, disabled = false, className = '' }: ARDiscoveryButtonProps) {
  const [showAR, setShowAR] = useState(false);
  const isAvailable = useARAvailable();

  const handleStartAR = () => {
    if (onStartAR) {
      onStartAR();
    } else {
      setShowAR(true);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleStartAR}
        disabled={disabled}
        className={className}
        variant="outline"
      >
        <Eye className="h-4 w-4 mr-2" />
        AR Discovery
      </Button>

      {showAR && (
        <div className="fixed inset-0 bg-black z-50">
          <ARRestaurantDiscovery
            className="w-full h-full"
            onClose={() => setShowAR(false)}
          />
        </div>
      )}
    </>
  );
}
