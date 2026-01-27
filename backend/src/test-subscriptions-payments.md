# Subscription & Payment Testing Guide
**Week 11-12: Manual Testing Guide**

This guide helps you test the subscription and payment features.

---

## Prerequisites

1. **Razorpay Account Setup**
   - Sign up at https://razorpay.com/
   - Get Test API Keys
   - Configure webhook

2. **Environment Configuration**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-test-secret
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   ```

3. **Backend Running**
   ```bash
   npm run dev
   ```

4. **Authentication Token**
   ```bash
   # Login first
   POST http://localhost:5000/api/auth/login
   {
     "email": "test@example.com",
     "password": "password"
   }
   # Save the token from response
   ```

---

## Test Flow

### 1. Get Available Plans

```bash
GET http://localhost:5000/api/subscriptions/plans
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "trial",
      "name": "Free Trial",
      "price": 0,
      "limits": { "invoicesPerMonth": 10 }
    },
    {
      "id": "starter",
      "name": "Starter Plan",
      "price": 999,
      "limits": { "invoicesPerMonth": 100 }
    }
    // ... more plans
  ]
}
```

---

### 2. Check Current Subscription Status

```bash
GET http://localhost:5000/api/subscriptions/status
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "success": true,
  "subscription": {
    "planId": "trial",
    "planName": "Free Trial",
    "status": "active",
    "validUntil": "2026-02-10T...",
    "isActive": true
  },
  "usage": {
    "invoices": {
      "current": 5,
      "limit": 10,
      "remaining": 5,
      "exceeded": false
    }
  }
}
```

---

### 3. Get Plan Recommendation

```bash
GET http://localhost:5000/api/subscriptions/recommendation
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "success": true,
  "recommended": {
    "planId": "starter",
    "planName": "Starter Plan",
    "price": 999,
    "reason": "Based on your current usage patterns"
  },
  "currentUsage": {
    "invoicesPerMonth": 5,
    "purchasesPerMonth": 3
  }
}
```

---

### 4. Create Payment Order

```bash
POST http://localhost:5000/api/payments/create-order
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "planId": "starter",
  "billingCycle": "monthly"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_xxxxxxxxxxxxx",
    "amount": 117900,
    "currency": "INR",
    "receipt": "RCP-20260127-123456",
    "paymentId": "payment-uuid",
    "planDetails": {
      "planId": "starter",
      "planName": "Starter Plan",
      "billingCycle": "monthly",
      "baseAmount": 999,
      "gstAmount": 179.82,
      "totalAmount": 1178.82
    }
  },
  "razorpayKeyId": "rzp_test_xxxxxxxxxxxx"
}
```

---

### 5. Frontend Payment Flow (Razorpay Checkout)

After getting the order details, integrate Razorpay checkout on frontend:

```javascript
const options = {
  key: razorpayKeyId, // From previous response
  amount: orderDetails.amount,
  currency: orderDetails.currency,
  name: 'GST Compliance SaaS',
  description: `${orderDetails.planDetails.planName} - ${orderDetails.planDetails.billingCycle}`,
  order_id: orderDetails.orderId,
  handler: function (response) {
    // Payment successful, verify on backend
    verifyPayment(response);
  },
  prefill: {
    name: 'User Name',
    email: 'user@example.com'
  },
  theme: {
    color: '#2563eb'
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

---

### 6. Verify Payment (After Razorpay Payment)

```bash
POST http://localhost:5000/api/payments/verify
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "razorpayOrderId": "order_xxxxxxxxxxxxx",
  "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
  "razorpaySignature": "signature_from_razorpay"
}
```

**Expected Response:**
```json
{
  "success": true,
  "paymentId": "payment-uuid",
  "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
  "status": "captured",
  "planId": "starter",
  "subscriptionValidUntil": "2026-02-27T...",
  "message": "Payment successful and subscription activated"
}
```

---

### 7. Verify Subscription Activated

```bash
GET http://localhost:5000/api/subscriptions/status
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "subscription": {
    "planId": "starter",
    "planName": "Starter Plan",
    "status": "active",
    "validUntil": "2026-02-27T...",
    "isActive": true
  },
  "usage": {
    "invoices": {
      "current": 0,
      "limit": 100,
      "remaining": 100,
      "exceeded": false
    }
  }
}
```

---

### 8. Check Invoice Limit

```bash
GET http://localhost:5000/api/subscriptions/check-limit/invoices
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "success": true,
  "allowed": true,
  "limit": 100,
  "current": 0,
  "remaining": 100
}
```

---

### 9. Get Payment History

```bash
GET http://localhost:5000/api/payments/history?limit=10
Authorization: Bearer {your-token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "paymentType": "subscription",
      "planId": "starter",
      "amount": "999.00",
      "gstAmount": "179.82",
      "totalAmount": "1178.82",
      "status": "captured",
      "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
      "createdAt": "2026-01-27T..."
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "pages": 1
  }
}
```

---

### 10. Cancel Subscription

```bash
POST http://localhost:5000/api/subscriptions/cancel
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "immediate": false,
  "reason": "Testing cancellation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "status": "cancelled",
  "validUntil": "2026-02-27T...",
  "message": "Subscription will be cancelled on 2026-02-27T..."
}
```

---

## Test Razorpay Test Cards

Use these test cards for payments:

### Successful Payment:
- **Card:** `4111 1111 1111 1111`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Failed Payment:
- **Card:** `4000 0000 0000 0002`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

---

## Webhook Testing

### Step 1: Setup ngrok (for local testing)

```bash
ngrok http 5000
```

Copy the HTTPS URL: `https://xxxx.ngrok.io`

### Step 2: Configure Webhook in Razorpay

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://xxxx.ngrok.io/api/webhooks/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
4. Save webhook secret

### Step 3: Test Webhook

Make a payment and check backend logs for:

```
Webhook event received: payment.captured
Payment successful: pay_xxxxxxxxxxxxx
```

---

## Edge Cases to Test

### 1. Expired Subscription
```bash
# Create invoice when subscription expired
POST http://localhost:5000/api/invoices
# Expected: 403 Forbidden with subscription_expired error
```

### 2. Limit Exceeded
```bash
# Create 101 invoices on Starter plan
# Expected: 403 Forbidden with limit_exceeded error
```

### 3. Invalid Signature
```bash
POST http://localhost:5000/api/payments/verify
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "invalid_signature"
}
# Expected: 400 Bad Request with "Invalid payment signature"
```

### 4. Feature Not Available
```bash
GET http://localhost:5000/api/subscriptions/check-feature/apiAccess
# For Starter plan, expected: { "hasAccess": false }
```

---

## Success Criteria

✅ All plans load correctly  
✅ Can create payment orders  
✅ Razorpay checkout opens  
✅ Payment verification works  
✅ Subscription activates after payment  
✅ Usage limits enforced  
✅ Payment history loads  
✅ Webhooks process correctly  
✅ Cancellation works  
✅ Edge cases handled gracefully

---

## Troubleshooting

### Issue: "Razorpay is not defined"
**Fix:** Install Razorpay SDK: `npm install razorpay`

### Issue: "Invalid API key"
**Fix:** Check `.env` file has correct `RAZORPAY_KEY_ID`

### Issue: "Webhook signature verification failed"
**Fix:** Ensure `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard

### Issue: "Payment record not found"
**Fix:** Ensure order is created before payment

---

**Happy Testing!** 🎉
