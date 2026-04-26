import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Crown, Loader2, CreditCard, Globe, Info } from 'lucide-react';
import { 
  useCreateStripeCheckoutMutation, 
  useCreateRazorpayOrderMutation, 
  useVerifyRazorpayPaymentMutation,
  useGetBillingStatusQuery
} from '../redux/slices/organizationApiSlice';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const plans = [
  {
    name: 'Free',
    id: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for individual creators and small experimental accounts.',
    icon: <Zap className="w-5 h-5 text-slate-400" />,
    features: ['10 Posts / mo', '3 Social Accounts', '500MB Media Storage', 'Manual Posting'],
    highlight: false,
  },
  {
    name: 'Professional',
    id: 'pro',
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: 'Advanced automation and team features for growing brands.',
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    features: ['100 Posts / mo', '10 Social Accounts', '10GB Media Storage', 'Auto Scheduling', 'AI Caption Studio'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: 'Scalable solutions for high-volume agencies and global teams.',
    icon: <Crown className="w-5 h-5 text-amber-600" />,
    features: ['5,000 Posts / mo', '50 Social Accounts', '100GB Media Storage', 'Priority Support', 'Team Workflows'],
    highlight: false,
  },
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { data: statusData } = useGetBillingStatusQuery();
  const currentPlan = statusData?.data?.plan || 'free';

  const [createStripeCheckout, { isLoading: isStripeLoading }] = useCreateStripeCheckoutMutation();
  const [createRazorpayOrder, { isLoading: isRazorpayLoading }] = useCreateRazorpayOrderMutation();
  const [verifyRazorpayPayment] = useVerifyRazorpayPaymentMutation();

  const handleUpgradeStripe = async (planName) => {
    if (planName === 'Free') return;
    try {
      const result = await createStripeCheckout({
        planName: planName.toLowerCase(),
        billingCycle
      }).unwrap();
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      toast.error(error?.data?.message || "Stripe payment initiation failed");
    }
  };

  const handleUpgradeRazorpay = async (planName) => {
    if (planName === 'Free') return;
    try {
      const result = await createRazorpayOrder({
        planName: planName.toLowerCase(),
        billingCycle
      }).unwrap();
      const { orderId, amount, currency, keyId, orgName, userEmail, userName } = result.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "10Sight Social",
        description: `Upgrade to ${planName} Plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: planName.toLowerCase()
            }).unwrap();
            toast.success(`Welcome to ${planName} Plan!`);
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: userName, email: userEmail },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error?.data?.message || "Razorpay initiation failed");
    }
  };

  return (
    <div className="py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Simple, Transparent Pricing
        </h2>
        <p className="text-slate-500 text-lg leading-relaxed">
          Scale your social presence with predictable costs. No hidden fees, just pure growth.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
            <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full relative p-1 transition-colors"
            >
                <div className={`w-4 h-4 bg-indigo-600 rounded-full transition-transform duration-200 shadow-sm ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Yearly <Badge variant="secondary" className="ml-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none text-[10px] py-0 px-1.5 font-bold italic">Save 20%</Badge>
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => {
          const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          
          return (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-200 ${
                plan.highlight
                  ? 'bg-white dark:bg-slate-950 border-indigo-600 dark:border-indigo-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                          Most Popular
                      </Badge>
                  </div>
              )}

              {currentPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest">
                          Current Plan
                      </Badge>
                  </div>
              )}

              <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50`}>
                          {plan.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">
                          {plan.description}
                      </p>
                  </div>

                  <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">${displayPrice}</span>
                          <span className="text-sm font-semibold text-slate-400">/mo</span>
                      </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Includes:</p>
                      {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3">
                              <div className="mt-1 w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="mt-10 space-y-3">
                  <Button
                      onClick={() => handleUpgradeRazorpay(plan.name)}
                      disabled={
                          plan.id === 'free' || 
                          isRazorpayLoading || 
                          currentPlan === plan.id ||
                          (currentPlan === 'enterprise' && plan.id === 'pro')
                      }
                      className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          currentPlan === plan.id
                          ? 'bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-default border border-slate-200 dark:border-slate-800'
                          : (currentPlan === 'enterprise' && plan.id === 'pro')
                          ? 'bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                  >
                      {isRazorpayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       currentPlan === plan.id ? 'Active Subscription' : 
                       (currentPlan === 'enterprise' && plan.id === 'pro') ? 'Already Subscribed' :
                       <><CreditCard className="w-4 h-4" /> Pay with Razorpay</>}
                  </Button>

                  <Button
                      variant="outline"
                      onClick={() => handleUpgradeStripe(plan.name)}
                      disabled={
                          plan.id === 'free' || 
                          isStripeLoading || 
                          currentPlan === plan.id ||
                          (currentPlan === 'enterprise' && plan.id === 'pro')
                      }
                      className={`w-full h-10 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 ${
                          (plan.id === 'free' || currentPlan === plan.id || (currentPlan === 'enterprise' && plan.id === 'pro')) ? 'hidden' : ''
                      }`}
                  >
                      {isStripeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Globe className="w-3 h-3" /> Pay with Stripe</>}
                  </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 pt-12">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
            <Info className="w-4 h-4 text-slate-400" />
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                Secure Payments via Razorpay & Stripe
            </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
