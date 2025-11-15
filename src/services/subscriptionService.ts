// Subscription service for handling all subscription-related operations

import { supabase } from '../lib/supabase';
import {
  SubscriptionPlan,
  UserSubscription,
  PaymentTransaction,
  SubscriptionDetails,
  CanAnalyzeResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '../types/subscription';

/**
 * Fetch all available subscription plans
 */
export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('plan_price_usd', { ascending: true });

    if (error) {
      console.error('❌ Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception in fetchSubscriptionPlans:', error);
    throw error;
  }
};

/**
 * Get user's current subscription details
 */
export const getUserSubscriptionDetails = async (): Promise<SubscriptionDetails | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_subscription_details');

    if (error) {
      console.error('❌ Error fetching user subscription details:', error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('❌ Exception in getUserSubscriptionDetails:', error);
    throw error;
  }
};

/**
 * Check if user can perform analysis
 */
export const canUserAnalyze = async (): Promise<CanAnalyzeResponse> => {
  try {
    const { data, error } = await supabase.rpc('can_user_analyze');

    if (error) {
      console.error('❌ Error checking if user can analyze:', error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      can_analyze: false,
      analyses_remaining: 0,
      subscription_status: 'none',
      plan_name: 'none',
    };
  } catch (error) {
    console.error('❌ Exception in canUserAnalyze:', error);
    throw error;
  }
};

/**
 * Increment usage counter after analysis
 */
export const incrementUsageCounter = async (analysisResultId?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('increment_usage_counter', {
      p_analysis_result_id: analysisResultId || null,
    });

    if (error) {
      console.error('❌ Error incrementing usage counter:', error);
      throw error;
    }

    return data || { success: false, error: 'Unknown error' };
  } catch (error) {
    console.error('❌ Exception in incrementUsageCounter:', error);
    throw error;
  }
};

/**
 * Get user's payment transaction history
 */
export const getPaymentHistory = async (): Promise<PaymentTransaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ No authenticated user for payment history');
      return [];
    }

    console.log('🔍 Fetching payment history for user:', user.id);

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching payment history:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} payment transactions for user`);
    return data || [];
  } catch (error) {
    console.error('❌ Exception in getPaymentHistory:', error);
    return [];
  }
};

/**
 * Get user's usage history
 */
export const getUsageHistory = async (limit: number = 30): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('analysis_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching usage history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception in getUsageHistory:', error);
    throw error;
  }
};

/**
 * Create a new subscription (to be called from Edge Function)
 */
export const createSubscription = async (planId: string): Promise<CreateSubscriptionResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call Edge Function to create Razorpay subscription
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: {
        plan_id: planId,
        user_id: user.id,
      },
    });

    console.log('📦 Edge Function Response:', { data, error });

    if (error) {
      console.error('❌ Edge Function Error:', error);
      throw new Error(error.message || 'Edge Function failed');
    }

    if (!data) {
      throw new Error('No data returned from Edge Function');
    }

    console.log('✅ Subscription created:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception in createSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    };
  }
};

/**
 * Verify payment after Razorpay checkout
 */
export const verifyPayment = async (
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call Edge Function to verify payment
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        razorpay_payment_id: razorpayPaymentId,
        razorpay_subscription_id: razorpaySubscriptionId,
        razorpay_signature: razorpaySignature,
        user_id: user.id,
      },
    });

    if (error) {
      console.error('❌ Error verifying payment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Exception in verifyPayment:', error);
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment',
    };
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call Edge Function to cancel subscription
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscription_id: subscriptionId,
      },
    });

    if (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }

    return data || { success: false, error: 'Unknown error' };
  } catch (error) {
    console.error('❌ Exception in cancelSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
};

/**
 * Resume/Reactivate cancelled subscription
 */
export const resumeSubscription = async (subscriptionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call Edge Function to resume subscription
    const { data, error } = await supabase.functions.invoke('resume-subscription', {
      body: {
        subscription_id: subscriptionId,
      },
    });

    if (error) {
      console.error('❌ Error resuming subscription:', error);
      throw error;
    }

    return data || { success: false, error: 'Unknown error' };
  } catch (error) {
    console.error('❌ Exception in resumeSubscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume subscription',
    };
  }
};

/**
 * Update subscription plan (upgrade/downgrade)
 */
export const updateSubscriptionPlan = async (
  subscriptionId: string,
  newPlanId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call Edge Function to update subscription plan
    const { data, error } = await supabase.functions.invoke('update-subscription-plan', {
      body: {
        subscription_id: subscriptionId,
        new_plan_id: newPlanId,
      },
    });

    if (error) {
      console.error('❌ Error updating subscription plan:', error);
      throw error;
    }

    return data || { success: false, error: 'Unknown error' };
  } catch (error) {
    console.error('❌ Exception in updateSubscriptionPlan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
};
