import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import {
  Bell,
  Trophy,
  Star,
  Flame,
  Gift,
  CheckCircle,
  X,
  Clock
} from 'lucide-react';

interface AchievementNotification {
  id: string;
  notification_type: 'achievement_unlocked' | 'milestone_reached' | 'points_earned' | 'streak_milestone';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function AchievementNotifications() {
  const { settings } = useAdvancedGamification();
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Mock data for now - in real implementation, this would come from the API
  useEffect(() => {
    // Simulate API call
    const mockNotifications: AchievementNotification[] = [
      {
        id: '1',
        notification_type: 'achievement_unlocked',
        title: '🏆 First Review Unlocked!',
        message: 'Congratulations! You earned your first achievement for submitting a review.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        id: '2',
        notification_type: 'points_earned',
        title: 'Points Earned!',
        message: 'You earned 10 points for submitting a restaurant review.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: '3',
        notification_type: 'streak_milestone',
        title: '🔥 Review Streak!',
        message: 'You\'ve maintained a 7-day review streak! Keep it up!',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'points_earned':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'streak_milestone':
        return <Flame className="h-5 w-5 text-orange-600" />;
      case 'milestone_reached':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'points_earned':
        return 'border-l-blue-500 bg-blue-50';
      case 'streak_milestone':
        return 'border-l-orange-500 bg-orange-50';
      case 'milestone_reached':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Achievement Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {settings?.notifications_enabled && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start reviewing restaurants to earn achievements!
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-4 border-l-4 rounded-r-lg transition-all duration-200 hover:shadow-md ${
                    getNotificationColor(notification.notification_type)
                  } ${!notification.is_read ? 'ring-1 ring-blue-200' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notifications.length > 5 && !showAll && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
              className="text-sm"
            >
              View {notifications.length - 5} more notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AchievementNotifications;
