// Supabase Edge Function: Cancel Razorpay Subscription

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelSubscriptionRequest {
  subscription_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request body
    const { subscription_id }: CancelSubscriptionRequest = await req.json();

    if (!subscription_id) {
      throw new Error('Missing subscription_id');
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.subscription_status !== 'active') {
      throw new Error('Subscription is not active');
    }

    // Cancel subscription on Razorpay
    if (subscription.razorpay_subscription_id) {
      const cancelResponse = await fetch(
        `https://api.razorpay.com/v1/subscriptions/${subscription.razorpay_subscription_id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
          },
          body: JSON.stringify({
            cancel_at_cycle_end: 1, // Cancel at end of current billing cycle
          }),
        }
      );

      if (!cancelResponse.ok) {
        const error = await cancelResponse.text();
        console.error('❌ Razorpay cancel error:', error);
        throw new Error('Failed to cancel subscription with Razorpay');
      }
    }

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renewal_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription_id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription cancelled successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
