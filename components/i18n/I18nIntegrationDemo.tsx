'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import {
  Languages,
  Accessibility,
  Globe,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  AlertTriangle,
  Plus,
  Settings,
  Volume2
} from 'lucide-react';

interface TranslationEntry {
  id: string;
  key: string;
  sourceText: string;
  translatedText: string;
  locale: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto';
  lastModified: string;
  translator: string;
  context?: string;
  category: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  accessibility_features: string[];
  location: string;
}

export default function I18nIntegrationDemo() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'translations' | 'restaurants' | 'accessibility'>('translations');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sample translation data
  const [translations, setTranslations] = useState<TranslationEntry[]>([
    {
      id: '1',
      key: 'restaurant.cuisine.italian',
      sourceText: 'Italian Cuisine',
      translatedText: 'Cuisine Italienne',
      locale: 'fr',
      status: 'approved',
      lastModified: '2024-01-15T10:30:00Z',
      translator: 'Marie Dubois',
      context: 'Restaurant cuisine type',
      category: 'cuisine'
    },
    {
      id: '2',
      key: 'accessibility.wheelchair_accessible',
      sourceText: 'Wheelchair Accessible',
      translatedText: 'Accesible en Silla de Ruedas',
      locale: 'es',
      status: 'pending',
      lastModified: '2024-01-14T15:45:00Z',
      translator: 'Carlos Rodriguez',
      context: 'Accessibility feature',
      category: 'accessibility'
    },
    {
      id: '3',
      key: 'search.filter.dietary.vegan',
      sourceText: 'Vegan Options',
      translatedText: 'Opzioni Vegane',
      locale: 'it',
      status: 'approved',
      lastModified: '2024-01-13T09:15:00Z',
      translator: 'Giuseppe Rossi',
      context: 'Dietary filter option',
      category: 'search'
    }
  ]);

  // Sample restaurant data with multilingual support
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'La Bella Vita',
      description: 'Authentic Italian restaurant with traditional recipes',
      cuisine_type: 'Italian',
      accessibility_features: ['wheelchair_accessible', 'braille_menu', 'hearing_loop'],
      location: 'Downtown'
    },
    {
      id: '2',
      name: 'Sushi Zen',
      description: 'Fresh sushi and Japanese cuisine experience',
      cuisine_type: 'Japanese',
      accessibility_features: ['wheelchair_accessible', 'large_print_menu'],
      location: 'Midtown'
    }
  ]);

  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translation.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translation.translatedText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocale = selectedLocale === 'all' || translation.locale === selectedLocale;
    const matchesStatus = filterStatus === 'all' || translation.status === filterStatus;
    
    return matchesSearch && matchesLocale && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="primary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'auto':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Auto-translated</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAccessibilityFeatureName = (feature: string) => {
    const features: Record<string, string> = {
      wheelchair_accessible: 'Wheelchair Accessible',
      braille_menu: 'Braille Menu Available',
      hearing_loop: 'Hearing Loop System',
      large_print_menu: 'Large Print Menu',
      tactile_guidance: 'Tactile Guidance',
      sign_language: 'Sign Language Support'
    };
    return features[feature] || feature;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header with Language Switcher and Accessibility Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Internationalization & Accessibility Integration Demo
          </h1>
          <p className="text-gray-600">
            Experience multi-language support and accessibility features in action
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="dropdown" />
          <AccessibilityPanel />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'translations', label: 'Translation Management', icon: Languages },
            { id: 'restaurants', label: 'Multilingual Content', icon: Globe },
            { id: 'accessibility', label: 'Accessibility Features', icon: Accessibility },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Translation Management Tab */}
      {activeTab === 'translations' && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search translations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedLocale}
                  onChange={(e) => setSelectedLocale(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Languages</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="auto">Auto-translated</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Translation
                </Button>
              </div>
            </div>
          </Card>

          {/* Translation List */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Translation Entries ({filteredTranslations.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Text
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Translation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTranslations.map((translation) => (
                      <tr key={translation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <div className="font-mono text-xs text-blue-600">{translation.key}</div>
                            <div className="text-xs text-gray-500">{translation.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate">{translation.sourceText}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate">{translation.translatedText}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {translation.locale.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(translation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            {translation.status === 'pending' && (
                              <>
                                <button className="text-green-600 hover:text-green-900">
                                  <Check className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Multilingual Content Tab */}
      {activeTab === 'restaurants' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sample Restaurant Content</h3>
            <p className="text-gray-600 mb-6">
              This demonstrates how restaurant content appears in different languages using our i18n system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="p-6 border">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{restaurant.name}</h4>
                      <p className="text-gray-600 mt-1">{restaurant.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{restaurant.cuisine_type}</Badge>
                      <span className="text-sm text-gray-500">• {restaurant.location}</span>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Accessibility Features:</h5>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.accessibility_features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {getAccessibilityFeatureName(feature)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Content automatically adapts to selected language and accessibility preferences
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Cuisine Categories in Multiple Languages */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cuisine Categories (Multilingual)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                'Italian', 'Japanese', 'Mexican', 'Chinese', 'French', 'Indian',
                'Thai', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek'
              ].map((cuisine) => (
                <div key={cuisine} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{cuisine}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Auto-translates to selected language
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Accessibility Features Tab */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accessibility Features Integration</h3>
            <p className="text-gray-600 mb-6">
              Experience how accessibility features work across different languages and user preferences.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Screen Reader Support */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Volume2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium">Screen Reader Support</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  All content includes proper ARIA labels and semantic markup for screen readers.
                </p>
                <Badge variant="primary">Active</Badge>
              </div>

              {/* High Contrast Mode */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-medium">High Contrast Mode</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Enhanced visual contrast for better readability.
                </p>
                <Badge variant="secondary">Available</Badge>
              </div>

              {/* Keyboard Navigation */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Settings className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-medium">Keyboard Navigation</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Full keyboard navigation support for all interactive elements.
                </p>
                <Badge variant="primary">Active</Badge>
              </div>

              {/* Motion Reduction */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-medium">Reduced Motion</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Respects user's motion sensitivity preferences.
                </p>
                <Badge variant="secondary">Configurable</Badge>
              </div>

              {/* Font Size Control */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Languages className="h-5 w-5 text-red-600" />
                  </div>
                  <h4 className="font-medium">Font Size Control</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Adjustable font sizes for better readability.
                </p>
                <Badge variant="primary">Active</Badge>
              </div>

              {/* Language Direction */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Globe className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h4 className="font-medium">RTL Language Support</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Right-to-left text direction for Arabic and Hebrew.
                </p>
                <Badge variant="primary">Active</Badge>
              </div>
            </div>
          </Card>

          {/* Accessibility Testing */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accessibility Testing Tools</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Test Color Contrast
              </Button>
              <Button variant="outline">
                <Volume2 className="h-4 w-4 mr-2" />
                Test Screen Reader
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Test Keyboard Navigation
              </Button>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Run WCAG Audit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
