-- Fix ambiguous column reference in can_user_analyze function
-- Run this in Supabase SQL Editor to update the database functions

-- Drop and recreate the function to fix the ambiguous column reference
CREATE OR REPLACE FUNCTION public.can_user_analyze()
RETURNS TABLE (
  can_analyze BOOLEAN,
  analyses_remaining INTEGER,
  subscription_status TEXT,
  plan_name TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_plan RECORD;
BEGIN
  v_user_id := auth.uid();
  
  -- Get active subscription with table alias to avoid ambiguity
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
    AND us.current_billing_cycle_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'none'::TEXT, 'none'::TEXT;
    RETURN;
  END IF;
  
  -- Get plan details
  SELECT * INTO v_plan
  FROM public.subscription_plans sp
  WHERE sp.id = v_subscription.plan_id;
  
  -- Check if user has remaining analyses
  IF v_subscription.analyses_used_this_month < v_plan.monthly_analyses_limit THEN
    RETURN QUERY SELECT 
      true,
      v_plan.monthly_analyses_limit - v_subscription.analyses_used_this_month,
      v_subscription.subscription_status,
      v_plan.plan_name;
  ELSE
    RETURN QUERY SELECT 
      false,
      0,
      v_subscription.subscription_status,
      v_plan.plan_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix increment_usage_counter function
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_analysis_result_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Get active subscription with table alias
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
    AND us.current_billing_cycle_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription, return error
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active subscription found'
    );
  END IF;
  
  -- Increment counter
  UPDATE public.user_subscriptions
  SET analyses_used_this_month = analyses_used_this_month + 1,
      updated_at = NOW()
  WHERE id = v_subscription.id;
  
  -- Track usage
  INSERT INTO public.usage_tracking (
    user_id,
    subscription_id,
    analysis_type,
    analysis_result_id
  ) VALUES (
    v_user_id,
    v_subscription.id,
    'body_analysis',
    p_analysis_result_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'analyses_used', v_subscription.analyses_used_this_month + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
