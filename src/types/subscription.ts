// Type definitions for subscription system

export interface SubscriptionPlan {
  id: string;
  plan_name: 'Basic' | 'Pro' | 'VIP';
  plan_price_usd: number;
  monthly_analyses_limit: number;
  razorpay_plan_id?: string;
  description?: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused';
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  current_billing_cycle_start?: string;
  current_billing_cycle_end?: string;
  analyses_used_this_month: number;
  subscription_start_date: string;
  subscription_end_date?: string;
  auto_renewal_enabled: boolean;
  cancelled_at?: string;
  pause_start_date?: string;
  pause_end_date?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount_paid_usd: number;
  currency: string;
  payment_status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  payment_method?: string;
  error_code?: string;
  error_description?: string;
  transaction_date: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  subscription_id?: string;
  analysis_date: string;
  analysis_type: string;
  analysis_result_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SubscriptionDetails {
  subscription_id: string;
  plan_name: string;
  plan_price: number;
  subscription_status: string;
  analyses_used: number;
  analyses_limit: number;
  analyses_remaining: number;
  cycle_start?: string;
  cycle_end?: string;
  auto_renewal: boolean;
  razorpay_subscription_id?: string;
}

export interface CanAnalyzeResponse {
  can_analyze: boolean;
  analyses_remaining: number;
  subscription_status: string;
  plan_name: string;
}

export interface RazorpayOptions {
  key: string;
  subscription_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  user_id: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription_id?: string;
  payment_link_id?: string;
  short_url?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  user_id: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified: boolean;
  subscription?: UserSubscription;
  error?: string;
}
