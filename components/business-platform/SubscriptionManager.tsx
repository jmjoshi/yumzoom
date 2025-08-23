import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  CheckCircle, 
  CreditCard, 
  Clock, 
  AlertCircle,
  Crown,
  Zap,
  Building,
  Rocket
} from 'lucide-react';
import { useSubscriptions } from '@/hooks/useBusinessPlatform';
import { SubscriptionPlan } from '@/types/business-platform';

interface SubscriptionManagerProps {
  restaurantId: string;
}

export default function SubscriptionManager({ restaurantId }: SubscriptionManagerProps) {
  const {
    loading,
    error,
    plans,
    currentSubscription,
    fetchData,
    subscribe,
    upgradeSubscription,
    toggleAutoRenew,
    cancelSubscription,
    clearError
  } = useSubscriptions(restaurantId);

  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubscribe = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);
      await subscribe(planId, billingCycle);
      setSelectedPlan(null);
    } catch (err) {
      console.error('Error subscribing:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);
      await upgradeSubscription(planId);
      setSelectedPlan(null);
    } catch (err) {
      console.error('Error upgrading:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      await toggleAutoRenew();
    } catch (err) {
      console.error('Error toggling auto-renew:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      try {
        await cancelSubscription();
      } catch (err) {
        console.error('Error cancelling subscription:', err);
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Clock className="h-6 w-6" />;
      case 'starter': return <Zap className="h-6 w-6" />;
      case 'professional': return <Building className="h-6 w-6" />;
      case 'enterprise': return <Crown className="h-6 w-6" />;
      default: return <Rocket className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'text-gray-600';
      case 'starter': return 'text-blue-600';
      case 'professional': return 'text-purple-600';
      case 'enterprise': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.subscription_plan_id === planId;
  };

  const canUpgradeTo = (plan: SubscriptionPlan) => {
    if (!currentSubscription) return true;
    
    const currentPlanPrice = currentSubscription.subscription_plan?.price_monthly || 0;
    return plan.price_monthly > currentPlanPrice;
  };

  const getYearlyDiscount = (plan: SubscriptionPlan) => {
    if (!plan.price_yearly) return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  if (loading && !plans.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {currentSubscription && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {currentSubscription.subscription_plan?.display_name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentSubscription.subscription_plan?.description}
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> <Badge variant="secondary">{currentSubscription.status}</Badge></p>
                  <p><strong>Billing:</strong> {currentSubscription.billing_cycle}</p>
                  <p><strong>Expires:</strong> {new Date(currentSubscription.expires_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Switch
                      checked={currentSubscription.auto_renew}
                      onCheckedChange={handleToggleAutoRenew}
                      disabled={loading}
                    />
                    <span className="text-sm">Auto-renew</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Current Features</h4>
                <ul className="space-y-1 text-sm">
                  {currentSubscription.subscription_plan?.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${isCurrentPlan(plan.id) ? 'ring-2 ring-blue-500' : ''} ${
                plan.name === 'professional' ? 'border-purple-200' : ''
              }`}
            >
              {plan.name === 'professional' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`mx-auto mb-2 ${getPlanColor(plan.name)}`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="flex items-center justify-between">
                  {plan.display_name}
                  {isCurrentPlan(plan.id) && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">
                    ${plan.price_monthly}
                    <span className="text-sm text-gray-600 font-normal">/month</span>
                  </div>
                  {plan.price_yearly && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        or ${plan.price_yearly}/year
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Save {getYearlyDiscount(plan)}%
                      </Badge>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  {isCurrentPlan(plan.id) ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <>
                      {currentSubscription && canUpgradeTo(plan) ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={subscribing && selectedPlan === plan.id}
                        >
                          {subscribing && selectedPlan === plan.id ? 'Upgrading...' : 'Upgrade'}
                        </Button>
                      ) : !currentSubscription ? (
                        <>
                          <Button 
                            className="w-full"
                            onClick={() => handleSubscribe(plan.id, 'monthly')}
                            disabled={subscribing && selectedPlan === plan.id}
                          >
                            {subscribing && selectedPlan === plan.id ? 'Processing...' : 'Subscribe Monthly'}
                          </Button>
                          {plan.price_yearly && (
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => handleSubscribe(plan.id, 'yearly')}
                              disabled={subscribing && selectedPlan === plan.id}
                            >
                              Subscribe Yearly
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button className="w-full" disabled>
                          Downgrade Not Available
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Plan Limits */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-medium text-gray-600 mb-2">LIMITS</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    {Object.entries(plan.limits).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        <span>{value === -1 ? 'Unlimited' : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Compare features across all subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-2 min-w-24">
                      {plan.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Get all unique features */}
                {Array.from(new Set(plans.flatMap(p => p.features))).map((feature) => (
                  <tr key={feature} className="border-b">
                    <td className="py-2 capitalize">{feature.replace(/_/g, ' ')}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-2">
                        {plan.features.includes(feature) ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
