import { useState, useEffect } from 'react';
import { Bell, Star, Building2, MessageSquare, Eye, X } from 'lucide-react';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { 
    notifications, 
    unreadCount, 
    markNotificationsRead, 
    refreshNotifications 
  } = useRestaurantOwner();

  const [displayedNotifications, setDisplayedNotifications] = useState(notifications.slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    setDisplayedNotifications(notifications.slice(0, 10));
  }, [notifications]);

  const handleMarkAsRead = async (notificationIds: string[]) => {
    await markNotificationsRead(notificationIds);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.is_read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await markNotificationsRead(unreadIds);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mark All as Read */}
      {unreadCount > 0 && (
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {displayedNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayedNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {notification.response?.restaurant_owner?.business_name || 'Restaurant Owner'}
                      </span>
                      <span className="text-xs text-gray-500">responded</span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      Responded to your review of {notification.rating?.menu_item?.restaurant?.name}
                    </p>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="flex">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < (notification.rating?.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        {notification.rating?.rating}/10
                      </span>
                    </div>

                    {notification.response?.response_text && (
                      <div className="bg-gray-50 rounded p-2 mb-2">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          "{notification.response.response_text}"
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead([notification.id])}
                          className="text-xs text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No notifications yet</p>
            <p className="text-gray-500 text-xs mt-1">
              You'll be notified when restaurant owners respond to your reviews
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="border-t border-gray-200 p-3 text-center">
          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
