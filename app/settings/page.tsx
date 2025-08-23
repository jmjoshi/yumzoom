'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import PrivacySettings from '@/components/user/PrivacySettings';
import PersonalizationSettings from '@/components/user/PersonalizationSettings';
import { 
  Settings, 
  Shield, 
  User, 
  Bell, 
  CreditCard, 
  Smartphone,
  Globe,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your account settings, privacy preferences, and personalization options.
          </p>
        </div>

        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="personalization" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personalization
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile App
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          {/* Personalization Settings Tab */}
          <TabsContent value="personalization">
            <PersonalizationSettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose when and how you want to be notified about YumZoom activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">New Reviews</p>
                          <p className="text-sm text-gray-600">Get notified when someone reviews a restaurant you follow</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Family Updates</p>
                          <p className="text-sm text-gray-600">Notifications about family member activities</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Restaurant Recommendations</p>
                          <p className="text-sm text-gray-600">Personalized restaurant suggestions</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Nearby Restaurants</p>
                          <p className="text-sm text-gray-600">Get notified about highly-rated restaurants near you</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Social Activity</p>
                          <p className="text-sm text-gray-600">Friends' reviews and check-ins</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Manage your account details and subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Update your password and manage security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Update Password
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mobile App Tab */}
          <TabsContent value="mobile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile App Settings
                </CardTitle>
                <CardDescription>
                  Configure your mobile app experience and offline features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">App Behavior</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Offline Mode</p>
                          <p className="text-sm text-gray-600">Save restaurants and reviews for offline viewing</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-sync</p>
                          <p className="text-sm text-gray-600">Automatically sync data when connected to WiFi</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Background App Refresh</p>
                          <p className="text-sm text-gray-600">Allow app to refresh content in the background</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Usage</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Download Images on WiFi Only</p>
                          <p className="text-sm text-gray-600">Reduce mobile data usage</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Preload Nearby Restaurants</p>
                          <p className="text-sm text-gray-600">Download restaurant data for your area</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>
                    Developer options and advanced configuration settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data & Analytics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Usage Analytics</p>
                            <p className="text-sm text-gray-600">Help improve YumZoom by sharing anonymous usage data</p>
                          </div>
                          <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Crash Reports</p>
                            <p className="text-sm text-gray-600">Automatically send crash reports to help fix issues</p>
                          </div>
                          <input type="checkbox" className="h-4 w-4" defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data Export & Deletion</h3>
                      <div className="space-y-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                          Export My Data
                        </button>
                        <p className="text-sm text-gray-600">Download all your data in a portable format</p>
                        
                        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                          Delete Account
                        </button>
                        <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">API Access</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Third-party Integrations</p>
                            <p className="text-sm text-gray-600">Allow approved third-party apps to access your data</p>
                          </div>
                          <input type="checkbox" className="h-4 w-4" />
                        </div>
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                          Manage API Keys
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
