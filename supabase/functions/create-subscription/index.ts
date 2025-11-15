// Supabase Edge Function: Create Razorpay Subscription

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

interface CreateSubscriptionRequest {
  plan_id: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { plan_id, user_id }: CreateSubscriptionRequest = await req.json();

    if (!plan_id || !user_id) {
      throw new Error('Missing required fields: plan_id and user_id');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid plan ID');
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);

    if (userError || !user) {
      throw new Error('Invalid user ID');
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('subscription_status', 'active')
      .single();

    if (existingSubscription) {
      // Cancel existing active subscription to allow plan change
      console.log('🔄 Cancelling existing subscription to allow plan change');
      
      const { error: cancelError } = await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'cancelled',
          auto_renewal_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (cancelError) {
        console.error('❌ Error cancelling existing subscription:', cancelError);
        throw new Error('Failed to cancel existing subscription');
      }
      
      console.log('✅ Existing subscription cancelled successfully');
    }

    // Create or get Razorpay customer
    let razorpayCustomerId = null;
    
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('user_subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user_id)
      .not('razorpay_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingCustomer?.razorpay_customer_id) {
      razorpayCustomerId = existingCustomer.razorpay_customer_id;
    } else {
      // Try to create new Razorpay customer
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          contact: user.user_metadata?.phone || '',
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        
        // If customer already exists, fetch existing customer by email
        if (errorData.error?.description?.includes('already exists')) {
          console.log('Customer already exists, fetching existing customer...');
          
          // Fetch existing customer by email
          const fetchResponse = await fetch(`https://api.razorpay.com/v1/customers?email=${user.email}`, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
            },
          });

          if (fetchResponse.ok) {
            const customers = await fetchResponse.json();
            if (customers.items && customers.items.length > 0) {
              razorpayCustomerId = customers.items[0].id;
              console.log('✅ Using existing customer:', razorpayCustomerId);
            } else {
              throw new Error('Customer exists but could not be fetched');
            }
          } else {
            throw new Error('Failed to fetch existing customer');
          }
        } else {
          throw new Error(`Failed to create Razorpay customer: ${JSON.stringify(errorData)}`);
        }
      } else {
        const customer = await customerResponse.json();
        razorpayCustomerId = customer.id;
      }
    }

    // Convert USD to INR (approximate rate: 1 USD = 83 INR)
    const amountInINR = Math.round(plan.plan_price_usd * 83);

    // Create payment link (simpler than subscription with plans)
    const paymentLinkResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountInINR * 100, // Amount in paise
        currency: 'INR',
        description: `${plan.plan_name} Plan - ${plan.monthly_analyses_limit} analyses/month`,
        customer: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          contact: user.user_metadata?.phone || '+919876543210',
        },
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        notes: {
          user_id,
          plan_id,
          plan_name: plan.plan_name,
          app: 'Muscle AI',
        },
        callback_url: `${SUPABASE_URL}/functions/v1/payment-callback`,
        callback_method: 'get',
      }),
    });

    if (!paymentLinkResponse.ok) {
      const error = await paymentLinkResponse.text();
      throw new Error(`Failed to create payment link: ${error}`);
    }

    const paymentLink = await paymentLinkResponse.json();

    // Calculate billing cycle dates
    const now = new Date();
    const cycleStart = now;
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create subscription record in database (pending until payment)
    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id,
        subscription_status: 'pending',
        razorpay_subscription_id: paymentLink.id,
        razorpay_customer_id: razorpayCustomerId,
        current_billing_cycle_start: cycleStart.toISOString(),
        current_billing_cycle_end: cycleEnd.toISOString(),
        analyses_used_this_month: 0,
        auto_renewal_enabled: true,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create subscription record: ${insertError.message}`);
    }

    console.log('✅ Payment link created successfully:', {
      subscription_id: newSubscription.id,
      payment_link_id: paymentLink.id,
      short_url: paymentLink.short_url,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: newSubscription.id,
        payment_link_id: paymentLink.id,
        short_url: paymentLink.short_url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
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
