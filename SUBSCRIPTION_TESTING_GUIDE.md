# Subscription System Testing Guide

Comprehensive testing guide for the Muscle AI subscription system with Razorpay integration.

## Quick Start Testing

### 1. Basic Subscription Flow Test

```bash
# Start the app
npm start

# Navigate through:
1. Login/Register
2. Profile → Subscription Plans
3. Select "Basic Plan"
4. Complete payment with test card
5. Verify subscription appears in Profile
```

### 2. Test Card Numbers

**Always Successful:**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
```

**Always Fails - Insufficient Funds:**
```
Card Number: 4000 0000 0000 9995
CVV: 123
Expiry: 12/25
```

**Always Fails - Card Declined:**
```
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

---

## Detailed Test Scenarios

### Scenario 1: New User Subscription

**Objective**: Verify new user can subscribe successfully

**Steps**:
1. Create new user account
2. Navigate to Subscription Plans
3. Select "Pro Plan" ($7/month)
4. Click "Choose Plan"
5. Review payment details
6. Click "Pay $7"
7. Complete Razorpay checkout with test card
8. Verify success message
9. Return to home screen

**Expected Results**:
- ✅ Payment completes successfully
- ✅ Subscription shows as "Active"
- ✅ Usage counter shows 0/20
- ✅ Analysis feature is unlocked
- ✅ Payment appears in transaction history

**Database Verification**:
```sql
-- Check subscription created
SELECT * FROM user_subscriptions 
WHERE user_id = 'USER_ID' 
AND subscription_status = 'active';

-- Check payment recorded
SELECT * FROM payment_transactions 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC LIMIT 1;
```

---

### Scenario 2: Usage Tracking

**Objective**: Verify usage counter works correctly

**Steps**:
1. User with active subscription (Basic - 5 analyses)
2. Perform analysis #1
3. Check remaining analyses (should be 4)
4. Perform analyses #2-5
5. Check remaining analyses (should be 0)
6. Attempt analysis #6

**Expected Results**:
- ✅ Counter decrements after each analysis
- ✅ Usage shows correctly in subscription details
- ✅ At limit, show "upgrade plan" message
- ✅ Database tracks each usage event

**API Test**:
```typescript
// Test can_user_analyze function
const { data } = await supabase.rpc('can_user_analyze');
console.log('Can analyze:', data[0].can_analyze);
console.log('Remaining:', data[0].analyses_remaining);

// Test increment counter
const result = await supabase.rpc('increment_usage_counter', {
  p_analysis_result_id: 'some-uuid'
});
console.log('Usage incremented:', result.data.success);
```

---

### Scenario 3: Plan Upgrade

**Objective**: Verify user can upgrade from Basic to Pro

**Steps**:
1. User with Basic subscription (5 analyses)
2. Navigate to "Manage Subscription"
3. Click "Change Plan"
4. Select "Pro Plan" (20 analyses)
5. Complete payment
6. Verify new plan active

**Expected Results**:
- ✅ Old subscription cancelled
- ✅ New subscription created
- ✅ Usage counter resets
- ✅ Prorated billing applied (if applicable)
- ✅ Previous usage history preserved

**Edge Cases**:
- Upgrade mid-cycle (test billing)
- Usage carries over or resets

---

### Scenario 4: Subscription Cancellation

**Objective**: Verify cancellation works correctly

**Steps**:
1. User with active subscription
2. Navigate to "Manage Subscription"
3. Click "Cancel Subscription"
4. Confirm cancellation
5. Verify cancellation confirmed

**Expected Results**:
- ✅ Subscription status = "cancelled"
- ✅ Access continues until cycle end
- ✅ No future charges
- ✅ Cancellation date recorded
- ✅ User notified

**Database Verification**:
```sql
SELECT subscription_status, cancelled_at, current_billing_cycle_end
FROM user_subscriptions
WHERE user_id = 'USER_ID';
```

---

### Scenario 5: Payment Failure

**Objective**: Verify system handles payment failures gracefully

**Steps**:
1. Attempt subscription with failing card (4000 0000 0000 0002)
2. Payment fails in Razorpay
3. Check error handling

