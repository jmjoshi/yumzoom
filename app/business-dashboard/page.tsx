'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { BusinessPartnerOnly } from '@/components/auth/RoleGuard';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Target, 
  Settings, 
  BarChart3,
  Megaphone,
  Code,
  Gift,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionPlan, RestaurantSubscription, BusinessDashboardStats } from '@/types/business-platform';

interface BusinessDashboardProps {
  restaurantId: string;
}

export default function BusinessDashboard({ restaurantId }: BusinessDashboardProps) {
  return (
    <BusinessPartnerOnly
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Partner Access Required</h2>
            <p className="text-gray-600 mb-4">
              This business dashboard is only accessible to business partners and administrators.
            </p>
            <p className="text-sm text-gray-500">
              Contact us to become a business partner and access platform analytics.
            </p>
          </div>
        </div>
      }
    >
      <BusinessDashboardContent restaurantId={restaurantId} />
    </BusinessPartnerOnly>
  );
}

function BusinessDashboardContent({ restaurantId }: BusinessDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<RestaurantSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      fetchDashboardData();
    }
  }, [restaurantId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscription plans
      const plansResponse = await fetch('/api/business-platform/subscriptions?plans_only=true');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setAvailablePlans(plansData.data);
        }
      }

      // Fetch current subscription
      const subscriptionResponse = await fetch(`/api/business-platform/subscriptions?restaurant_id=${restaurantId}`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        if (subscriptionData.success && subscriptionData.data.length > 0) {
          setCurrentSubscription(subscriptionData.data[0]);
        }
      }

      // TODO: Fetch dashboard stats from API
      // For now, using mock data
      setStats({
        restaurant_id: restaurantId,
        subscription_plan: availablePlans[0] || {} as SubscriptionPlan,
        subscription_status: currentSubscription?.status || 'active',
        subscription_expires_at: currentSubscription?.expires_at || new Date().toISOString(),
        total_views: 1250,
        total_ratings: 48,
        average_rating: 8.4,
        total_reviews: 32,
        monthly_engagement_events: 156,
        top_engagement_types: [
          { event_type: 'profile_view', count: 85 },
          { event_type: 'menu_view', count: 71 }
        ],
        feature_usage: [
          { feature_name: 'respond_to_reviews', has_access: true, usage_limit: 100, current_usage: 12, usage_remaining: 88 },
          { feature_name: 'promotional_content', has_access: true, usage_limit: 3, current_usage: 1, usage_remaining: 2 }
        ],
        active_ad_campaigns: 2,
        total_ad_spend: 150.00,
        ad_performance_summary: {
          impressions: 12500,
          clicks: 175,
          conversions: 23,
          ctr: 1.4
        },
        pending_insights: 5,
        high_priority_insights: [],
        active_promotions: 1,
        promotion_performance: {
          total_views: 450,
          total_uses: 28,
          conversion_rate: 6.2
        }
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeatureUsageColor = (usage: number, limit: number) => {
    const percentage = limit > 0 ? (usage / limit) * 100 : 0;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading business dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your restaurant's presence on YumZoom</p>
        </div>

        {/* Subscription Status */}
        {currentSubscription && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription Status
                    </CardTitle>
                    <CardDescription>
                      Current plan: {currentSubscription.subscription_plan?.display_name}
                    </CardDescription>
                  </div>
                  <Badge className={getSubscriptionStatusColor(currentSubscription.status)}>
                    {currentSubscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auto Renew</p>
                    <p className="font-semibold">
                      {currentSubscription.auto_renew ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Cycle</p>
                    <p className="font-semibold capitalize">{currentSubscription.billing_cycle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  From {stats.total_ratings} ratings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ad Campaigns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_ad_campaigns}</div>
                <p className="text-xs text-muted-foreground">
                  ${stats.total_ad_spend} spent this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Insights</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_insights}</div>
                <p className="text-xs text-muted-foreground">
                  Pending review
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="advertising">Advertising</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="developer">API</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Feature Usage */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage</CardTitle>
                  <CardDescription>Monitor your subscription feature usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.feature_usage.map((feature) => (
                      <div key={feature.feature_name} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {feature.feature_name.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {feature.usage_limit === -1 ? 'Unlimited' : 
                             `${feature.current_usage}/${feature.usage_limit} used`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {feature.has_access ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          {(feature.usage_limit ?? 0) > 0 && (
                            <span className={getFeatureUsageColor(feature.current_usage || 0, feature.usage_limit ?? 0)}>
                              {feature.usage_remaining} remaining
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common business platform tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Megaphone className="h-6 w-6" />
                    <span className="text-sm">Create Ad</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Gift className="h-6 w-6" />
                    <span className="text-sm">Add Promotion</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Code className="h-6 w-6" />
                    <span className="text-sm">API Access</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            {/* Available Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availablePlans.map((plan) => (
                <Card key={plan.id} className={currentSubscription?.subscription_plan_id === plan.id ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.display_name}
                      {currentSubscription?.subscription_plan_id === plan.id && (
                        <Badge>Current</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">
                      ${plan.price_monthly}
                      <span className="text-sm text-gray-600 font-normal">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-gray-600">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                    <Button 
                      className="w-full mt-4" 
                      variant={currentSubscription?.subscription_plan_id === plan.id ? 'outline' : 'primary'}
                      disabled={currentSubscription?.subscription_plan_id === plan.id}
                    >
                      {currentSubscription?.subscription_plan_id === plan.id ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Detailed insights about your restaurant's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Advanced analytics coming soon</p>
                  <p className="text-sm text-gray-500">Upgrade to Professional plan for detailed analytics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advertising" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advertising Campaigns</CardTitle>
                <CardDescription>Create and manage your advertising campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Advertising platform coming soon</p>
                  <p className="text-sm text-gray-500">Promote your restaurant to targeted families</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Content</CardTitle>
                <CardDescription>Create special offers and promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Promotion manager coming soon</p>
                  <p className="text-sm text-gray-500">Create discounts and special offers for your customers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>Integrate with third-party applications and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">API platform coming soon</p>
                  <p className="text-sm text-gray-500">Available with Enterprise plan</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
