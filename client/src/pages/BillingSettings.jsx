import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Globe,
  Database,
  ShieldCheck,
  Zap,
  Crown,
  ChevronRight,
  Plus,
  Building2,
  MapPin,
  FileText,
  Info
} from 'lucide-react';
import { 
  useGetBillingStatusQuery, 
  useCancelSubscriptionMutation,
  useUpdateBillingDetailsMutation
} from '../redux/slices/organizationApiSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BillingSettings = () => {
  const navigate = useNavigate();
  const { data: statusData, isLoading } = useGetBillingStatusQuery();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();
  const [updateBillingDetails, { isLoading: isUpdatingProfile }] = useUpdateBillingDetailsMutation();
  
  const [profileForm, setProfileForm] = useState({
    companyName: '',
    taxId: '',
    address: ''
  });

  useEffect(() => {
    if (statusData?.data) {
        setProfileForm({
            companyName: statusData.data.companyName || '',
            taxId: statusData.data.taxId || '',
            address: statusData.data.address || ''
        });
    }
  }, [statusData]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
        await updateBillingDetails(profileForm).unwrap();
        toast.success("Billing profile updated successfully");
    } catch (err) {
        toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const billingData = {
    plan: statusData?.data?.plan || 'free',
    status: statusData?.data?.status || 'active',
    billingCycle: statusData?.data?.billingCycle || 'monthly',
    paymentMethod: statusData?.data?.paymentMethod || null,
    expiry: statusData?.data?.expiry || null,
    limits: {
      posts: statusData?.data?.limits?.posts || 0,
      postsUsed: statusData?.data?.limits?.postsUsed || 0,
      accounts: statusData?.data?.limits?.accounts || 0,
      accountsUsed: statusData?.data?.limits?.accountsUsed || 0,
      storage: statusData?.data?.limits?.storage || 0,
      storageUsed: statusData?.data?.limits?.storageUsed || 0
    },
    history: statusData?.data?.history || [],
    taxId: statusData?.data?.taxId || '',
    companyName: statusData?.data?.companyName || '',
    address: statusData?.data?.address || ''
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will keep your features until the end of the current billing cycle.")) return;
    
    try {
        await cancelSubscription().unwrap();
        toast.success("Cancellation processed. Your plan will expire at the end of the period.");
    } catch (error) {
        toast.error(error?.data?.message || "Failed to cancel subscription");
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/billing/invoice/${invoiceId}/download`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const calculatePercent = (used, total) => {
    if (!total || total === 0) return 0;
    return Math.min(Math.round((used / total) * 100), 100);
  };

  const postUsagePercent = calculatePercent(billingData.limits.postsUsed, billingData.limits.posts);
  const storageUsagePercent = calculatePercent(billingData.limits.storageUsed, billingData.limits.storage);
  const isUsageCritical = postUsagePercent > 85 || storageUsagePercent > 85;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4">
      <AnimatePresence>
        {isUsageCritical && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">Usage Limit Warning</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Your organization has used {Math.round(Math.max(postUsagePercent, storageUsagePercent))}% of its current plan resources. Consider upgrading to avoid service interruption.
                    </p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-amber-900 dark:text-amber-100 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={() => navigate('/dashboard/pricing')}
                >
                    Upgrade Now
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Subscription Overview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current Subscription</h3>
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                Cycle ends {billingData.expiry ? new Date(billingData.expiry).toLocaleDateString() : 'N/A'}
            </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Plan Card */}
            <div className="md:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">{billingData.plan}</h2>
                            <Badge className={`${billingData.plan === 'free' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'} border-transparent`}>
                                {billingData.plan === 'free' ? 'Default' : 'Active'}
                            </Badge>
                            {billingData.plan !== 'free' && (
                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200 dark:border-slate-800">
                                    {billingData.billingCycle}ly
                                </Badge>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm max-w-sm">
                            {billingData.plan === 'free' 
                                ? "You are using the standard free tier. Upgrade to unlock automated scheduling and AI features."
                                : `Your organization is currently on the ${billingData.plan} tier. All premium features are active.`}
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        {billingData.plan === 'enterprise' ? <Crown className="w-6 h-6 text-slate-400" /> : <ShieldCheck className="w-6 h-6 text-slate-400" />}
                    </div>
                </div>
                
                <div className="mt-8 flex items-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                        variant="default" 
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-6 font-semibold"
                        onClick={() => navigate('/dashboard/pricing')}
                    >
                        {billingData.plan === 'free' ? 'Upgrade Now' : 'Change Plan'}
                    </Button>

                    {billingData.plan !== 'free' && (
                        <Button 
                            variant="ghost" 
                            className={`text-slate-400 hover:text-red-500 font-medium transition-colors ${billingData.status === 'cancelling' ? 'cursor-default opacity-50' : ''}`}
                            onClick={handleCancel}
                            disabled={isCancelling || billingData.status === 'cancelling'}
                        >
                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {billingData.status === 'cancelling' ? 'Cancellation Pending' : 'Cancel Subscription'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Payment Method</h4>
                    {billingData.paymentMethod ? (
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center text-[8px] text-white font-bold tracking-tighter uppercase">
                                {billingData.paymentMethod.type}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {billingData.paymentMethod.brand} •••• {billingData.paymentMethod.last4}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                                    Expires {billingData.paymentMethod.expMonth}/{billingData.paymentMethod.expYear}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-400 font-medium italic">No payment method on file</p>
                        </div>
                    )}
                </div>
                {billingData.paymentMethod && (
                    <button className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline flex items-center gap-1 mt-6">
                        Update Method <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
      </section>

      {/* 2. Resource Usage */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resource Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { label: "Posts Used", used: billingData.limits.postsUsed, total: billingData.limits.posts, icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Social Accounts", used: billingData.limits.accountsUsed, total: billingData.limits.accounts, icon: <Globe className="w-4 h-4" /> },
                { 
                    label: "Storage Used", 
                    used: (billingData.limits.storageUsed / (1024 * 1024)).toFixed(0), 
                    total: (billingData.limits.storage / (1024 * 1024 * 1024)).toFixed(0), 
                    unit: "GB", 
                    usedUnit: "MB",
                    isStorage: true
                },
            ].map((resource, i) => (
                <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-500">{resource.label}</p>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                            {calculatePercent(resource.used, resource.isStorage ? resource.total * 1024 : resource.total)}%
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{resource.used}</span>
                        <span className="text-xs font-medium text-slate-400">/ {resource.total}{resource.unit || ''}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${calculatePercent(resource.used, resource.isStorage ? resource.total * 1024 : resource.total)}%` }}
                            className="h-full bg-slate-900 dark:bg-slate-200"
                        />
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 3. Tax Profile & Billing Details */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tax Profile & Billing Details</h3>
            <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 dark:border-slate-800">
                Official Invoicing
            </Badge>
        </div>
        
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Company Name
                        </Label>
                        <Input 
                            id="companyName"
                            placeholder="e.g. Acme Corp"
                            value={profileForm.companyName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, companyName: e.target.value }))}
                            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="taxId" className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Tax / GST ID
                        </Label>
                        <Input 
                            id="taxId"
                            placeholder="e.g. GSTIN 29AAAAA0000A1Z5"
                            value={profileForm.taxId}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, taxId: e.target.value }))}
                            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Billing Address
                    </Label>
                    <Input 
                        id="address"
                        placeholder="Suite 404, Tech Plaza, California, USA"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-indigo-500"
                    />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium italic">These details will appear on your future PDF invoices.</span>
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-indigo-500/20"
                    >
                        {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
      </section>

      {/* 4. Billing History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Invoices & Receipts</h3>
            <button className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline">Download all (CSV)</button>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4 text-right">Download</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {billingData.history.map((invoice) => (
                            <tr key={invoice.id} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium">{new Date(invoice.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-xs opacity-60">{invoice.id}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{invoice.amount}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDownload(invoice.id)}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {billingData.history.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <AlertCircle className="w-6 h-6" />
                                        <p className="text-xs font-medium">No billing records available</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </section>

      {/* 4. Help & Support */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 text-slate-400" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Questions about your plan?</p>
                <p className="text-xs text-slate-500">Our billing experts are available to help with quotas or custom pricing.</p>
            </div>
        </div>
        <Button variant="outline" className="rounded-lg font-semibold px-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            Contact Support
        </Button>
      </div>
    </div>
  );
};

export default BillingSettings;
