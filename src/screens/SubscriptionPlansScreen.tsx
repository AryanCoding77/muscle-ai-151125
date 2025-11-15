// Subscription Plans Screen - Display and select subscription plans

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { SubscriptionPlan, SubscriptionDetails } from '../types/subscription';
import { fetchSubscriptionPlans, getUserSubscriptionDetails } from '../services/subscriptionService';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

const { width } = Dimensions.get('window');

interface SubscriptionPlansScreenProps {
  navigation: any;
}

export const SubscriptionPlansScreen: React.FC<SubscriptionPlansScreenProps> = ({ navigation }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCurrentPlanDialog, setShowCurrentPlanDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [planToChange, setPlanToChange] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadPlansAndSubscription();
  }, []);

  const loadPlansAndSubscription = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        fetchSubscriptionPlans(),
        getUserSubscriptionDetails(),
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      
      // Pre-select current plan if exists (for pending/active subscriptions)
      if (subscriptionData) {
        const currentPlan = plansData.find(p => p.plan_name === subscriptionData.plan_name);
        if (currentPlan) {
          setSelectedPlan(currentPlan.id);
        }
      }
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (currentSubscription && currentSubscription.subscription_status === 'active') {
      if (currentSubscription.plan_name === plan.plan_name) {
        setShowCurrentPlanDialog(true);
        return;
      }
      
      // User wants to change plan
      setPlanToChange(plan);
      setShowChangePlanDialog(true);
      return;
    }
    
    setSelectedPlan(plan.id);
    navigation.navigate('Payment', { plan });
  };

  const handleChangePlanConfirm = () => {
    if (planToChange) {
      setSelectedPlan(planToChange.id);
      navigation.navigate('Payment', { plan: planToChange, isUpgrade: true });
      setShowChangePlanDialog(false);
      setPlanToChange(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return '🥉';
      case 'pro':
        return '🥈';
      case 'vip':
        return '🥇';
      default:
        return '💎';
    }
  };

  const getPlanColor = (planName: string): [string, string] => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return ['#4A90E2', '#357ABD'];
      case 'pro':
        return ['#9B59B6', '#8E44AD'];
      case 'vip':
        return ['#F39C12', '#E67E22'];
      default:
        return [COLORS.primary, COLORS.primaryDark];
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentSubscription?.plan_name === plan.plan_name;
    const colors = getPlanColor(plan.plan_name);
    
    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handleSelectPlan(plan)}
        activeOpacity={0.9}
        style={styles.planCardWrapper}
      >
        <LinearGradient
          colors={isCurrentPlan ? ['#2ECC71', '#27AE60'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}
        >
          {isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
            </View>
          )}
          
          <View style={styles.planHeader}>
            <Text style={styles.planIcon}>{getPlanIcon(plan.plan_name)}</Text>
            <Text style={styles.planName}>{plan.plan_name}</Text>
          </View>
          
          <Text style={styles.planPrice}>
            ${plan.plan_price_usd}
            <Text style={styles.planPriceUnit}>/month</Text>
          </Text>
          
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.limitBadge}>
            <Text style={styles.limitText}>{plan.monthly_analyses_limit} analyses/month</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.selectButton,
              isCurrentPlan && styles.currentButton,
            ]}
            onPress={() => handleSelectPlan(plan)}
          >
            <Text style={styles.selectButtonText}>
              {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
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
        <Text style={styles.headerTitle}>
          {currentSubscription?.subscription_status === 'active' ? 'Change Your Plan' : 'Choose Your Plan'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {currentSubscription && currentSubscription.subscription_status === 'active' && (
        <View style={styles.currentStatusContainer}>
          <LinearGradient
            colors={['rgba(46, 204, 113, 0.2)', 'rgba(39, 174, 96, 0.2)']}
            style={styles.currentStatus}
          >
            <Text style={styles.currentStatusTitle}>Your Current Plan</Text>
            <Text style={styles.currentStatusPlan}>{currentSubscription.plan_name}</Text>
            <Text style={styles.currentStatusUsage}>
              {currentSubscription.analyses_remaining} of {currentSubscription.analyses_limit} analyses remaining
            </Text>
          </LinearGradient>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {currentSubscription?.subscription_status === 'active' 
            ? 'Upgrade or downgrade your current plan' 
            : 'Select the perfect plan for your fitness journey'}
        </Text>
        
        {plans.map((plan) => renderPlanCard(plan))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • All plans include AI-powered body analysis
          </Text>
          <Text style={styles.footerText}>
            • Cancel anytime, no long-term commitment
          </Text>
          <Text style={styles.footerText}>
            • Secure payment via Razorpay
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={showCurrentPlanDialog}
        title="Current Plan"
        message="You are already subscribed to this plan."
        confirmText="OK"
        cancelText=""
        confirmButtonStyle="primary"
        onConfirm={() => setShowCurrentPlanDialog(false)}
        onCancel={() => setShowCurrentPlanDialog(false)}
        icon={<Icon name="check-circle" size={48} color={COLORS.success} />}
      />

      <ConfirmationDialog
        visible={showChangePlanDialog}
        title="Change Plan"
        message={planToChange ? `Switch from ${currentSubscription?.plan_name} to ${planToChange.plan_name}?` : ''}
        confirmText="Continue"
        cancelText="Cancel"
        confirmButtonStyle="primary"
        onConfirm={handleChangePlanConfirm}
        onCancel={() => {
          setShowChangePlanDialog(false);
          setPlanToChange(null);
        }}
        icon={<Icon name="swap-horizontal" size={48} color={COLORS.primary} />}
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
  currentStatusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  currentStatus: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentStatusTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  currentStatusPlan: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  currentStatusUsage: {
    fontSize: 14,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  planCardWrapper: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 20,
    padding: 25,
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  currentPlanCard: {
    borderWidth: 3,
    borderColor: '#2ECC71',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#2ECC71',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    elevation: 3,
  },
  currentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  planIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  planName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planPrice: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  planPriceUnit: {
    fontSize: 18,
    fontWeight: 'normal',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 18,
    color: '#FFF',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
    flex: 1,
  },
  limitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  limitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
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
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
});
