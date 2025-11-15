// Manage Subscription Screen - View and manage current subscription

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import {
  SubscriptionDetails,
  PaymentTransaction,
  SubscriptionPlan,
} from '../types/subscription';
import {
  getUserSubscriptionDetails,
  getPaymentHistory,
  getUsageHistory,
  cancelSubscription,
  fetchSubscriptionPlans,
} from '../services/subscriptionService';

interface ManageSubscriptionScreenProps {
  navigation: any;
}

export const ManageSubscriptionScreen: React.FC<ManageSubscriptionScreenProps> = ({ navigation }) => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
    
    // Auto-refresh every 10 seconds if subscription is pending
    const interval = setInterval(() => {
      if (subscription?.subscription_status === 'pending') {
        console.log('🔄 Auto-refreshing pending subscription...');
        loadSubscriptionData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [subscription?.subscription_status]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subData, paymentsData, usageData, plansData] = await Promise.all([
        getUserSubscriptionDetails(),
        getPaymentHistory(),
        getUsageHistory(10),
        fetchSubscriptionPlans(),
      ]);

      console.log('📊 Subscription data loaded:', {
        subscription: subData?.plan_name,
        paymentsCount: paymentsData?.length || 0,
        usageCount: usageData?.length || 0,
      });

      setSubscription(subData);
      setPaymentHistory(paymentsData || []);
      setUsageHistory(usageData || []);
      setAvailablePlans(plansData || []);
    } catch (error) {
      console.error('❌ Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptionData();
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setCancelling(true);
      const result = await cancelSubscription(subscription!.subscription_id);

      if (result.success) {
        setShowCancelDialog(false);
        setTimeout(() => Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled successfully.'), 100);
        loadSubscriptionData();
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      setShowCancelDialog(false);
      setTimeout(() => Alert.alert('Error', 'Failed to cancel subscription. Please try again or contact support.'), 100);
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgradeDowngrade = () => {
    navigation.navigate('SubscriptionPlans');
  };

  const getUsagePercentage = () => {
    if (!subscription) return 0;
    return (subscription.analyses_used / subscription.analyses_limit) * 100;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSubscriptionCard = () => {
    if (!subscription) {
      return (
        <View style={styles.noSubscriptionCard}>
          <Text style={styles.noSubscriptionText}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionSubtext}>
            Subscribe to a plan to unlock AI body analysis features
          </Text>
          <TouchableOpacity
            style={styles.subscribeCTA}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.subscribeCTAGradient}
            >
              <Text style={styles.subscribeCTAText}>View Plans</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    const usagePercentage = getUsagePercentage();
    const isLowUsage = usagePercentage > 80;

    return (
      <LinearGradient
        colors={['#D35400', '#E67E22', '#F39C12']}
        style={styles.subscriptionCard}
      >
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionPlan}>{subscription.plan_name} Plan</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: subscription.subscription_status === 'active' ? '#2ECC71' : '#E74C3C' }
          ]}>
            <Text style={styles.statusText}>{subscription.subscription_status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.subscriptionPrice}>${subscription.plan_price}/month</Text>

        <View style={styles.usageContainer}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Usage This Month</Text>
            <Text style={styles.usageNumbers}>
              {subscription.analyses_used} / {subscription.analyses_limit}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${usagePercentage}%` }]} />
          </View>

          {isLowUsage && (
            <Text style={styles.usageWarning}>⚠️ Running low on analyses</Text>
          )}
        </View>

        <View style={styles.cycleInfo}>
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Current Cycle:</Text>
            <Text style={styles.cycleValue}>
              {formatDate(subscription.cycle_start)} - {formatDate(subscription.cycle_end)}
            </Text>
          </View>
          
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Auto-Renewal:</Text>
            <Text style={styles.cycleValue}>
              {subscription.auto_renewal ? '✓ Enabled' : '✗ Disabled'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderActions = () => {
    if (!subscription) return null;

    return (
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Manage Subscription</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleUpgradeDowngrade}
        >
          <Text style={styles.actionButtonIcon}>🔄</Text>
          <Text style={styles.actionButtonText}>Change Plan</Text>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancelSubscription}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#E74C3C" />
          ) : (
            <>
              <Text style={styles.actionButtonIcon}>🚫</Text>
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Subscription</Text>
              <Text style={styles.actionButtonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderPaymentHistory = () => {
    // Only show payment history if user has a subscription
    if (!subscription) return null;

    return (
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Payment History</Text>
        
        {paymentHistory.length === 0 ? (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryText}>No payment history yet</Text>
            <Text style={styles.noHistorySubtext}>
              Your transactions will appear here after payment
            </Text>
          </View>
        ) : (
          <>
            {paymentHistory.slice(0, 5).map((transaction, index) => (
              <View key={transaction.id} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historyItemDate}>
                    {formatDate(transaction.transaction_date)}
                  </Text>
                  <Text style={styles.historyItemStatus}>
                    {transaction.payment_status}
                  </Text>
                </View>
                <Text style={styles.historyItemAmount}>
                  ${transaction.amount_paid_usd.toFixed(2)}
                </Text>
              </View>
            ))}

            {paymentHistory.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Transactions</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading subscription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderSubscriptionCard()}
        {renderActions()}
        {renderPaymentHistory()}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showCancelDialog}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will still have access until the end of your current billing cycle."
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        confirmButtonStyle="destructive"
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelDialog(false)}
        icon={<Icon name="cancel" size={48} color={COLORS.danger} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  noSubscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  noSubscriptionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  noSubscriptionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  subscribeCTA: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  subscribeCTAGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  subscribeCTAText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subscriptionCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subscriptionPlan: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subscriptionPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 25,
  },
  usageContainer: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  usageLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  usageNumbers: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 5,
  },
  usageWarning: {
    fontSize: 12,
    color: '#F39C12',
    marginTop: 8,
    fontWeight: '600',
  },
  cycleInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 15,
  },
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cycleLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cycleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#E74C3C',
  },
  actionButtonArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemDate: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  historyItemStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  historyItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  viewAllButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noHistoryContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noHistoryText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  noHistorySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
  },
});
