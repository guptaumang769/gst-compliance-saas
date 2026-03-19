import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Check,
  Close,
  CreditCard,
  Star,
} from '@mui/icons-material';
import { subscriptionAPI, paymentAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const DEFAULT_PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    description: 'Get started with basic GST compliance',
    price: 0,
    annualPrice: 0,
    billingCycle: 'monthly',
    recommended: false,
    features: [
      { text: 'Up to 10 invoices/month', included: true },
      { text: 'Basic GSTR-1 & GSTR-3B', included: true },
      { text: '5 customers', included: true },
      { text: 'Email support', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
    ],
    limits: { invoices: 10, customers: 5 },
    savings: 0,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    price: 999,
    annualPrice: 9990,
    billingCycle: 'monthly',
    recommended: true,
    features: [
      { text: 'Up to 50 invoices/month', included: true },
      { text: 'Full GSTR-1 & GSTR-3B', included: true },
      { text: '25 customers', included: true },
      { text: 'Email support', included: true },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
    ],
    limits: { invoices: 50, customers: 25 },
    savings: 17,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    price: 2999,
    annualPrice: 29990,
    billingCycle: 'monthly',
    recommended: false,
    features: [
      { text: 'Up to 200 invoices/month', included: true },
      { text: 'Full GST returns + reconciliation', included: true },
      { text: '100 customers', included: true },
      { text: 'Email support', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
    limits: { invoices: 200, customers: 100 },
    savings: 17,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 7999,
    annualPrice: 79990,
    billingCycle: 'monthly',
    recommended: false,
    features: [
      { text: 'Unlimited invoices', included: true },
      { text: 'Full GST suite + dedicated support', included: true },
      { text: 'Unlimited customers', included: true },
      { text: 'Email support', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
    limits: { invoices: -1, customers: -1 },
    savings: 17,
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
};

function PlanCard({ plan, isAnnual, currentPlanId, onUpgrade, processingPlanId }) {
  const displayPrice = isAnnual ? plan.annualPrice : plan.price;
  const isCurrentPlan = currentPlanId === plan.id;
  const isTrial = plan.id === 'trial';
  const canUpgrade = !isCurrentPlan && !isTrial;
  const isDowngrade = getPlanOrder(currentPlanId) > getPlanOrder(plan.id) && !isTrial;
  const buttonLabel = isCurrentPlan ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Upgrade';
  const isProcessing = processingPlanId === plan.id;

  const handleClick = () => {
    if (!canUpgrade || isProcessing) return;
    onUpgrade(plan);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: plan.recommended ? '2px solid' : '1px solid',
        borderColor: plan.recommended ? 'primary.main' : 'divider',
        boxShadow: plan.recommended ? '0 8px 24px rgba(99, 102, 241, 0.2)' : 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {plan.recommended && (
        <Chip
          icon={<Star sx={{ fontSize: 16 }} />}
          label="Recommended"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            fontWeight: 600,
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, pt: plan.recommended ? 5 : 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {plan.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {plan.description}
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography component="span" variant="h4" fontWeight={700} color="primary.main">
            {displayPrice === 0 ? 'Free' : formatCurrency(displayPrice)}
          </Typography>
          {displayPrice > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              /{isAnnual ? 'year' : 'month'}
            </Typography>
          )}
          {isAnnual && plan.savings > 0 && displayPrice > 0 && (
            <Chip
              label={`Save ${plan.savings}%`}
              color="success"
              size="small"
              sx={{ ml: 1, fontWeight: 600 }}
            />
          )}
        </Box>
        <Box sx={{ mb: 3 }}>
          {(Array.isArray(plan.features) ? plan.features : []).map((feature, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                color: feature.included ? 'text.primary' : 'text.disabled',
              }}
            >
              {feature.included ? (
                <Check sx={{ fontSize: 20, color: 'success.main' }} />
              ) : (
                <Close sx={{ fontSize: 20 }} />
              )}
              <Typography variant="body2">{feature.text}</Typography>
            </Box>
          ))}
        </Box>
        <Button
          variant={isCurrentPlan ? 'outlined' : 'contained'}
          fullWidth
          disabled={isCurrentPlan || isProcessing}
          onClick={handleClick}
          sx={{
            mt: 'auto',
            background: canUpgrade && !isProcessing
              ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
              : undefined,
            '&:hover': {
              background: canUpgrade && !isProcessing
                ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                : undefined,
            },
          }}
        >
          {isProcessing ? 'Processing...' : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function getPlanOrder(planId) {
  const order = { trial: 0, starter: 1, professional: 2, enterprise: 3 };
  return order[planId] ?? -1;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, subscriptionRes] = await Promise.allSettled([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrent(),
      ]);

      if (plansRes.status === 'fulfilled') {
        const plansData = plansRes.value.data?.plans || plansRes.value.data;
        if (Array.isArray(plansData) && plansData.length) {
          const hasArrayFeatures = Array.isArray(plansData[0]?.features);
          if (hasArrayFeatures) {
            setPlans(plansData);
          }
        }
      }

      if (subscriptionRes.status === 'fulfilled') {
        const subData = subscriptionRes.value.data?.subscription || subscriptionRes.value.data;
        if (subData) {
          setSubscription(subData);
        }
      } else {
        console.warn('Subscription fetch failed:', subscriptionRes.reason?.message);
      }
    } catch (err) {
      handleApiError(err, 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      const res = await paymentAPI.getAll();
      const paymentsData = res.data?.payments || res.data?.data || res.data || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      handleApiError(err, 'Failed to load payment history');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRazorpayCheckout = async (plan) => {
    try {
      setProcessingPlanId(plan.id);
      const res = await paymentAPI.createOrder({
        planId: plan.id,
        billingCycle: isAnnual ? 'annual' : 'monthly',
      });
      const data = res.data?.data || res.data;
      const razorpayKeyId = res.data?.razorpayKeyId || res.data?.keyId;
      const orderId = data?.orderId || data?.id;

      if (!orderId || !razorpayKeyId) {
        throw new Error('Invalid order response');
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay failed to load');
      }

      const options = {
        key: razorpayKeyId,
        amount: (data.amount || 0) * 100,
        currency: data.currency || 'INR',
        name: 'GST Compliance',
        description: `${plan.name} - ${isAnnual ? 'Annual' : 'Monthly'} plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            handleSuccess('Payment successful! Your subscription has been updated.');
            fetchData();
            fetchPayments();
          } catch (verifyErr) {
            handleApiError(verifyErr, 'Payment verification failed');
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        theme: {
          color: '#6366F1',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => {
        handleApiError(new Error('Payment failed'), 'Payment was not completed');
        setProcessingPlanId(null);
      });
      razorpay.on('payment.cancel', () => {
        setProcessingPlanId(null);
      });
      razorpay.open();
    } catch (err) {
      handleApiError(err, 'Failed to initiate payment');
      setProcessingPlanId(null);
    }
  };

  const currentPlanId = subscription?.planId || subscription?.plan?.id || 'trial';
  const usage = subscription?.usage || {};
  const limits = subscription?.limits || {};

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} align="center">
          Loading subscription...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Subscription & Pricing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your plan and view payment history
        </Typography>
      </Box>

      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Current Subscription
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Plan
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {subscription?.planName || subscription?.plan?.name || 'Trial'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={subscription?.status || 'active'}
                color={subscription?.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Valid Until
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(subscription?.validUntil || subscription?.expiresAt)}
              </Typography>
            </Grid>
          </Grid>
          {(usage.invoicesUsed !== undefined || usage.customersUsed !== undefined) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Usage
              </Typography>
              <Grid container spacing={2}>
                {usage.invoicesUsed !== undefined && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Invoices</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {usage.invoicesUsed} / {limits.invoices === -1 ? '∞' : limits.invoices}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        limits.invoices === -1
                          ? 0
                          : Math.min(100, (usage.invoicesUsed / limits.invoices) * 100)
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                        },
                      }}
                    />
                  </Grid>
                )}
                {usage.customersUsed !== undefined && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Customers</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {usage.customersUsed} / {limits.customers === -1 ? '∞' : limits.customers}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        limits.customers === -1
                          ? 0
                          : Math.min(100, (usage.customersUsed / limits.customers) * 100)
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                        },
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#8B5CF6',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#8B5CF6',
                },
              }}
            />
          }
          label={
            <Typography variant="body1" fontWeight={500}>
              Annual billing (save up to 17%)
            </Typography>
          }
        />
      </Box>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan.id}>
            <PlanCard
              plan={plan}
              isAnnual={isAnnual}
              currentPlanId={currentPlanId}
              onUpgrade={handleRazorpayCheckout}
              processingPlanId={processingPlanId}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Payment History
        </Typography>
        <Card>
          <TableContainer>
            {paymentsLoading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress />
              </Box>
            ) : payments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CreditCard sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No payment history yet
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment, idx) => (
                    <TableRow key={payment.id || idx}>
                      <TableCell>
                        {formatDate(payment.createdAt || payment.date || payment.paidAt)}
                      </TableCell>
                      <TableCell>
                        {payment.description || payment.planName || payment.plan?.name || 'Subscription'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount || payment.amountPaid)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status || 'completed'}
                          color={payment.status === 'failed' ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
