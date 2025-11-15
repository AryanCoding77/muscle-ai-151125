# 💎 Muscle AI Subscription System

Complete Razorpay-powered subscription system for Muscle AI fitness app with secure payment processing, usage tracking, and subscription management.

## 🎯 Features Implemented

### ✅ Frontend Components
- **SubscriptionPlansScreen**: Beautiful plan comparison with 3 tiers (Basic/Pro/VIP)
- **PaymentScreen**: Secure Razorpay checkout integration
- **ManageSubscriptionScreen**: Full subscription management dashboard

### ✅ Backend Infrastructure
- **Supabase Database**: Complete schema with RLS policies
- **Edge Functions**: 4 serverless functions for payment processing
- **Webhook Handler**: Automatic subscription lifecycle management

### ✅ Security Features
- Payment signature verification
- Row Level Security (RLS) on all tables
- Encrypted API keys
- Webhook signature validation
- Input sanitization

### ✅ Subscription Plans

| Plan | Price | Analyses/Month | Features |
|------|-------|----------------|----------|
| **Basic** | $4 | 5 | Perfect for beginners |
| **Pro** | $7 | 20 | For fitness enthusiasts |
| **VIP** | $14 | 50 | Ultimate for athletes |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `react-native-razorpay` - Payment gateway SDK
- All existing dependencies

### 2. Configure Environment

Update `.env` with your Razorpay credentials:

```bash
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

### 3. Setup Database

1. Open Supabase SQL Editor
2. Run `supabase-schema.sql`
3. Verify tables created

### 4. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Set secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXX
supabase secrets set RAZORPAY_KEY_SECRET=your_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_XXX

# Deploy functions
supabase functions deploy create-subscription
supabase functions deploy verify-payment
supabase functions deploy cancel-subscription
supabase functions deploy webhook-razorpay --no-verify-jwt
```

### 5. Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/webhook-razorpay
   ```
3. Select events:
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
   - payment.failed

### 6. Run the App

```bash
npm start
```

## 📱 User Flow

```
1. User opens app → Login/Register
2. Navigate to Profile → "View Plans"
3. Select plan (Basic/Pro/VIP)
4. Click "Choose Plan"
5. Review payment details
6. Click "Pay" → Razorpay checkout opens
7. Enter card details (use test card)
8. Payment processes
9. Subscription activated ✅
10. User can now perform analyses
```

## 🧪 Testing

### Test Cards

**Success**:
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

**Failure**:
```
Card: 4000 0000 0000 0002 (Declined)
Card: 4000 0000 0000 9995 (Insufficient funds)
```

### Test Flow

```bash
# 1. Subscribe to Basic plan
# 2. Perform 5 analyses (use up limit)
# 3. Try 6th analysis (should show limit reached)
# 4. Upgrade to Pro plan
# 5. Perform more analyses
# 6. Cancel subscription
```

## 📊 Database Schema

### Core Tables

**subscription_plans**
- Stores 3 plan definitions
- Pre-populated with Basic/Pro/VIP

**user_subscriptions**
- Tracks active subscriptions
- Includes usage counter
- Links to Razorpay subscription ID

**payment_transactions**
- Records all payment attempts
- Success and failure tracking
- Full audit trail

**usage_tracking**
- Tracks each analysis performed
- Links to subscription and result
- Enables usage analytics

## 🔧 API Endpoints

### Client-Side Service Methods

```typescript
// Fetch available plans
const plans = await fetchSubscriptionPlans();

// Get current subscription
const sub = await getUserSubscriptionDetails();

// Check if user can analyze
const { can_analyze, analyses_remaining } = await canUserAnalyze();

// Create subscription
const result = await createSubscription(planId);

// Verify payment
const verified = await verifyPayment(paymentId, subId, signature);

// Cancel subscription
await cancelSubscription(subscriptionId);
```

### Edge Functions

**create-subscription**
- Creates Razorpay subscription
- Stores in database
- Returns subscription ID for payment

**verify-payment**
- Verifies payment signature
- Activates subscription
- Records transaction

**cancel-subscription**
- Cancels Razorpay subscription
- Updates database status
- Maintains access until cycle end

**webhook-razorpay**
- Handles all subscription events
- Updates database automatically
- Resets usage counters on renewal

## 🛡️ Security Implementation

### Payment Security
- ✅ Never store card details
- ✅ All payments via Razorpay PCI-DSS compliant gateway
- ✅ HTTPS only
- ✅ Signature verification on all callbacks

### Database Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access own data
- ✅ Service role for backend operations
- ✅ Prepared statements prevent SQL injection

### API Security
- ✅ JWT authentication required
- ✅ Rate limiting via Supabase
- ✅ Input validation
- ✅ Error handling doesn't leak sensitive info

## 📈 Usage Tracking

The system automatically tracks:
- Analyses performed
- Usage vs limit
- Historical usage patterns
- Plan utilization rates

**Usage Flow**:
```typescript
// Before analysis
const { can_analyze } = await canUserAnalyze();
if (!can_analyze) {
  showUpgradePrompt();
  return;
}

// Perform analysis
const result = await analyzeImage(image);

