import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../config/constants';
import { Card } from '../components/ui/Card';
import { StatBadge } from '../components/dashboard/StatBadge';
import { RingStat } from '../components/dashboard/RingStat';
import { Chip } from '../components/ui/Chip';
import { ResponsiveHeader } from '../components/ui/ResponsiveHeader';
import { useAuth } from '../context/AuthContext';
import { getUserSubscriptionDetails } from '../services/subscriptionService';
import { getAnalysisStatsForDate, DailyAnalysisStats } from '../services/analysisStatsService';
import { StreakCounter } from '../components/dashboard/StreakCounter';

const { width } = Dimensions.get('window');
const DAYS = ['S','M','T','W','T','F','S'] as const;

export const HomeScreen = ({ navigation }: any) => {
  const isSmall = width < 380;
  const ringSize = isSmall ? 90 : 110;
  const { user, profile } = useAuth();

  // Get display name from user data - only first word
  const fullName = profile?.username || profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayName = fullName.split(' ')[0];

  // Get current date info
  const now = new Date();
  const currentDate = now.getDate();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentMonth = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();

  // Track selected date
  const [selectedDate, setSelectedDate] = useState<number>(currentDate);
  
  // Track analysis stats
  const [analysisStats, setAnalysisStats] = useState<DailyAnalysisStats>({
    analysesCount: 0,
    averageScore: 0,
    bestScore: 0,
    previousDayScore: 0,
    improvement: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Generate dates for current week (7 days centered around today)
  const weekDates = useMemo(() => {
    const dates = [];
    const startOffset = 3; // Show 3 days before today
    for (let i = -startOffset; i <= 3; i++) {
      const date = new Date(now);
      date.setDate(currentDate + i);
      dates.push(date.getDate());
    }
    return dates;
  }, [currentDate]);

  const navigateToAnalyze = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check subscription status before navigating
    try {
      const subscription = await getUserSubscriptionDetails();
      if (subscription?.subscription_status === 'active') {
        navigation.navigate('Analyze');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '🔒 Premium Feature',
          'You need an active subscription to analyze images. Please purchase a plan to continue.',
          [
            {
              text: 'View Plans',
              onPress: () => navigation.navigate('SubscriptionPlans'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      navigation.navigate('Analyze'); // Navigate anyway if there's an error
    }
  }, [navigation]);

  const onSettingsPress = useCallback(() => {
    const root = navigation.getParent?.()?.getParent?.();
    if (root?.navigate) root.navigate('Settings');
    else if (navigation.navigate) navigation.navigate('Settings');
  }, [navigation]);

  const onNotificationPress = useCallback(() => {
    const root = navigation.getParent?.()?.getParent?.();
    if (root?.navigate) root.navigate('Notifications');
    else if (navigation.navigate) navigation.navigate('Notifications');
  }, [navigation]);

  const onProfilePress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleDatePress = useCallback(async (date: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    console.log('Date pressed:', date);
  }, []);

  // Fetch analysis stats when selected date changes
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const selectedDateObj = new Date(now.getFullYear(), now.getMonth(), selectedDate);
      const stats = await getAnalysisStatsForDate(selectedDateObj);
      setAnalysisStats(stats);
      setLoadingStats(false);
    };

    fetchStats();
  }, [selectedDate]);

  const colStyle = useMemo(() => [styles.col, isSmall ? styles.fullWidth : undefined], [isSmall]);

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveHeader
        userName={displayName}
        userAvatar={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
        subtitle="Get ready"
        onSettingsPress={onSettingsPress}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dashboard (decorative stats to enhance design) */}
        <View style={styles.dashboardSection}>
          {/* Calendar */}
          <Card style={styles.fullCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.cardTitle}>{currentMonth} {currentYear}</Text>
              <View style={styles.calendarArrows}>
                <Text style={styles.arrow}>←</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
            <View style={styles.calendarDaysRow}>
              {DAYS.map((d, index) => (
                <Text key={`day-${index}`} style={styles.calendarDayLabel}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarDatesRow}>
              {weekDates.map((d, index) => (
                <TouchableOpacity
                  key={`${d}-${index}`}
                  style={[styles.calendarDateWrap, d === selectedDate && styles.calendarSelected]}
                  onPress={() => handleDatePress(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.calendarDateText, d === selectedDate && styles.calendarSelectedText]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Daily Analysis Stats */}
          <View style={[styles.row, isSmall && styles.wrap]}>
            <StatBadge 
              label="Analyses Done" 
              value={loadingStats ? "..." : analysisStats.analysesCount.toString()} 
              unit="total" 
              icon="📊" 
              style={colStyle} 
            />
            <StatBadge 
              label="Average Score" 
              value={loadingStats ? "..." : analysisStats.averageScore.toString()} 
              unit="%" 
              icon="📈" 
              style={colStyle} 
            />
          </View>

          <View style={[styles.row, isSmall && styles.wrap]}>
            <StatBadge 
              label="Best Score" 
              value={loadingStats ? "..." : analysisStats.bestScore.toString()} 
              unit="%" 
              icon="🏆" 
              style={colStyle} 
            />
            <StatBadge 
              label="Previous Day" 
              value={loadingStats ? "..." : analysisStats.previousDayScore.toString()} 
              unit="%" 
              icon="📅" 
              style={colStyle} 
            />
          </View>

          <View style={[styles.row, isSmall && styles.wrap]}>
            <StatBadge 
              label="Improvement" 
              value={loadingStats ? "..." : (analysisStats.improvement > 0 ? "+" : "") + analysisStats.improvement.toString()} 
              unit="%" 
              icon="🚀" 
              style={colStyle} 
            />
            <StreakCounter 
              style={colStyle}
              onPress={() => {
                // TODO: Navigate to streak details or achievements screen
                console.log('Streak counter pressed');
              }}
            />
          </View>

        </View>

        {/* Quick Action */}
        <Card style={styles.quickActionCard}>
          <Text style={styles.quickActionTitle}>Ready to Analyze?</Text>
          <Text style={styles.quickActionSubtitle}>
            Take a photo and get AI-powered muscle analysis
          </Text>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={navigateToAnalyze}
          >
            <Text style={styles.analyzeButtonText}>🔍 Start Analysis</Text>
          </TouchableOpacity>
        </Card>

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
    padding: 20,
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  galleryButton: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  previewImage: {
    width: width * 0.6,
    height: width * 0.8,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  dashboardSection: {
    gap: 14,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  col: {
    flex: 1,
  },
  fullCard: {
    padding: 16,
  },
  ringsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
    paddingVertical: 8,
  },
  ringItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: 100,
    marginBottom: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
  },
  calendarCard: {
    padding: 16,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  half: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrow: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  calendarDayLabel: {
    color: COLORS.textSecondary,
    width: 36,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calendarDateWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarSelected: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  calendarDateText: {
    color: COLORS.text,
    fontSize: 14,
  },
  calendarSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coachRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  coachName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  coachSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  coachBio: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 12,
  },
  step: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  utilitySection: {
    gap: 12,
  },
  utilityButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  utilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: width * 0.8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  retryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  quickActionSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
  },
  coachInfo: {
    flex: 1,
  },
});

