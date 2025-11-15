# 🚀 Quick Start - Muscle AI Subscription System

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Configure Razorpay (2 min)
1. Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. Get test API keys from Settings → API Keys
3. Update `.env`:
```bash
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
```

### Step 3: Setup Database (1 min)
1. Open [Supabase SQL Editor](https://app.supabase.com)
2. Copy entire `supabase-schema.sql`
3. Paste and Execute ✅

### Step 4: Deploy Functions (1 min)
```bash
# Login
supabase login

# Set secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXX
supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_XXX

# Deploy
supabase functions deploy create-subscription
supabase functions deploy verify-payment
supabase functions deploy cancel-subscription
supabase functions deploy webhook-razorpay --no-verify-jwt
```

### Step 5: Test! (30 sec)
```bash
npm start
```

Navigate: **Profile → View Plans → Select Plan → Pay**

**Test Card**: `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/25`

---

## 🎯 What You Get

### 3 Subscription Plans
- **Basic**: $4/mo - 5 analyses
- **Pro**: $7/mo - 20 analyses  
- **VIP**: $14/mo - 50 analyses

### Complete Features
✅ Secure payment processing  
✅ Automatic usage tracking  
✅ Subscription management  
✅ Plan upgrades/cancellations  
✅ Payment history  
✅ Beautiful UI  

---

## 📱 User Flow

```
1. Open App
2. Login/Register
3. Profile Tab
4. "View Plans" button
5. Select a plan
6. "Choose Plan"
7. Enter test card
8. Pay
9. ✅ Subscribed!
```

---

## 🧪 Test Cards

**Success**: `4111 1111 1111 1111`  
**Fail**: `4000 0000 0000 0002`

---

## 📚 Documentation

- **[SUBSCRIPTION_README.md](SUBSCRIPTION_README.md)** - Overview
- **[SUBSCRIPTION_SETUP.md](SUBSCRIPTION_SETUP.md)** - Detailed setup
- **[SUBSCRIPTION_TESTING_GUIDE.md](SUBSCRIPTION_TESTING_GUIDE.md)** - Testing
- **[SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md](SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md)** - What was built

---

## 🆘 Troubleshooting

### Payment doesn't work?
- Check Razorpay key in `.env`
- Verify Edge Functions deployed
- Check console for errors

### Subscription not showing?
- Verify database schema ran successfully
- Check authentication
- Review API calls in network tab

### Need help?
Read **[SUBSCRIPTION_SETUP.md](SUBSCRIPTION_SETUP.md)** section "Troubleshooting"

---

## 🎉 You're Done!

Your subscription system is ready to use!

**Next**: Test all 3 plans, try upgrades, test cancellation

**Production**: Switch Razorpay to live mode when ready

---

**Questions?** Check the comprehensive guides in the project root.

**Ready to earn?** 💰 Launch your subscription app!
