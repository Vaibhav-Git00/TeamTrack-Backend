import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';

const TeamChat = ({ teamId, teamName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const { 
    isConnected, 
    joinTeam, 
    leaveTeam, 
    sendMessage, 
    sendTyping, 
    onNewMessage, 
    onUserTyping, 
    onMessageError 
  } = useSocket();

  useEffect(() => {
    if (teamId) {
      fetchMessages();
      joinTeam(teamId);
    }

    return () => {
      if (teamId) {
        leaveTeam(teamId);
      }
    };
  }, [teamId]);

  useEffect(() => {
    // Listen for new messages
    const unsubscribeNewMessage = onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    const unsubscribeTyping = onUserTyping(({ userId, userName, isTyping }) => {
      if (userId !== user?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userName);
          } else {
            newSet.delete(userName);
          }
          return newSet;
        });
      }
    });

    // Listen for message errors
    const unsubscribeError = onMessageError((error) => {
      console.error('Message error:', error);
    });

    return () => {
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeTyping) unsubscribeTyping();
      if (unsubscribeError) unsubscribeError();
    };
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/team/${teamId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && isConnected) {
      sendMessage(teamId, newMessage.trim());
      setNewMessage('');
      handleStopTyping();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(teamId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTyping(teamId, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{teamName} Chat</h3>
          <p className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(date)}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.sender._id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender._id === user?.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.sender._id !== user?.id && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.sender.name}
                    </div>
                  )}
                  <div className="text-sm">{message.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender._id === user?.id
                        ? 'text-primary-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onBlur={handleStopTyping}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!isConnected}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;
