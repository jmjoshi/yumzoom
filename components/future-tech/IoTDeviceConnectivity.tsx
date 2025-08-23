'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Home, 
  Car, 
  Watch, 
  Smartphone, 
  Speaker, 
  Lightbulb,
  Thermometer,
  Settings,
  Power,
  Volume2,
  MapPin,
  Clock,
  Calendar,
  Bell,
  Shield,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

interface IoTDevice {
  id: string;
  name: string;
  type: 'smart_speaker' | 'smart_display' | 'smart_fridge' | 'smart_car' | 'smart_watch' | 'smart_tv' | 'smart_light' | 'smart_thermostat';
  brand: string;
  model: string;
  connected: boolean;
  online: boolean;
  capabilities: string[];
  location?: string;
  lastSeen: Date;
  batteryLevel?: number;
  firmware?: string;
  settings: Record<string, any>;
}

interface SmartHomeScenario {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'location' | 'time' | 'manual' | 'restaurant_action';
    condition: any;
  };
  actions: Array<{
    deviceId: string;
    action: string;
    parameters: any;
  }>;
  enabled: boolean;
}

interface DiningIntegration {
  type: 'pre_dining' | 'during_dining' | 'post_dining';
  scenarios: SmartHomeScenario[];
}

interface IoTConnectivityProps {
  className?: string;
  onDeviceAction?: (deviceId: string, action: string, parameters: any) => void;
}