**Expected Results**:
- ✅ Clear error message shown
- ✅ No subscription created
- ✅ Failed transaction recorded
- ✅ User can retry
- ✅ Database remains consistent

**Check Logs**:
```bash
# Check Edge Function logs
supabase functions logs create-subscription --tail

# Check for errors
supabase functions logs verify-payment --tail
```

---

### Scenario 6: Webhook Processing

**Objective**: Verify webhooks update subscription correctly

**Test Webhook Events**:

1. **subscription.charged** (monthly renewal)
   - Trigger: Wait for billing cycle or test webhook
   - Expected: Usage counter resets to 0
   - Database: `analyses_used_this_month = 0`

2. **subscription.cancelled** (user cancels)
   - Trigger: Cancel via Razorpay dashboard
   - Expected: Status = cancelled
   - Database: `subscription_status = 'cancelled'`

3. **payment.failed** (card declined)
   - Trigger: Remove payment method or use expired card
   - Expected: Status = past_due
   - Database: `subscription_status = 'past_due'`

**Manual Webhook Testing**:
```bash
# Use Razorpay Dashboard → Webhooks → Test Webhook
# Or use curl:
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook-razorpay \
  -H "x-razorpay-signature: SIGNATURE" \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

---

## Edge Function Testing

### Test create-subscription

```bash
# Test locally
supabase functions serve create-subscription

# Send test request
curl -X POST http://localhost:54321/functions/v1/create-subscription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PLAN_UUID",
    "user_id": "USER_UUID"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "subscription_id": "uuid",
  "razorpay_subscription_id": "sub_xxx",
  "short_url": "https://rzp.io/i/xxx"
}
```

### Test verify-payment

```bash
curl -X POST http://localhost:54321/functions/v1/verify-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_payment_id": "pay_xxx",
    "razorpay_subscription_id": "sub_xxx",
    "razorpay_signature": "generated_signature",
    "user_id": "USER_UUID"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "verified": true,
  "subscription": {
    "id": "uuid",
    "plan_name": "Basic",
    "status": "active"
  }
}
```

---

## Load Testing

### Test Concurrent Subscriptions

```javascript
// test-concurrent.js
async function testConcurrent() {
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      createSubscription(`test-user-${i}`, 'basic-plan-id')
    );
  }
  
  const results = await Promise.all(promises);
  console.log('Success rate:', 
    results.filter(r => r.success).length / results.length
  );
}
```

### Test Usage Counter Race Condition

```javascript
// Test rapid usage increments
async function testRaceCondition() {
  const promises = [];
  
  for (let i = 0; i < 5; i++) {
    promises.push(incrementUsageCounter());
  }
  
  await Promise.all(promises);
  
  // Verify counter is exactly 5, not less due to race condition
  const sub = await getUserSubscriptionDetails();
  assert(sub.analyses_used === 5);
}
```

---

## Security Testing

### Test 1: Signature Verification

**Attack**: Send fake payment success without valid signature

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_payment_id": "pay_fake123",
    "razorpay_subscription_id": "sub_fake456",
    "razorpay_signature": "invalid_signature",
    "user_id": "victim_user_id"
  }'
```

**Expected**: Should fail with "Invalid payment signature"

### Test 2: Unauthorized Access

**Attack**: Try to access another user's subscription

```typescript
// As User A, try to get User B's subscription
const { data, error } = await supabase
  .from('user_subscriptions')
  .select('*')
  .eq('user_id', 'user_b_id'); // Different user

// Expected: RLS should return empty or error
assert(data.length === 0);
```

### Test 3: SQL Injection

**Attack**: Try SQL injection in plan selection

```typescript
const planId = "'; DROP TABLE user_subscriptions; --";
await createSubscription(planId);

// Expected: Parameterized queries prevent injection
```

---

## Performance Testing

### Metrics to Track

1. **API Response Times**
   - create-subscription: < 2s
   - verify-payment: < 1s
   - check usage: < 500ms

2. **Database Query Performance**
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM user_subscriptions 
WHERE user_id = 'xxx' 
AND subscription_status = 'active';

