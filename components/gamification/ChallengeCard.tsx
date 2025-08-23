import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import {
  Target,
  Trophy,
  Users,
  Clock,
  Star,
  CheckCircle,
  ChevronRight,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface ChallengeCardProps {
  challengeProgress: any; // Would be ChallengeWithProgress type
  onJoin: (challengeId: string) => void;
}

export function ChallengeCard({ challengeProgress, onJoin }: ChallengeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { challenge, participation, can_participate, time_remaining } = challengeProgress;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exploration': return '🗺️';
      case 'frequency': return '📅';
      case 'social': return '👥';
      case 'variety': return '🎯';
      case 'quality': return '⭐';
      default: return '🏆';
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{challenge.icon}</div>
              <div>
                <CardTitle className="text-lg">{challenge.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                    {challenge.difficulty_level}
                  </Badge>
                  <Badge variant="outline">
                    {getCategoryIcon(challenge.category)} {challenge.category}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-2">{challenge.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Challenge Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{challenge.duration_days} days</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{challenge.challenge_type}</span>
              </div>
            </div>

            {/* Progress (if participating) */}
            {participation && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{participation.completion_percentage}%</span>
                </div>
                <Progress value={participation.completion_percentage} />
                
                {!participation.is_completed && time_remaining && (
                  <div className="flex items-center text-sm text-orange-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.floor(time_remaining / 24)}d {time_remaining % 24}h remaining
                  </div>
                )}
              </div>
            )}

            {/* Rewards Preview */}
            <div className="text-sm">
              <span className="text-gray-600">Rewards: </span>
              {challenge.rewards.map((reward: any, index: number) => (
                <Badge key={index} variant="secondary" className="ml-1">
                  {reward.value?.points ? `${reward.value.points} pts` : reward.type}
                </Badge>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {!participation ? (
                <Button 
                  onClick={() => onJoin(challenge.id)}
                  className="w-full"
                  disabled={!can_participate}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Join Challenge
                </Button>
              ) : participation.is_completed ? (
                <Button variant="secondary" disabled className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                  View Progress
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <span className="text-3xl">{challenge.icon}</span>
              <span>{challenge.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Full Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-600">{challenge.description}</p>
            </div>

            {/* Challenge Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Challenge Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{challenge.challenge_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="capitalize">{challenge.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                      {challenge.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{challenge.duration_days} days</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(challenge.requirements).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div>
              <h4 className="font-semibold mb-2">Rewards</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challenge.rewards.map((reward: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">
                      {reward.type === 'points' ? '🏆' : 
                       reward.type === 'badge' ? '🏅' : 
                       reward.type === 'discount' ? '💰' : '⭐'}
                    </div>
                    <div>
                      <div className="font-medium">{reward.title}</div>
                      <div className="text-sm text-gray-600">{reward.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress (if participating) */}
            {participation && (
              <div>
                <h4 className="font-semibold mb-2">Your Progress</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Overall Progress</span>
                      <span>{participation.completion_percentage}%</span>
                    </div>
                    <Progress value={participation.completion_percentage} className="h-3" />
                  </div>

                  {participation.progress && Object.keys(participation.progress).length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Detailed Progress</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(participation.progress).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!participation.is_completed && time_remaining && (
                    <div className="flex items-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {Math.floor(time_remaining / 24)} days and {time_remaining % 24} hours remaining
                      </span>
                    </div>
                  )}

                  {participation.is_completed && (
                    <div className="flex items-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Challenge completed on {new Date(participation.completed_at!).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChallengeCard;
