import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, Lightbulb, MessageSquare, Star, AlertCircle, Check, Eye } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    if (user?.role === 'student') {
      fetchUnreadCount();

      // Listen for new suggestions
      if (socket) {
        socket.on('new-suggestion', handleNewSuggestion);
        return () => socket.off('new-suggestion', handleNewSuggestion);
      }
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/suggestions/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNewSuggestion = (data) => {
    const { suggestion, notification } = data;

    // Create enhanced notification with full suggestion data
    const enhancedNotification = {
      ...notification,
      suggestion: suggestion, // Store full suggestion data
      isRead: false
    };

    // Add to notifications list
    setNotifications(prev => [enhancedNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Auto-hide floating notification after 5 seconds unless urgent
    if (!notification.isUrgent) {
      setTimeout(() => {
        setNotifications(prev => prev.map(n =>
          n.id === notification.id ? { ...n, showFloating: false } : n
        ));
      }, 5000);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'feedback':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'improvement':
        return <Star className="h-5 w-5 text-purple-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'praise':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority, isUrgent) => {
    if (isUrgent) return 'border-red-500 bg-red-50';
    switch (priority) {
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/suggestions/${notificationId}/read`);

      // Update notification as read
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));

      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const viewNotification = async (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);

    // Mark as read when viewed
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (user?.role !== 'student') {
    return null; // Only show for students
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
        >
          <Bell className="h-6 w-6" />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getPriorityColor(notification.priority, notification.isUrgent)} ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => viewNotification(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              !notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}>
                              {notification.title}
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                              )}
                            </p>
                            <div className="flex items-center space-x-1">
                              {notification.isUrgent && (
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              <Eye className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {notification.teamName} • {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-primary-600 hover:text-primary-800 p-1"
                                  title="Mark as read"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => dismissNotification(notification.id)}
                                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                title="Dismiss"
                              >
                                <X className="h-3 w-3" />
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

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setNotifications([]);
                    setShowNotifications(false);
                  }}
                  className="w-full text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.filter(n => !n.isRead && n.showFloating !== false).slice(0, 3).map((notification) => (
          <div
            key={`floating-${notification.id}`}
            className={`max-w-sm bg-white rounded-lg shadow-lg border-l-4 ${getPriorityColor(notification.priority, notification.isUrgent)} animate-slide-in-right cursor-pointer`}
            onClick={() => viewNotification(notification)}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {notification.teamName}
                    </span>
                    <span className="text-xs text-primary-600 font-medium">
                      Click to view
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(selectedNotification.priority, selectedNotification.isUrgent)}`}>
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    From: {selectedNotification.suggestion?.mentor?.name} • {selectedNotification.teamName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {/* Priority and Type */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedNotification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedNotification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedNotification.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedNotification.priority} priority
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {selectedNotification.type}
                  </span>
                  {selectedNotification.isUrgent && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Urgent
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Message:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedNotification.suggestion?.content || selectedNotification.message}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-500">
                  Received: {formatTime(selectedNotification.createdAt)} on {new Date(selectedNotification.createdAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowNotificationModal(false);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedNotification.suggestion && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/suggestions/${selectedNotification.id}/acknowledge`, {
                            response: 'Acknowledged'
                          });
                          setShowNotificationModal(false);
                          setSelectedNotification(null);
                        } catch (error) {
                          console.error('Failed to acknowledge:', error);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
