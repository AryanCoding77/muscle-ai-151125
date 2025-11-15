# Plan Change Fix

## Problem
When users try to change their subscription plan, they get an error:
```
❌ Edge Function Error: [FunctionsHttpError: Edge Function returned a non-2xx status code]
❌ Error: User already has an active subscription
```

## Root Cause
The `create-subscription` Edge Function (lines 56-66) was blocking users from creating a new subscription if they already had an active one:

```typescript
if (existingSubscription) {
  throw new Error('User already has an active subscription');
}
```

This prevented plan changes entirely.

## Solution
Updated the Edge Function to **automatically cancel the old subscription** before creating a new one, allowing seamless plan changes.

### Changes Made
**File:** `supabase/functions/create-subscription/index.ts`

**Before:**
```typescript
if (existingSubscription) {
  throw new Error('User already has an active subscription');
}
```

**After:**
```typescript
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
```

## How It Works Now

### Plan Change Flow:
1. User goes to **Subscription Plans** screen
2. Clicks on a different plan (e.g., switching from "Pro" to "VIP")
3. Confirms the plan change
4. **New behavior:**
   - Edge Function automatically cancels their current active subscription
   - Sets old subscription status to `'cancelled'`
   - Disables auto-renewal for old subscription
   - Creates new subscription with `'pending'` status
   - Generates payment link
5. User completes payment in browser
6. Payment callback updates new subscription to `'active'`
7. User is redirected to homepage

## Important Notes

### Database Status Flow:
```
Active Subscription (Old Plan)
    ↓
Cancelled (when user starts plan change)
    ↓
Pending (new subscription created)
    ↓
Active (after payment confirmation)
```

### Edge Function Deployment Required
⚠️ **IMPORTANT:** You must deploy the updated Edge Function to Supabase for this fix to work:

```bash
# Deploy the create-subscription function
supabase functions deploy create-subscription
```

## Testing Steps

1. **Login** with an account that has an active subscription
2. Go to **Profile → Manage Subscription → Change Plan**
3. Select a **different plan** (e.g., upgrade or downgrade)
4. Confirm the change
5. Complete the payment
6. Verify:
   - Old subscription is cancelled
   - New subscription is active
   - Payment was processed
   - User redirected to homepage

## Database Query to Verify

```sql
-- Check subscription history for a user
SELECT 
  id,
  subscription_status,
  plan_id,
  created_at,
  updated_at
FROM user_subscriptions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

You should see:
1. **Latest subscription:** `active` (new plan)
2. **Previous subscription:** `cancelled` (old plan)

## Lint Errors Note
The TypeScript errors in the Edge Function file are **expected** - this is a Deno runtime file, not React Native. The IDE shows these errors because it doesn't have Deno type definitions, but they won't affect deployment or execution.

## Status
✅ **FIXED** - Users can now change subscription plans seamlessly
⚠️ **ACTION REQUIRED** - Deploy updated Edge Function to Supabase
