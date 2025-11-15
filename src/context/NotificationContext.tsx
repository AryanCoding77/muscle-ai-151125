import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'analysis' | 'workout' | 'achievement' | 'reminder' | 'system';
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'muscle_ai_notifications';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from storage
  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Save notifications to storage
  const saveNotifications = async (notifs: Notification[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
      setNotifications(notifs);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    await saveNotifications(updatedNotifications);
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    await saveNotifications(updatedNotifications);
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    await saveNotifications(updatedNotifications);
  };

  // Delete a specific notification
  const deleteNotification = async (notificationId: string) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
    await saveNotifications(updatedNotifications);
  };

  // Clear all notifications
  const clearAll = async () => {
    await saveNotifications([]);
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