// Increment counter
await incrementUsageCounter(result.id);
```

## 🔄 Subscription Lifecycle

### Monthly Renewal
1. Razorpay auto-charges card
2. Webhook `subscription.charged` received
3. Edge function resets usage counter
4. User notified of renewal

### Cancellation
1. User clicks "Cancel"
2. API calls Razorpay to cancel
3. Status updated to "cancelled"
4. Access continues until cycle end
5. No future charges

### Upgrade/Downgrade
1. User selects new plan
2. Old subscription cancelled
3. New subscription created
4. Pro-rated billing applied
5. Usage counter adjusted

## 🐛 Troubleshooting

### Payment doesn't complete
- Check Razorpay API keys in `.env`
- Verify Edge Functions deployed
- Check browser console for errors
- Review Razorpay Dashboard → Payments

### Subscription not showing
- Check database: `user_subscriptions` table
- Verify RLS policies
- Check user authentication token
- Review API network calls

### Usage counter not updating
- Check `increment_usage_counter` called
- Verify `usage_tracking` table
- Check Edge Function logs
- Ensure subscription is active

### Webhook not working
- Verify webhook URL in Razorpay
- Check webhook secret matches
- Review Edge Function logs
- Test webhook in Razorpay dashboard

## 📚 Documentation

- **[SUBSCRIPTION_SETUP.md](SUBSCRIPTION_SETUP.md)** - Complete setup guide
- **[SUBSCRIPTION_TESTING_GUIDE.md](SUBSCRIPTION_TESTING_GUIDE.md)** - Testing scenarios
- **[supabase-schema.sql](supabase-schema.sql)** - Database schema

## 🔑 Environment Variables

### Required for App (.env)
```bash
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXX
```

### Required for Edge Functions (Supabase Secrets)
```bash
RAZORPAY_KEY_ID=rzp_test_XXX
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=whsec_XXX
SUPABASE_URL=auto_set
SUPABASE_SERVICE_ROLE_KEY=auto_set
```

## 🚦 Production Checklist

Before going live:

- [ ] Switch to Razorpay Live Mode
- [ ] Update API keys to live keys
- [ ] Test with real payment (small amount)
- [ ] Configure production webhook
- [ ] Enable email notifications
- [ ] Set up monitoring alerts
- [ ] Review security settings
- [ ] Test on real devices
- [ ] Update privacy policy
- [ ] Enable transaction logging
- [ ] Set up customer support flow

## 💡 Key Features

### For Users
- 💳 Secure payment processing
- 📊 Real-time usage tracking
- 🔄 Easy plan upgrades
- 📱 Mobile-optimized checkout
- 💰 Transparent pricing
- 🔐 Secure data handling

### For Developers
- 🎯 Type-safe TypeScript
- 🔌 Modular architecture
- 📝 Comprehensive error handling
- 🧪 Easy to test
- 📚 Well documented
- 🔧 Easy to maintain

## 🎨 UI Components

All screens follow Material Design principles:

- **Gradient cards** for plan tiers
- **Progress bars** for usage visualization
- **Status badges** for subscription state
- **Loading states** for async operations
- **Error handling** with user-friendly messages
- **Responsive design** for all screen sizes

## 📞 Support

For issues or questions:

- Check [Troubleshooting](#troubleshooting) section
- Review [SUBSCRIPTION_SETUP.md](SUBSCRIPTION_SETUP.md)
- Check Supabase logs: `supabase functions logs`
- Review Razorpay Dashboard for payment issues
- Contact Razorpay Support: support@razorpay.com

## 🎯 Next Steps

After basic setup:

1. **Customize Plans**: Update pricing/features in database
2. **Add Analytics**: Integrate analytics tracking
3. **Email Notifications**: Set up email on subscription events
4. **Promotional Codes**: Implement discount codes
5. **Referral System**: Add referral rewards
6. **Admin Dashboard**: Build subscription analytics dashboard

## 📦 File Structure

```
muscle-ai/
├── src/
│   ├── screens/
│   │   ├── SubscriptionPlansScreen.tsx    # Plan selection
│   │   ├── PaymentScreen.tsx              # Payment processing
│   │   └── ManageSubscriptionScreen.tsx   # Subscription management
│   ├── services/
│   │   └── subscriptionService.ts         # API service layer
│   └── types/
│       └── subscription.ts                # TypeScript types
├── supabase/
│   └── functions/
│       ├── create-subscription/
│       ├── verify-payment/
│       ├── cancel-subscription/
│       └── webhook-razorpay/
├── supabase-schema.sql                    # Database schema
├── SUBSCRIPTION_SETUP.md                  # Setup guide
├── SUBSCRIPTION_TESTING_GUIDE.md          # Testing guide
└── .env                                   # Environment variables
```

## 🎉 Success!

You now have a production-ready subscription system with:
- ✅ Secure payment processing
- ✅ Automatic usage tracking
- ✅ Subscription management
- ✅ Webhook automation
- ✅ Beautiful UI
- ✅ Comprehensive error handling

## 📝 License

This subscription system is part of Muscle AI application.

---

**Built with** ❤️ **using React Native, Supabase, and Razorpay**

**Last Updated**: 2025-10-01
**Version**: 1.0.0
