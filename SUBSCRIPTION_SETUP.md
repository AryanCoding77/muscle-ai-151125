# Muscle AI Subscription System - Setup Guide

Complete guide to setting up and deploying the Razorpay subscription system for Muscle AI.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Razorpay Configuration](#razorpay-configuration)
4. [Supabase Edge Functions Setup](#supabase-edge-functions-setup)
5. [React Native Configuration](#react-native-configuration)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **Supabase Account**: [https://supabase.com](https://supabase.com)
- **Razorpay Account**: [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)

### Required Tools
- Node.js >= 18.x
- npm or yarn
- Supabase CLI: `npm install -g supabase`
- React Native development environment (Android Studio / Xcode)

---

## Database Setup

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and execute in the SQL Editor

This will create:
- ✅ `subscription_plans` table with 3 default plans
- ✅ `user_subscriptions` table for tracking user subscriptions
- ✅ `payment_transactions` table for payment history
- ✅ `usage_tracking` table for analysis usage
- ✅ Helper functions for subscription management
- ✅ Row Level Security (RLS) policies

### Step 2: Verify Tables

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%subscription%' OR table_name LIKE '%payment%' OR table_name LIKE '%usage%';
```

You should see:
- subscription_plans
- user_subscriptions
- payment_transactions
- usage_tracking

---

## Razorpay Configuration

### Step 1: Get API Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Generate **Test Mode** keys for development
4. Copy:
   - `Key ID` (starts with `rzp_test_`)
   - `Key Secret` (keep this secure!)

### Step 2: Create Webhook

1. Go to **Settings** → **Webhooks**
2. Create a new webhook with URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/webhook-razorpay
   ```
3. Select these events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.completed`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
   - `payment.failed`
4. Copy the **Webhook Secret** (starts with `whsec_`)

### Step 3: Configure Environment Variables

Update your `.env` file:

```bash
# Razorpay Configuration (Test Mode)
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

⚠️ **Security Note**: Never commit `RAZORPAY_KEY_SECRET` to version control!

---

## Supabase Edge Functions Setup

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Link Your Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 3: Set Environment Secrets

```bash
# Set Razorpay secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# Verify secrets
supabase secrets list
```

### Step 4: Deploy Edge Functions

```bash
# Deploy create-subscription function
supabase functions deploy create-subscription

# Deploy verify-payment function
supabase functions deploy verify-payment

# Deploy cancel-subscription function
supabase functions deploy cancel-subscription

# Deploy webhook handler
supabase functions deploy webhook-razorpay --no-verify-jwt
```

⚠️ **Important**: The webhook function needs `--no-verify-jwt` flag since it's called by Razorpay, not authenticated users.

### Step 5: Verify Deployment

```bash
# List all functions
supabase functions list

# Test a function
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-subscription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "test", "user_id": "test"}'
```

---

## React Native Configuration

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

This installs `react-native-razorpay` package for payment processing.

### Step 2: Configure Android (if targeting Android)

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.razorpay:checkout:1.6.33'
}
```

Add Proguard rules in `android/app/proguard-rules.pro`:

```
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes JavascriptInterface
-keepattributes *Annotation*

-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}

-optimizations !method/inlining/
```

### Step 3: Configure iOS (if targeting iOS)

No additional configuration needed for iOS.

### Step 4: Update Environment Variables

Ensure `.env` has your Razorpay Key ID:

```bash
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

### Step 5: Build and Run

```bash
# For Android
npm run android

# For iOS
npm run ios
```

---

## Testing

### Test Mode Overview

Razorpay provides test mode for development. All test transactions are simulated and **no real money** is charged.

### Test Card Details

Use these test cards for payments:

**Success Scenarios:**
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Failure Scenarios:**
```
Card: 4000 0000 0000 0002 (Card declined)
Card: 4000 0000 0000 0101 (Insufficient funds)
```

### Testing Workflow

1. **Create Subscription**
   - Navigate to Subscription Plans screen
   - Select a plan
   - Complete payment with test card
   - Verify subscription is active

2. **Test Usage Tracking**
   - Perform an analysis
   - Check that counter decrements
   - Verify usage in database

3. **Test Subscription Management**
   - View subscription details
   - Test plan upgrade/downgrade
   - Test cancellation flow

4. **Test Webhooks**
   - Use Razorpay Dashboard → Webhooks → Test Webhook
   - Verify database updates correctly

### Debugging

Enable detailed logging:

```typescript
// In subscriptionService.ts, all operations log to console
console.log('🔍 Debug info:', data);
```

Check Supabase logs:
```bash
supabase functions logs create-subscription
supabase functions logs verify-payment
supabase functions logs webhook-razorpay
```

---

## Production Deployment

### Step 1: Switch to Live Mode

1. In Razorpay Dashboard, switch to **Live Mode**
2. Complete account activation (KYC, bank details)
3. Generate **Live API Keys**

### Step 2: Update Production Secrets

```bash
# Set production secrets in Supabase
supabase secrets set RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_LIVE_SECRET

# Update .env for production build
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
```

### Step 3: Update Webhook URL

Update Razorpay webhook to production URL:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/webhook-razorpay
```

### Step 4: Test in Production

1. Make a real test purchase with a small amount
2. Verify payment processing
3. Check webhook delivery
4. Test subscription lifecycle

### Step 5: Build Production App

```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

---

## Security Checklist

- ✅ Never expose `RAZORPAY_KEY_SECRET` in client code
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for all API calls
- ✅ Enable Row Level Security on all tables
- ✅ Validate all user inputs
- ✅ Log all payment transactions
- ✅ Monitor for suspicious activity
- ✅ Implement rate limiting
- ✅ Regular security audits

---

## Troubleshooting

### Payment Failed

**Symptoms**: Payment doesn't complete or shows error

**Solutions**:
1. Check Razorpay Dashboard → Payments for error details
2. Verify API keys are correct
3. Check network connectivity
4. Review Supabase function logs
5. Ensure user has active subscription limit

### Webhook Not Received

**Symptoms**: Payment succeeds but subscription not activated

**Solutions**:
1. Verify webhook URL is correct
2. Check webhook secret matches
3. Review Razorpay Dashboard → Webhooks → Logs
4. Check Supabase function logs
5. Ensure webhook function deployed with `--no-verify-jwt`

### Subscription Not Showing

**Symptoms**: User can't see their subscription

**Solutions**:
1. Check `user_subscriptions` table in database
2. Verify RLS policies are correct
3. Check user authentication
4. Review API response in network tab
5. Clear app cache and reload

### Edge Function Errors

**Symptoms**: Function returns 500 error

**Solutions**:
1. Check function logs: `supabase functions logs FUNCTION_NAME`
2. Verify environment secrets are set
3. Test locally with `supabase functions serve`
4. Check Razorpay API response
5. Verify database permissions

---

## Support Resources

- **Razorpay Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Razorpay Support**: support@razorpay.com
- **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)

---

## API Reference

### Create Subscription
```typescript
const result = await createSubscription(planId: string)
```

### Verify Payment
```typescript
const result = await verifyPayment(
  paymentId: string,
  subscriptionId: string,
  signature: string
)
```

### Check Usage
```typescript
const result = await canUserAnalyze()
```

### Increment Usage
```typescript
const result = await incrementUsageCounter(analysisId?: string)
```

### Cancel Subscription
```typescript
const result = await cancelSubscription(subscriptionId: string)
```

---

## Maintenance

### Monthly Tasks
- Review payment success rates
- Check for failed webhooks
- Monitor subscription churn
- Update plan pricing if needed

### Quarterly Tasks
- Audit security settings
- Review error logs
- Update dependencies
- Performance optimization

---

**Last Updated**: 2025-10-01
**Version**: 1.0.0
