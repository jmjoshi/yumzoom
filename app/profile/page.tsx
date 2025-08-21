'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Settings, 
  Heart, 
  Trophy, 
  BarChart3, 
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  Star
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please sign in to access your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileSections = [
    {
      title: 'Enhanced Profile System',
      description: 'Advanced preference tracking, dining insights, achievements, and personalized recommendations',
      icon: Sparkles,
      href: '/profile/enhanced',
      features: ['Smart Preference Learning', 'Dining Pattern Analysis', 'Achievement System', 'Wishlist Management'],
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      new: true
    },
    {
      title: 'Family Management',
      description: 'Manage family members and their dining preferences',
      icon: Users,
      href: '/family',
      features: ['Add Family Members', 'Individual Preferences', 'Family Analytics'],
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    },
    {
      title: 'Favorites & Wishlist',
      description: 'Your saved restaurants and must-try places',
      icon: Heart,
      href: '/favorites',
      features: ['Saved Restaurants', 'Priority Levels', 'Visit Planning'],
      color: 'bg-gradient-to-br from-red-500 to-rose-500'
    },
    {
      title: 'Privacy Settings',
      description: 'Control your data privacy and sharing preferences',
      icon: Shield,
      href: '/privacy',
      features: ['Data Control', 'Visibility Settings', 'Security Options'],
      color: 'bg-gradient-to-br from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">
          Manage your account, preferences, and dining experience
        </p>
      </div>

      {/* User Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{user.email}</CardTitle>
              <CardDescription>
                Member since {new Date(user.created_at || '').toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Sections Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {profileSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {section.title}
                        {section.new && (
                          <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                            NEW
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {section.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href={section.href}>
                  <Button className="w-full" variant="outline">
                    Explore {section.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/profile/enhanced">
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="w-4 h-4 mr-2" />
                Enhanced Profile
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="outline" className="w-full justify-start">
                <Heart className="w-4 h-4 mr-2" />
                Wishlist
              </Button>
            </Link>
            <Link href="/profile/enhanced">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="w-4 h-4 mr-2" />
                Achievements
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
