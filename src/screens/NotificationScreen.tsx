import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../config/constants';
import { useNotifications } from '../context/NotificationContext';

export const NotificationScreen = ({ navigation }: any) => {
  const { notifications, unreadCount, addNotification, markAsRead, deleteNotification } = useNotifications();

  // Add sample notifications on first load
  useEffect(() => {
    const addSampleNotifications = async () => {
      if (notifications.length === 0) {
        await addNotification({
          title: 'Welcome to Muscle AI! 💪',
          message: 'Start analyzing your muscle development and track your progress.',
          type: 'system',
        });
        
        await addNotification({
          title: 'Tip: Get Better Results 📸',
          message: 'For accurate analysis, ensure good lighting and clear muscle visibility in your photos.',
          type: 'reminder',
        });

        await addNotification({
          title: 'Track Your Progress 📊',
          message: 'Regular analysis helps you see improvements over time. Analyze weekly for best results!',
          type: 'workout',
        });
      }
    };
    
    addSampleNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'analysis': return 'analytics';
      case 'workout': return 'fitness';
      case 'achievement': return 'trophy';
      case 'reminder': return 'notifications';
      case 'system': return 'information-circle';
      default: return 'notifications-outline';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationPress = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notification List or Empty State */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['rgba(94, 92, 230, 0.1)', 'rgba(94, 92, 230, 0.05)']}
                style={styles.gradientCircle}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="notifications-off-outline" size={64} color="#5E5CE6" />
                </View>
              </LinearGradient>
            </View>
            
            <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any notifications right now.
            </Text>
            <Text style={styles.emptyDescription}>
              We'll notify you about your workout progress, analysis updates, and important reminders.
            </Text>

            {/* Info Cards */}
            <View style={styles.infoCardsContainer}>
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="fitness" size={24} color="#5E5CE6" />
                </View>
                <Text style={styles.infoCardTitle}>Workout Updates</Text>
                <Text style={styles.infoCardText}>Get notified about your daily progress</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="analytics" size={24} color="#5E5CE6" />
                </View>
                <Text style={styles.infoCardTitle}>Analysis Results</Text>
                <Text style={styles.infoCardText}>Receive insights from your analyses</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread
                ]}
                onPress={() => handleNotificationPress(notification.id)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIconContainer}>
                  <View style={[
                    styles.notificationIconWrapper,
                    !notification.read && styles.notificationIconWrapperUnread
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={24} 
                      color={!notification.read ? '#5E5CE6' : COLORS.textSecondary} 
                    />
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.notificationContent}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.read && styles.notificationTitleUnread
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTimestamp(notification.timestamp)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={async (e) => {
                    e.stopPropagation();
                    await deleteNotification(notification.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  gradientCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5E5CE6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(94, 92, 230, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoCardText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationItemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#5E5CE6',
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  notificationIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconWrapperUnread: {
    backgroundColor: 'rgba(94, 92, 230, 0.15)',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5E5CE6',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
});
