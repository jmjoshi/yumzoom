import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import {
  Gift,
  Star,
  CreditCard,
  Percent,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface RewardRedemption {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'feature' | 'badge' | 'special';
  value: number | string;
  points_cost: number;
  icon: string;
  is_available: boolean;
  expires_at?: string;
  redemption_limit?: number;
  current_redemptions?: number;
}

export function RewardRedemptionSystem() {
  const { summary, claimReward } = useAdvancedGamification();
  const [selectedReward, setSelectedReward] = useState<RewardRedemption | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  // Mock reward catalog - in real implementation, this would come from the API
  const rewardCatalog: RewardRedemption[] = [
    {
      id: '1',
      title: '10% Off Next Order',
      description: 'Get 10% off your next restaurant order',
      type: 'discount',
      value: 10,
      points_cost: 500,
      icon: '💰',
      is_available: true,
      redemption_limit: 5,
      current_redemptions: 2,
    },
    {
      id: '2',
      title: 'Free Delivery',
      description: 'One free delivery on any order over $25',
      type: 'discount',
      value: 'free_delivery',
      points_cost: 300,
      icon: '🚚',
      is_available: true,
      redemption_limit: 10,
      current_redemptions: 7,
    },
    {
      id: '3',
      title: 'VIP Status',
      description: 'Unlock VIP features for 30 days',
      type: 'feature',
      value: 'vip_30_days',
      points_cost: 1000,
      icon: '👑',
      is_available: true,
    },
    {
      id: '4',
      title: 'Exclusive Badge',
      description: 'Show off your elite status with a special badge',
      type: 'badge',
      value: 'elite_member',
      points_cost: 750,
      icon: '🏆',
      is_available: true,
    },
    {
      id: '5',
      title: 'Priority Support',
      description: 'Get priority customer support for 1 month',
      type: 'feature',
      value: 'priority_support_30_days',
      points_cost: 400,
      icon: '🎧',
      is_available: true,
    },
  ];

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="h-5 w-5 text-green-600" />;
      case 'feature':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'badge':
        return <Crown className="h-5 w-5 text-yellow-600" />;
      case 'special':
        return <Gift className="h-5 w-5 text-purple-600" />;
      default:
        return <Gift className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'border-green-200 bg-green-50';
      case 'feature':
        return 'border-blue-200 bg-blue-50';
      case 'badge':
        return 'border-yellow-200 bg-yellow-50';
      case 'special':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const canAffordReward = (pointsCost: number) => {
    return (summary?.total_points || 0) >= pointsCost;
  };

  const handleRedeemClick = (reward: RewardRedemption) => {
    if (!canAffordReward(reward.points_cost)) return;

    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const handleConfirmRedemption = async () => {
    if (!selectedReward) return;

    setRedeeming(true);
    try {
      // In real implementation, this would call the API
      // For now, we'll simulate the redemption
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update the reward catalog (remove redeemed item or update limits)
      // This would be handled by the API in real implementation

      setShowConfirmDialog(false);
      setSelectedReward(null);

      // Show success message (in real implementation, this would come from the API response)
      alert(`Successfully redeemed: ${selectedReward.title}!`);

    } catch (error) {
      console.error('Redemption failed:', error);
      alert('Redemption failed. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const availableRewards = rewardCatalog.filter(reward => reward.is_available);
  const userPoints = summary?.total_points || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Reward Redemption</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold">{userPoints} points</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRewards.map((reward) => {
              const canAfford = canAffordReward(reward.points_cost);
              const isLimited = reward.redemption_limit !== undefined;
              const remaining = isLimited
                ? (reward.redemption_limit! - (reward.current_redemptions || 0))
                : null;

              return (
                <Card
                  key={reward.id}
                  className={`relative transition-all duration-200 hover:shadow-md ${
                    getRewardColor(reward.type)
                  } ${!canAfford ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{reward.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                      </div>
                      {getRewardIcon(reward.type)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{reward.points_cost} points</span>
                      </div>

                      {isLimited && remaining !== null && (
                        <Badge variant="outline" className="text-xs">
                          {remaining} left
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3">
                      <Button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canAfford || (isLimited && remaining === 0)}
                        className="w-full"
                        variant={canAfford ? "primary" : "secondary"}
                      >
                        {!canAfford ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Need {reward.points_cost - userPoints} more points
                          </>
                        ) : isLimited && remaining === 0 ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Sold Out
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Redeem
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {availableRewards.length === 0 && (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rewards available at the moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back later for new redemption options!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-3xl">{selectedReward.icon}</span>
                <div>
                  <h3 className="font-semibold">{selectedReward.title}</h3>
                  <p className="text-sm text-gray-600">{selectedReward.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Points Required:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">{selectedReward.points_cost}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Your Balance:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">{userPoints}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <span>Remaining Balance:</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-green-600">
                    {userPoints - selectedReward.points_cost}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                  disabled={redeeming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRedemption}
                  className="flex-1"
                  disabled={redeeming}
                >
                  {redeeming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RewardRedemptionSystem;