-- Should use index
-- Execution time < 10ms
```

3. **Webhook Processing**
   - Webhook received to DB updated: < 5s
   - Monitor Razorpay webhook logs for delays

---

## Automated Testing Script

```typescript
// test-subscription-flow.ts
import { test, expect } from '@playwright/test';

test('Complete subscription flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:8081');
  await page.fill('[placeholder="Email"]', 'test@example.com');
  await page.fill('[placeholder="Password"]', 'password123');
  await page.click('text=Sign In');
  
  // Navigate to plans
  await page.click('text=Profile');
  await page.click('text=View Plans');
  
  // Select plan
  await page.click('text=Choose Plan >> nth=0'); // Basic plan
  
  // Fill payment details
  await page.fill('[name="card[number]"]', '4111111111111111');
  await page.fill('[name="card[cvv]"]', '123');
  await page.fill('[name="card[expiry]"]', '12/25');
  
  // Submit payment
  await page.click('text=Pay');
  
  // Wait for success
  await expect(page.locator('text=Success')).toBeVisible();
  
  // Verify subscription active
  await page.click('text=Profile');
  await expect(page.locator('text=Active')).toBeVisible();
});
```

---

## Test Checklist

### Before Release

- [ ] All 3 plans can be subscribed to
- [ ] Payment success flow works
- [ ] Payment failure handled gracefully
- [ ] Usage tracking accurate
- [ ] Plan upgrades work
- [ ] Plan downgrades work
- [ ] Cancellation works
- [ ] Webhooks process correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Signatures verified correctly
- [ ] Error messages are user-friendly
- [ ] Loading states work
- [ ] Payment history displays correctly
- [ ] Analytics/usage charts render
- [ ] Email notifications sent (if implemented)
- [ ] Tested on both Android and iOS
- [ ] Tested on different screen sizes
- [ ] Performance acceptable under load
- [ ] Database indexes created
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Razorpay webhooks configured

---

## Monitoring in Production

### Key Metrics to Track

1. **Subscription Metrics**
   - New subscriptions per day
   - Churn rate
   - Plan distribution (Basic/Pro/VIP)
   - Average subscription duration

2. **Payment Metrics**
   - Payment success rate
   - Failed payment reasons
   - Average transaction value
   - Refund rate

3. **Usage Metrics**
   - Average analyses per user
   - Usage vs limit ratio
   - Peak usage times
   - Feature adoption rate

### Monitoring Queries

```sql
-- Daily subscriptions
SELECT DATE(created_at) as date, COUNT(*) as new_subs
FROM user_subscriptions
WHERE subscription_status = 'active'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Payment success rate
SELECT 
  DATE(transaction_date) as date,
  COUNT(*) as total_payments,
  SUM(CASE WHEN payment_status = 'captured' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN payment_status = 'captured' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM payment_transactions
GROUP BY DATE(transaction_date)
ORDER BY date DESC;

-- Usage analysis
SELECT 
  sp.plan_name,
  AVG(us.analyses_used_this_month) as avg_usage,
  sp.monthly_analyses_limit,
  ROUND(100.0 * AVG(us.analyses_used_this_month) / sp.monthly_analyses_limit, 2) as utilization_rate
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.subscription_status = 'active'
GROUP BY sp.plan_name, sp.monthly_analyses_limit;
```

---

## Troubleshooting Common Issues

### Issue: Payment succeeds but subscription not activated

**Debug Steps**:
1. Check Razorpay payment dashboard
2. Check `payment_transactions` table
3. Review `verify-payment` function logs
4. Verify webhook was received
5. Check signature verification

### Issue: Usage counter not incrementing

**Debug Steps**:
1. Check `usage_tracking` table
2. Verify `increment_usage_counter` called
3. Check RLS policies
4. Review function logs

### Issue: Webhook not processing

**Debug Steps**:
1. Check Razorpay webhook logs
2. Verify webhook URL correct
3. Test webhook signature
4. Check function deployment
5. Review CORS settings

---

**Last Updated**: 2025-10-01
**Version**: 1.0.0