export function IoTDeviceConnectivity({ className = '', onDeviceAction }: IoTConnectivityProps) {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [scenarios, setScenarios] = useState<SmartHomeScenario[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [diningIntegrations, setDiningIntegrations] = useState<DiningIntegration[]>([]);
  const [activeTab, setActiveTab] = useState('devices');

  // Mock IoT devices - in real implementation, would discover actual devices
  const mockDevices: IoTDevice[] = [
    {
      id: 'alexa-1',
      name: 'Kitchen Echo',
      type: 'smart_speaker',
      brand: 'Amazon',
      model: 'Echo Dot (4th Gen)',
      connected: false,
      online: true,
      capabilities: ['voice_control', 'music', 'smart_home', 'timers', 'restaurant_info'],
      location: 'Kitchen',
      lastSeen: new Date(),
      firmware: '1.2.3',
      settings: { volume: 50, wakeWord: 'alexa' },
    },
    {
      id: 'google-1',
      name: 'Living Room Hub',
      type: 'smart_display',
      brand: 'Google',
      model: 'Nest Hub Max',
      connected: false,
      online: true,
      capabilities: ['voice_control', 'display', 'video_calls', 'smart_home', 'restaurant_photos'],
      location: 'Living Room',
      lastSeen: new Date(),
      firmware: '2.1.0',
      settings: { brightness: 80, volume: 60 },
    },
    {
      id: 'samsung-fridge',
      name: 'Smart Refrigerator',
      type: 'smart_fridge',
      brand: 'Samsung',
      model: 'Family Hub 4.0',
      connected: false,
      online: true,
      capabilities: ['inventory_tracking', 'meal_planning', 'shopping_lists', 'recipe_suggestions'],
      location: 'Kitchen',
      lastSeen: new Date(),
      firmware: '3.0.1',
      settings: { temperature: 38, icemaker: true },
    },
    {
      id: 'tesla-model3',
      name: 'Tesla Model 3',
      type: 'smart_car',
      brand: 'Tesla',
      model: 'Model 3',
      connected: false,
      online: true,
      capabilities: ['navigation', 'climate_control', 'media', 'restaurant_directions'],
      location: 'Garage',
      lastSeen: new Date(),
      batteryLevel: 85,
      firmware: '2023.12.1',
      settings: { preconditioning: true, autopilot: true },
    },
    {
      id: 'apple-watch',
      name: 'Apple Watch',
      type: 'smart_watch',
      brand: 'Apple',
      model: 'Series 9',
      connected: false,
      online: true,
      capabilities: ['notifications', 'health_tracking', 'payments', 'restaurant_reviews'],
      lastSeen: new Date(),
      batteryLevel: 92,
      firmware: 'watchOS 10.2',
      settings: { hapticStrength: 2, crownHaptic: true },
    },
    {
      id: 'philips-hue',
      name: 'Dining Room Lights',
      type: 'smart_light',
      brand: 'Philips',
      model: 'Hue Color Bulbs',
      connected: false,
      online: true,
      capabilities: ['dimming', 'color_changing', 'scheduling', 'dining_ambiance'],
      location: 'Dining Room',
      lastSeen: new Date(),
      firmware: '1.104.2',
      settings: { brightness: 75, color: '#FFFFFF' },
    },
  ];

  // Mock dining integration scenarios
  const mockScenarios: SmartHomeScenario[] = [
    {
      id: 'pre-dinner-setup',
      name: 'Pre-Dinner Home Setup',
      description: 'Prepare home environment before going out to dinner',
      trigger: {
        type: 'restaurant_action',
        condition: { action: 'reservation_confirmed' },
      },
      actions: [
        { deviceId: 'philips-hue', action: 'turn_off', parameters: {} },
        { deviceId: 'tesla-model3', action: 'precondition', parameters: { temperature: 72 } },
        { deviceId: 'alexa-1', action: 'set_reminder', parameters: { message: 'Dinner reservation in 1 hour', time: 3600 } },
      ],
      enabled: true,
    },
    {
      id: 'restaurant-navigation',
      name: 'Restaurant Navigation',
      description: 'Send restaurant location to car and start navigation',
      trigger: {
        type: 'restaurant_action',
        condition: { action: 'get_directions' },
      },
      actions: [
        { deviceId: 'tesla-model3', action: 'navigate_to', parameters: { destination: 'restaurant_address' } },
        { deviceId: 'apple-watch', action: 'show_notification', parameters: { title: 'Navigation Started', body: 'Directions sent to car' } },
      ],
      enabled: true,
    },
    {
      id: 'post-dinner-welcome',
      name: 'Welcome Home After Dinner',
      description: 'Create welcoming atmosphere when returning from dinner',
      trigger: {
        type: 'location',
        condition: { geofence: 'home', arriving: true },
      },
      actions: [
        { deviceId: 'philips-hue', action: 'turn_on', parameters: { brightness: 50, color: '#FFB366' } },
        { deviceId: 'alexa-1', action: 'play_music', parameters: { playlist: 'relaxing_jazz' } },
        { deviceId: 'google-1', action: 'show_message', parameters: { text: 'Welcome home! How was dinner?' } },
      ],
      enabled: true,
    },
    {
      id: 'cooking-inspiration',
      name: 'Cooking Inspiration',
      description: 'Show cooking inspiration based on restaurant visits',
      trigger: {
        type: 'restaurant_action',
        condition: { action: 'review_submitted' },
      },
      actions: [
        { deviceId: 'samsung-fridge', action: 'suggest_recipes', parameters: { cuisine: 'restaurant_cuisine' } },
        { deviceId: 'google-1', action: 'show_recipes', parameters: { similar_to: 'restaurant_dishes' } },
      ],
      enabled: true,
    },
  ];

  useEffect(() => {
    setDevices(mockDevices);
    setScenarios(mockScenarios);
    initializeDiningIntegrations();
  }, []);

  // Initialize dining integrations
  const initializeDiningIntegrations = () => {
    const integrations: DiningIntegration[] = [
      {
        type: 'pre_dining',
        scenarios: mockScenarios.filter(s => s.id.includes('pre-')),
      },
      {
        type: 'during_dining',
        scenarios: mockScenarios.filter(s => s.id.includes('navigation')),
      },
      {
        type: 'post_dining',
        scenarios: mockScenarios.filter(s => s.id.includes('post-') || s.id.includes('cooking')),
      },
    ];
    setDiningIntegrations(integrations);
  };

  // Discover IoT devices
  const discoverDevices = useCallback(async () => {
    setIsDiscovering(true);
    toast.success('Discovering IoT devices...');

    try {
      // Mock discovery process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, would use platform-specific discovery APIs
      // - HomeKit for Apple devices
      // - SmartThings for Samsung devices
      // - Alexa Smart Home API for Amazon devices
      // - Google Assistant SDK for Google devices
      
      toast.success(`Found ${devices.length} compatible devices`);
    } catch (error) {
      console.error('Device discovery error:', error);
      toast.error('Failed to discover devices');
    } finally {
      setIsDiscovering(false);
    }
  }, [devices.length]);

  // Connect to device
  const connectDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    try {
      // Mock connection process - in real implementation, would use device-specific APIs
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, connected: !d.connected } : d
      ));

      toast.success(`${device.connected ? 'Disconnected from' : 'Connected to'} ${device.name}`);
    } catch (error) {
      console.error('Device connection error:', error);
      toast.error(`Failed to ${device.connected ? 'disconnect from' : 'connect to'} ${device.name}`);
    }
  };

  // Execute device action
  const executeDeviceAction = async (deviceId: string, action: string, parameters: any = {}) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !device.connected) return;

    try {
      // Mock action execution
      console.log(`Executing ${action} on ${device.name}:`, parameters);

      if (onDeviceAction) {
        onDeviceAction(deviceId, action, parameters);
      }

      toast.success(`${action} executed on ${device.name}`);
    } catch (error) {
      console.error('Device action error:', error);
      toast.error(`Failed to execute ${action} on ${device.name}`);
    }
  };

  // Execute scenario
  const executeScenario = async (scenarioId: string, context: any = {}) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || !scenario.enabled) return;

    try {
      toast.success(`Executing scenario: ${scenario.name}`);

      for (const action of scenario.actions) {
        // Replace context variables in parameters
        const processedParams = { ...action.parameters };
        if (context.restaurant_address && processedParams.destination === 'restaurant_address') {
          processedParams.destination = context.restaurant_address;
        }
        if (context.restaurant_cuisine && processedParams.cuisine === 'restaurant_cuisine') {
          processedParams.cuisine = context.restaurant_cuisine;
        }

        await executeDeviceAction(action.deviceId, action.action, processedParams);
        
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success(`Scenario "${scenario.name}" completed`);
    } catch (error) {
      console.error('Scenario execution error:', error);
      toast.error(`Failed to execute scenario: ${scenario.name}`);
    }
  };

  // Toggle scenario
  const toggleScenario = (scenarioId: string) => {
    setScenarios(prev => prev.map(s => 
      s.id === scenarioId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  // Get device icon
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smart_speaker': return Speaker;
      case 'smart_display': return Smartphone;
      case 'smart_fridge': return Home;
      case 'smart_car': return Car;
      case 'smart_watch': return Watch;
      case 'smart_tv': return Smartphone;
      case 'smart_light': return Lightbulb;
      case 'smart_thermostat': return Thermometer;
      default: return Settings;
    }
  };

  // Get connection status color
  const getStatusColor = (device: IoTDevice) => {
    if (!device.online) return 'text-gray-400';
    if (!device.connected) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Render device card
  const renderDeviceCard = (device: IoTDevice) => {
    const Icon = getDeviceIcon(device.type);
    
    return (
      <Card key={device.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-100 ${getStatusColor(device)}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">{device.name}</h3>
                <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                {device.location && (
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {device.location}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={device.connected ? "default" : device.online ? "secondary" : "destructive"}>
                {device.connected ? 'Connected' : device.online ? 'Available' : 'Offline'}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => connectDevice(device.id)}
                disabled={!device.online}
              >
                {device.connected ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {device.batteryLevel && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm">
                <span>Battery</span>
                <span>{device.batteryLevel}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${
                    device.batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${device.batteryLevel}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {device.capabilities.slice(0, 3).map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability.replace('_', ' ')}
                </Badge>
              ))}
              {device.capabilities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{device.capabilities.length - 3}
                </Badge>
              )}
            </div>

            {device.connected && (
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDevice(device)}
                  className="flex-1"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                
                {device.type === 'smart_car' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeDeviceAction(device.id, 'precondition', { temperature: 72 })}
                  >
                    <Power className="h-3 w-3" />
                  </Button>
                )}
                
                {device.type === 'smart_speaker' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeDeviceAction(device.id, 'play_music', { playlist: 'dinner_jazz' })}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render scenario card
  const renderScenarioCard = (scenario: SmartHomeScenario) => {
    return (
      <Card key={scenario.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
            </div>
            <Switch
              checked={scenario.enabled}
              onCheckedChange={() => toggleScenario(scenario.id)}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Trigger:</span> {scenario.trigger.type}
            </div>
            
            <div className="text-sm">
              <span className="font-medium">Actions:</span> {scenario.actions.length} device{scenario.actions.length !== 1 ? 's' : ''}
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeScenario(scenario.id)}
                disabled={!scenario.enabled}
                className="flex-1"
              >
                <Power className="h-3 w-3 mr-1" />
                Execute
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Edit scenario */}}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              IoT Device Connectivity
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discoverDevices}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Discover
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-800">Connected Devices</p>
              <p className="text-2xl font-bold text-green-600">
                {devices.filter(d => d.connected).length}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-800">Available Devices</p>
              <p className="text-2xl font-bold text-blue-600">
                {devices.filter(d => d.online && !d.connected).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="font-medium text-yellow-800">Active Scenarios</p>
              <p className="text-2xl font-bold text-yellow-600">
                {scenarios.filter(s => s.enabled).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="integrations">Dining Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(renderDeviceCard)}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(renderScenarioCard)}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {diningIntegrations.map((integration) => (
            <Card key={integration.type}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {integration.type.replace('_', ' ')} Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integration.scenarios.map((scenario) => (
                    <div key={scenario.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{scenario.name}</p>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={scenario.enabled}
                          onCheckedChange={() => toggleScenario(scenario.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeScenario(scenario.id)}
                          disabled={!scenario.enabled}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Device Settings Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{selectedDevice.name} Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDevice(null)}
              >
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Device Information</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Brand: {selectedDevice.brand}</p>
                  <p>Model: {selectedDevice.model}</p>
                  <p>Firmware: {selectedDevice.firmware}</p>
                  <p>Last Seen: {selectedDevice.lastSeen.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDevice.capabilities.map((capability) => (
                    <Badge key={capability} variant="outline" className="text-xs">
                      {capability.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {Object.keys(selectedDevice.settings).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Settings</p>
                  <div className="space-y-2">
                    {Object.entries(selectedDevice.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to check IoT availability
export function useIoTAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check for basic web APIs that enable IoT connectivity
    const hasWebBluetooth = 'bluetooth' in navigator;
    const hasWebUSB = 'usb' in navigator;
    const hasWebSerial = 'serial' in navigator;
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    setIsAvailable(hasWebBluetooth || hasWebUSB || hasWebSerial || hasServiceWorker);
  }, []);

  return isAvailable;
}

// IoT Connectivity Button Component
interface IoTConnectivityButtonProps {
  onOpen?: () => void;
  disabled?: boolean;
  className?: string;
}

export function IoTConnectivityButton({ onOpen, disabled = false, className = '' }: IoTConnectivityButtonProps) {
  const [showIoT, setShowIoT] = useState(false);
  const isAvailable = useIoTAvailable();

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    } else {
      setShowIoT(true);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled}
        className={className}
        variant="outline"
      >
        <Home className="h-4 w-4 mr-2" />
        Smart Home
      </Button>

      {showIoT && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">IoT Device Connectivity</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIoT(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <IoTDeviceConnectivity />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
