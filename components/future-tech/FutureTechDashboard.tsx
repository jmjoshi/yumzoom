'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Eye, 
  Mic, 
  Home, 
  Shield, 
  Brain, 
  Sparkles,
  Rocket,
  Star,
  TrendingUp,
  Globe,
  Lock,
  Award,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { ARDiscoveryButton } from './ARRestaurantDiscovery';
import { VoiceAssistantButton } from './VoiceAssistantIntegration';
import { IoTConnectivityButton } from './IoTDeviceConnectivity';
import { BlockchainAuthenticityButton } from './BlockchainReviewAuthenticity';

interface FeatureStats {
  arUsage: number;
  voiceQueries: number;
  iotConnections: number;
  blockchainVerifications: number;
  userAdoption: number;
  satisfactionScore: number;
}

interface TechFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'available' | 'beta' | 'coming_soon';
  usageCount: number;
  satisfactionScore: number;
  capabilities: string[];
  benefits: string[];
}

interface FutureTechDashboardProps {
  className?: string;
}

export function FutureTechDashboard({ className = '' }: FutureTechDashboardProps) {
  const [stats, setStats] = useState<FeatureStats>({
    arUsage: 0,
    voiceQueries: 0,
    iotConnections: 0,
    blockchainVerifications: 0,
    userAdoption: 0,
    satisfactionScore: 0,
  });
  const [features, setFeatures] = useState<TechFeature[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock feature data
  const techFeatures: TechFeature[] = [
    {
      id: 'ar_discovery',
      name: 'AR Restaurant Discovery',
      description: 'Use augmented reality to discover restaurants around you with real-time information overlay',
      icon: Eye,
      status: 'available',
      usageCount: 1247,
      satisfactionScore: 4.6,
      capabilities: [
        'Real-time camera overlay',
        'Location-based discovery',
        'Restaurant information display',
        'Distance and direction',
        'Rating and reviews overlay',
        'Photo and menu preview'
      ],
      benefits: [
        'Immersive discovery experience',
        'Visual restaurant exploration',
        'Real-world navigation assistance',
        'Enhanced decision making',
        'Future-ready technology'
      ],
    },
    {
      id: 'voice_assistant',
      name: 'Voice Assistant Integration',
      description: 'Control YumZoom with voice commands and integrate with smart speakers',
      icon: Mic,
      status: 'available',
      usageCount: 3891,
      satisfactionScore: 4.4,
      capabilities: [
        'Natural language processing',
        'Smart speaker integration',
        'Voice search and filters',
        'Hands-free operation',
        'Multi-language support',
        'Context awareness'
      ],
      benefits: [
        'Hands-free convenience',
        'Accessibility support',
        'Faster interactions',
        'Smart home integration',
        'Modern user experience'
      ],
    },
    {
      id: 'iot_connectivity',
      name: 'IoT Device Connectivity',
      description: 'Connect with smart home devices for automated dining experiences',
      icon: Home,
      status: 'beta',
      usageCount: 892,
      satisfactionScore: 4.2,
      capabilities: [
        'Smart home integration',
        'Automated scenarios',
        'Device synchronization',
        'Context-aware actions',
        'Energy optimization',
        'Security features'
      ],
      benefits: [
        'Seamless home automation',
        'Enhanced convenience',
        'Personalized experiences',
        'Energy efficiency',
        'Future-proof connectivity'
      ],
    },
    {
      id: 'blockchain_authenticity',
      name: 'Blockchain Review Authenticity',
      description: 'Ensure review authenticity and trust through blockchain verification',
      icon: Shield,
      status: 'available',
      usageCount: 5634,
      satisfactionScore: 4.8,
      capabilities: [
        'Immutable review storage',
        'Cryptographic verification',
        'Trust score calculation',
        'Fraud prevention',
        'Transparency assurance',
        'Consensus validation'
      ],
      benefits: [
        'Enhanced trust and credibility',
        'Fraud prevention',
        'Transparent verification',
        'Improved review quality',
        'Industry-leading security'
      ],
    },
  ];

  useEffect(() => {
    setFeatures(techFeatures);
    calculateStats(techFeatures);
  }, []);

  // Calculate feature statistics
  const calculateStats = (features: TechFeature[]) => {
    const totalUsage = features.reduce((sum, f) => sum + f.usageCount, 0);
    const averageSatisfaction = features.reduce((sum, f) => sum + f.satisfactionScore, 0) / features.length;
    const availableFeatures = features.filter(f => f.status === 'available').length;
    const adoptionRate = (availableFeatures / features.length) * 100;

    setStats({
      arUsage: features.find(f => f.id === 'ar_discovery')?.usageCount || 0,
      voiceQueries: features.find(f => f.id === 'voice_assistant')?.usageCount || 0,
      iotConnections: features.find(f => f.id === 'iot_connectivity')?.usageCount || 0,
      blockchainVerifications: features.find(f => f.id === 'blockchain_authenticity')?.usageCount || 0,
      userAdoption: adoptionRate,
      satisfactionScore: averageSatisfaction,
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'beta': return 'text-yellow-600';
      case 'coming_soon': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'beta': return 'secondary';
      case 'coming_soon': return 'outline';
      default: return 'outline';
    }
  };

  // Render feature card
  const renderFeatureCard = (feature: TechFeature) => {
    const Icon = feature.icon;
    
    return (
      <Card key={feature.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{feature.name}</h3>
                <Badge variant={getStatusBadge(feature.status)} className="mt-1">
                  {feature.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{feature.satisfactionScore}</span>
              </div>
              <p className="text-xs text-gray-500">{feature.usageCount.toLocaleString()} uses</p>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{feature.description}</p>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Key Capabilities</h4>
              <div className="flex flex-wrap gap-1">
                {feature.capabilities.slice(0, 3).map((capability) => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability}
                  </Badge>
                ))}
                {feature.capabilities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{feature.capabilities.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Benefits</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {feature.benefits.slice(0, 2).map((benefit) => (
                  <li key={benefit} className="flex items-center">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mr-2" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              {feature.id === 'ar_discovery' && (
                <ARDiscoveryButton 
                  className="w-full" 
                  disabled={feature.status !== 'available'}
                />
              )}
              {feature.id === 'voice_assistant' && (
                <VoiceAssistantButton 
                  className="w-full" 
                  disabled={feature.status !== 'available'}
                />
              )}
              {feature.id === 'iot_connectivity' && (
                <IoTConnectivityButton 
                  className="w-full" 
                  disabled={feature.status !== 'available'}
                />
              )}
              {feature.id === 'blockchain_authenticity' && (
                <BlockchainAuthenticityButton 
                  className="w-full" 
                  disabled={feature.status !== 'available'}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-6 w-6 mr-3 text-blue-600" />
            Future Technology Features
            <Badge variant="default" className="ml-3">
              <Sparkles className="h-3 w-3 mr-1" />
              Next-Gen
            </Badge>
          </CardTitle>
          <p className="text-gray-600">
            Experience cutting-edge technology that positions YumZoom as a leader in restaurant discovery
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.arUsage.toLocaleString()}</div>
              <div className="text-sm text-gray-600">AR Discoveries</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
              <Mic className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.voiceQueries.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Voice Queries</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <Home className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.iotConnections.toLocaleString()}</div>
              <div className="text-sm text-gray-600">IoT Connections</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
              <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{stats.blockchainVerifications.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Blockchain Verifications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Adoption Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Feature Adoption Rate</span>
                    <span>{stats.userAdoption.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.userAdoption} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>User Satisfaction</span>
                    <span>{stats.satisfactionScore.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(stats.satisfactionScore / 5) * 100} className="h-2" />
                </div>
                
                <div className="pt-4 border-t text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Available Features:</span>
                    <span>{features.filter(f => f.status === 'available').length}/{features.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta Features:</span>
                    <span>{features.filter(f => f.status === 'beta').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Usage:</span>
                    <span>{features.reduce((sum, f) => sum + f.usageCount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Technology Leadership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">AI-Powered</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Web3 Ready</span>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Secure</span>
                    </div>
                    <Badge variant="default">Verified</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Rocket className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">Innovation Leader</span>
                    </div>
                    <Badge variant="default">Recognized</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technology Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.id} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium mb-1">{feature.name}</h3>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs">{feature.satisfactionScore}</span>
                      </div>
                      <Badge variant={getStatusBadge(feature.status)} className="text-xs">
                        {feature.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map(renderFeatureCard)}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature) => {
                    const percentage = (feature.usageCount / Math.max(...features.map(f => f.usageCount))) * 100;
                    return (
                      <div key={feature.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{feature.name}</span>
                          <span>{feature.usageCount.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Satisfaction Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature) => {
                    const percentage = (feature.satisfactionScore / 5) * 100;
                    return (
                      <div key={feature.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{feature.name}</span>
                          <span>{feature.satisfactionScore}/5.0</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Monthly Active Users</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">+23.5%</div>
                      <div className="text-xs text-gray-500">vs last month</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Feature Engagement</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">+18.2%</div>
                      <div className="text-xs text-gray-500">vs last month</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">User Satisfaction</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">+12.1%</div>
                      <div className="text-xs text-gray-500">vs last month</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technology Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">Business Impact</h4>
                    <p className="text-green-700">Technology features increased user engagement by 35% and positioned YumZoom as an innovation leader in the restaurant discovery space.</p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">User Experience</h4>
                    <p className="text-blue-700">Advanced features provide immersive and convenient experiences that differentiate YumZoom from traditional restaurant apps.</p>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-1">Future Ready</h4>
                    <p className="text-purple-700">Implementation of cutting-edge technology ensures YumZoom stays ahead of industry trends and user expectations.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export individual components for use elsewhere
export {
  ARDiscoveryButton,
  VoiceAssistantButton,
  IoTConnectivityButton,
  BlockchainAuthenticityButton,
};
