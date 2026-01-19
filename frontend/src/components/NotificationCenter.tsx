import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-5 h-5" />;
      case 'requirement_change':
        return <FileText className="w-5 h-5" />;
      case 'task_assignment':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'normal':
        return 'bg-acorn-blue-100 text-acorn-blue-700';
      case 'low':
        return 'bg-acorn-gray-100 text-acorn-gray-700';
      default:
        return 'bg-acorn-gray-100 text-acorn-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-acorn border border-acorn-gray-200 max-w-md">
      {/* Header */}
      <div className="p-4 border-b border-acorn-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-acorn-blue-600" />
            <h3 className="text-lg font-bold text-acorn-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-acorn-orange-500 text-white rounded-full text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkAllAsRead}
              className="text-acorn-blue-600 hover:text-acorn-blue-700"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-acorn-blue-500 text-white'
                : 'bg-acorn-gray-100 text-acorn-gray-700 hover:bg-acorn-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-acorn-blue-500 text-white'
                : 'bg-acorn-gray-100 text-acorn-gray-700 hover:bg-acorn-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-acorn-gray-400 mx-auto mb-4" />
            <p className="text-acorn-gray-600">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-acorn-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-acorn-gray-50 transition-colors ${
                  !notification.read ? 'bg-acorn-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-acorn-gray-900 text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm text-acorn-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-acorn-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="p-1 hover:bg-acorn-gray-200 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-acorn-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => onDismiss(notification.id)}
                          className="p-1 hover:bg-acorn-gray-200 rounded transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4 text-acorn-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
