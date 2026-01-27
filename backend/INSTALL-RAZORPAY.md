# Install Razorpay Dependencies

Run this command in the `backend` directory:

```bash
npm install razorpay
```

## Package Details:

### razorpay
- **Purpose:** Accept payments in India
- **Version:** Latest stable
- **Docs:** https://razorpay.com/docs/api/

## Environment Variables to Add:

Add these to your `.env` file:

```env
# Razorpay Configuration (Week 11-12)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

## Get Razorpay Credentials:

### Step 1: Create Razorpay Account
1. Go to https://razorpay.com/
2. Sign up for a free account
3. Complete KYC (for production)

### Step 2: Get API Keys
1. Dashboard → Settings → API Keys
2. Click "Generate Test Keys" (or Live Keys for production)
3. Copy **Key ID** and **Key Secret**

### Step 3: Generate Webhook Secret
1. Dashboard → Settings → Webhooks
2. Create webhook URL: `https://your-domain.com/api/webhooks/razorpay`
3. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`
4. Copy **Webhook Secret**

## Test Mode vs Live Mode:

### Test Mode (Development):
- Use **Test Keys** (`rzp_test_xxx`)
- Use test cards (no real money)
- Test card: `4111 1111 1111 1111`, any CVV, future expiry

### Live Mode (Production):
- Use **Live Keys** (`rzp_live_xxx`)
- Complete KYC verification
- Real transactions (actual money)

## Important Notes:

1. **Never commit `.env` file to Git**
2. **Keep API keys secret**
3. **Use test mode during development**
4. **Test webhook handling thoroughly**
5. **Handle payment failures gracefully**
