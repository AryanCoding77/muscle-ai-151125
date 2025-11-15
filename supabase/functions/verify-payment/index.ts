// Supabase Edge Function: Verify Razorpay Payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      user_id,
    }: VerifyPaymentRequest = await req.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !user_id) {
      throw new Error('Missing required fields');
    }

    // Verify signature
    const generatedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      throw new Error('Invalid payment signature');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get subscription record
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('razorpay_subscription_id', razorpay_subscription_id)
      .eq('user_id', user_id)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription status to active
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Record payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        subscription_id: subscription.id,
        razorpay_payment_id,
        razorpay_order_id: razorpay_subscription_id,
        razorpay_signature,
        amount_paid_usd: subscription.subscription_plans.plan_price_usd,
        currency: 'USD',
        payment_status: 'captured',
        payment_method: 'razorpay',
        transaction_date: new Date().toISOString(),
      });

    if (transactionError) {
      console.error('❌ Error recording transaction:', transactionError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        subscription: {
          id: subscription.id,
          plan_name: subscription.subscription_plans.plan_name,
          status: 'active',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
