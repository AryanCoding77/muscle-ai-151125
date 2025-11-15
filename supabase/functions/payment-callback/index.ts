// Supabase Edge Function: Handle Payment Callback from Razorpay

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const paymentLinkId = url.searchParams.get('razorpay_payment_link_id');
    const paymentId = url.searchParams.get('razorpay_payment_id');
    const status = url.searchParams.get('razorpay_payment_link_status');

    console.log('💳 Payment callback received:', { paymentLinkId, paymentId, status });

    if (!paymentLinkId || status !== 'paid') {
      return new Response(
        generateHTML('Payment Failed', 'Your payment was not successful. Please try again.', false),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Verify payment link status with Razorpay API
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
      }
    );

    if (!razorpayResponse.ok) {
      throw new Error('Failed to verify payment with Razorpay');
    }

    const paymentLink = await razorpayResponse.json();

    if (paymentLink.status !== 'paid') {
      return new Response(
        generateHTML('Payment Pending', 'Your payment is still being processed. Please wait.', false),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find subscription by payment link ID
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('razorpay_subscription_id', paymentLinkId)
      .single();

    if (subError || !subscription) {
      console.error('❌ Subscription not found:', subError);
      return new Response(
        generateHTML('Error', 'Subscription not found. Please contact support.', false),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Update subscription to active
    const now = new Date();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'active',
        current_billing_cycle_start: now.toISOString(),
        current_billing_cycle_end: cycleEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Failed to update subscription:', updateError);
      throw new Error('Failed to activate subscription');
    }

    // Record payment transaction
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        razorpay_payment_id: paymentId,
        razorpay_order_id: paymentLinkId,
        amount_paid_usd: paymentLink.amount / 8300, // Convert paise to USD
        currency: 'INR',
        payment_status: 'captured',
        transaction_date: now.toISOString(),
      });

    console.log('✅ Subscription activated successfully:', subscription.id);

    // Return success page that redirects to app homepage
    return new Response(
      generateHTML(
        'Success',
        'Payment successful! Redirecting to app...',
        true,
        subscription.user_id
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('❌ Callback error:', error);
    return new Response(
      generateHTML('Error', 'An error occurred. Please contact support.', false),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});

function generateHTML(title: string, message: string, success: boolean, userId?: string) {
  // If payment successful, redirect to app homepage
  const redirectScript = success 
    ? `
        // Try to redirect to app homepage
        window.location.href = 'muscleai://payment-success';
        
        // Fallback: If redirect doesn't work after 2 seconds, show message
        setTimeout(function() {
          alert('${message}\\n\\nIf the app doesn\\'t open automatically, please return to the app manually.');
        }, 2000);
      `
    : `
        alert('${message}');
        // Try to go back after 2 seconds
        setTimeout(function() {
          window.close();
        }, 2000);
      `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Status</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          max-width: 400px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${success ? '✅' : '❌'} ${title}</h1>
        <p>${message}</p>
        ${success ? '<div class="spinner"></div>' : ''}
      </div>
      <script>
        ${redirectScript}
      </script>
    </body>
    </html>
  `;
}
