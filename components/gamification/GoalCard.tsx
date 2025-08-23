import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import {
  Trophy,
  Target,
  Plus,
  Star,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit
} from 'lucide-react';

interface GoalCardProps {
  goalProgress: any; // Would be GoalWithProgress type
  onUpdate?: (goalId: string, newValue: number) => void;
}

export function GoalCard({ goalProgress, onUpdate }: GoalCardProps) {
  const { goal, progress_percentage, days_remaining, is_achievable } = goalProgress;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'dining_frequency': return '📅';
      case 'cuisine_exploration': return '🌍';
      case 'review_writing': return '✍️';
      case 'social_engagement': return '👥';
      case 'budget_management': return '💰';
      case 'health_conscious': return '🥗';
      default: return '🎯';
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getGoalTypeIcon(goal.goal_type)}</div>
            <div>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(goal.status)}>
                  {goal.status}
                </Badge>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${i < goal.priority_level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Indicator */}
          {days_remaining < 7 && goal.status === 'active' && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        
        <p className="text-gray-600 text-sm mt-2">{goal.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {goal.current_value} / {goal.target_value}
              </span>
            </div>
            <Progress value={progress_percentage} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress_percentage}% complete</span>
              <span>{goal.target_value - goal.current_value} remaining</span>
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Target Date</div>
                <div className="font-medium">
                  {new Date(goal.target_date).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-gray-500">Days Left</div>
                <div className={`font-medium ${
                  days_remaining < 7 ? 'text-red-600' : 
                  days_remaining < 30 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {days_remaining} days
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Likelihood */}
          {goal.status === 'active' && (
            <div className="text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Likelihood to achieve:</span>
                <Badge variant={is_achievable ? 'default' : 'destructive'}>
                  {is_achievable ? 'Good' : 'At Risk'}
                </Badge>
              </div>
            </div>
          )}

          {/* Quick Update (if active and has onUpdate) */}
          {goal.status === 'active' && onUpdate && (
            <div className="pt-2 border-t">
              <QuickUpdateForm
                goalId={goal.id}
                currentValue={goal.current_value}
                targetValue={goal.target_value}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickUpdateFormProps {
  goalId: string;
  currentValue: number;
  targetValue: number;
  onUpdate: (goalId: string, newValue: number) => void;
}

function QuickUpdateForm({ goalId, currentValue, targetValue, onUpdate }: QuickUpdateFormProps) {
  const [newValue, setNewValue] = useState(currentValue);

  const handleUpdate = () => {
    if (newValue !== currentValue && newValue >= 0 && newValue <= targetValue) {
      onUpdate(goalId, newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-500">Quick Update Progress</Label>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
          min={0}
          max={targetValue}
          className="flex-1 h-8 text-sm"
        />
        <Button 
          size="sm" 
          onClick={handleUpdate}
          disabled={newValue === currentValue}
          className="h-8"
        >
          <TrendingUp className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface CreateGoalDialogProps {
  onCreateGoal: (goalData: any) => void;
}

export function CreateGoalDialog({ onCreateGoal }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'dining_frequency',
    target_value: 1,
    target_date: '',
    priority_level: 3,
    is_public: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.target_date || formData.target_value <= 0) {
      return;
    }

    onCreateGoal(formData);
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      goal_type: 'dining_frequency',
      target_value: 1,
      target_date: '',
      priority_level: 3,
      is_public: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Goal
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Try 5 new cuisines this month"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What do you want to achieve?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goal_type">Goal Type</Label>
            <Select value={formData.goal_type} onValueChange={(value) => setFormData({...formData, goal_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dining_frequency">📅 Dining Frequency</SelectItem>
                <SelectItem value="cuisine_exploration">🌍 Cuisine Exploration</SelectItem>
                <SelectItem value="review_writing">✍️ Review Writing</SelectItem>
                <SelectItem value="social_engagement">👥 Social Engagement</SelectItem>
                <SelectItem value="budget_management">💰 Budget Management</SelectItem>
                <SelectItem value="health_conscious">🥗 Health Conscious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_value">Target Value</Label>
              <Input
                id="target_value"
                type="number"
                min="1"
                value={formData.target_value}
                onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value) || 1})}
                required
              />
            </div>

            <div>
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority_level">Priority Level</Label>
            <Select 
              value={formData.priority_level.toString()} 
              onValueChange={(value) => setFormData({...formData, priority_level: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ Low Priority</SelectItem>
                <SelectItem value="2">⭐⭐ Medium-Low</SelectItem>
                <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_public" className="text-sm">
              Make this goal visible to my family
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Trophy className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GoalCard;
