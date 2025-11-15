// Supabase Edge Function: Handle Razorpay Webhooks

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get signature from headers
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      throw new Error('Missing webhook signature');
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;
    const eventData = payload.payload;

    console.log('📨 Webhook event:', event);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different webhook events
    switch (event) {
      case 'payment_link.paid':
        await handlePaymentLinkPaid(supabase, eventData);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(supabase, eventData);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(supabase, eventData);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(supabase, eventData);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(supabase, eventData);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, eventData);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(supabase, eventData);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(supabase, eventData);
        break;

      case 'payment.failed':
        await handlePaymentFailed(supabase, eventData);
        break;

      default:
        console.log('ℹ️ Unhandled webhook event:', event);
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function handleSubscriptionActivated(supabase: any, data: any) {
  const subscription = data.subscription.entity;
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Error activating subscription:', error);
  }
}

async function handleSubscriptionCharged(supabase: any, data: any) {
  const payment = data.payment.entity;
  const subscription = data.subscription.entity;

  // Find subscription
  const { data: subData } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (!subData) {
    console.error('❌ Subscription not found:', subscription.id);
    return;
  }

  // Calculate next billing cycle
  const now = new Date();
  const cycleStart = now;
  const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Update subscription billing cycle and reset usage counter
  await supabase
    .from('user_subscriptions')
    .update({
      current_billing_cycle_start: cycleStart.toISOString(),
      current_billing_cycle_end: cycleEnd.toISOString(),
      analyses_used_this_month: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subData.id);

  // Record payment transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: subData.user_id,
      subscription_id: subData.id,
      razorpay_payment_id: payment.id,
      amount_paid_usd: payment.amount / 100, // Convert from paise/cents
      currency: payment.currency,
      payment_status: 'captured',
      payment_method: payment.method,
      transaction_date: new Date(payment.created_at * 1000).toISOString(),
    });
}

async function handleSubscriptionCompleted(supabase: any, data: any) {
  const subscription = data.subscription.entity;

  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'expired',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  const subscription = data.subscription.entity;

  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renewal_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionPaused(supabase: any, data: any) {
  const subscription = data.subscription.entity;

  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'paused',
      pause_start_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionResumed(supabase: any, data: any) {
  const subscription = data.subscription.entity;

  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'active',
      pause_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handlePaymentFailed(supabase: any, data: any) {
  const payment = data.payment.entity;

  // Find subscription by order_id or subscription_id
  const { data: subData } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', payment.subscription_id)
    .single();

  if (!subData) {
    console.error('❌ Subscription not found for failed payment');
    return;
  }

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subData.id);

  // Record failed payment
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: subData.user_id,
      subscription_id: subData.id,
      razorpay_payment_id: payment.id,
      amount_paid_usd: payment.amount / 100,
      currency: payment.currency,
      payment_status: 'failed',
      error_code: payment.error_code,
      error_description: payment.error_description,
      transaction_date: new Date(payment.created_at * 1000).toISOString(),
    });
}

async function handlePaymentLinkPaid(supabase: any, data: any) {
  const paymentLink = data.payment_link.entity;
  const payment = data.payment.entity;

  console.log('💰 Payment link paid:', { payment_link_id: paymentLink.id, payment_id: payment.id });

  // Find subscription by payment link ID
  const { data: subData } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', paymentLink.id)
    .single();

  if (!subData) {
    console.error('❌ Subscription not found for payment link:', paymentLink.id);
    return;
  }

  // Calculate billing cycle
  const now = new Date();
  const cycleStart = now;
  const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Update subscription to active
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'active',
      current_billing_cycle_start: cycleStart.toISOString(),
      current_billing_cycle_end: cycleEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subData.id);

  // Record payment transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: subData.user_id,
      subscription_id: subData.id,
      razorpay_payment_id: payment.id,
      razorpay_order_id: paymentLink.id,
      amount_paid_usd: payment.amount / 8300, // Convert from paise to USD
      currency: payment.currency,
      payment_status: 'captured',
      payment_method: payment.method,
      transaction_date: new Date(payment.created_at * 1000).toISOString(),
    });

  console.log('✅ Subscription activated:', subData.id);
}

async function handlePaymentCaptured(supabase: any, data: any) {
  const payment = data.payment.entity;

  console.log('💳 Payment captured:', payment.id);

  // Find subscription by payment notes
  if (payment.notes && payment.notes.user_id) {
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', payment.notes.user_id)
      .eq('subscription_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subData) {
      // Update to active
      const now = new Date();
      const cycleStart = now;
      const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'active',
          current_billing_cycle_start: cycleStart.toISOString(),
          current_billing_cycle_end: cycleEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subData.id);

      console.log('✅ Subscription activated via payment.captured:', subData.id);
    }
  }
}
