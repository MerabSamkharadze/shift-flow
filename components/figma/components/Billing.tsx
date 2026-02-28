
import { useState, useEffect } from 'react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Free forever',
    features: ['Up to 5 employees', '1 branch', 'Basic scheduling', 'Email support'],
    limits: { employees: 5, branches: 1, templates: 3 },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    period: '/month',
    popular: true,
    features: ['Up to 50 employees', '5 branches', 'Shift templates', 'Marketplace access', 'Priority support', 'Hours analytics'],
    limits: { employees: 50, branches: 5, templates: 20 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    period: '/month',
    features: ['Unlimited employees', 'Unlimited branches', 'Custom templates', 'API access', 'Dedicated manager', '24/7 phone support', 'Advanced reports'],
    limits: { employees: -1, branches: -1, templates: -1 },
  },
];

const invoices = [
  { id: 'INV-2025-0012', date: 'Jan 15, 2025', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0011', date: 'Dec 15, 2024', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0010', date: 'Nov 15, 2024', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0009', date: 'Oct 15, 2024', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0008', date: 'Sep 15, 2024', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0007', date: 'Aug 15, 2024', amount: 49.00, status: 'paid', plan: 'Professional' },
  { id: 'INV-2024-0006', date: 'Jul 15, 2024', amount: 0, status: 'free', plan: 'Starter' },
  { id: 'INV-2024-0005', date: 'Jun 15, 2024', amount: 0, status: 'free', plan: 'Starter' },
];

const paymentMethod = {
  type: 'Visa',
  last4: '4821',
  expiry: '09/27',
  name: 'Manager Kharatishvili',
};

const currentUsage = {
  employees: 47,
  branches: 3,
  templates: 12,
  hoursTracked: 1847,
};

export default function Billing() {
  const [currentPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('all');

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const annualDiscount = 0.8;
  const getPrice = (base: number) => billingCycle === 'annual' ? Math.round(base * annualDiscount * 12) : base;
  const getPriceLabel = (base: number) => {
    if (base === 0) return 'Free';
    return billingCycle === 'annual' ? `$${getPrice(base)}/yr` : `$${base}/mo`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'all') return true;
    return inv.status === invoiceFilter;
  });

  const usagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const activePlan = plans.find((p) => p.id === currentPlan)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-['Syne'] font-semibold text-[#F0EDE8] mb-1">Billing</h1>
          <p className="text-sm md:text-base text-[#7A94AD]">Manage your plan, usage, and invoices</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-4 md:px-6 py-2.5 bg-[#142236] border border-white/[0.07] hover:border-[#F5A623]/30 text-[#F0EDE8] font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer text-sm"
        >
          <i className="ri-bank-card-line mr-2 text-[#F5A623]"></i>Payment Method
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-vip-crown-line text-lg md:text-xl text-[#F5A623]"></i>
            </div>
            <span className="bg-[#F5A623] text-[#0A1628] text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">Active</span>
          </div>
          <div className="text-lg md:text-xl font-semibold text-[#F0EDE8] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{activePlan.name}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Current Plan</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-lg md:text-xl text-[#4ECBA0]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">$49</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Monthly Cost</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-calendar-check-line text-lg md:text-xl text-[#14B8A6]"></i>
            </div>
          </div>
          <div className="text-lg md:text-xl font-semibold text-[#F0EDE8] mb-1">Feb 15, 2025</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Next Billing Date</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-receipt-line text-lg md:text-xl text-[#F5A623]"></i>
            </div>
          </div>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1">{invoices.filter(i => i.status === 'paid').length}</div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Invoices Paid</div>
        </div>
      </div>

      {/* Current Plan + Usage */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 md:gap-6">
        {/* Plan Details */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">Plan Details</h2>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer text-xs md:text-sm"
            >
              <i className="ri-arrow-up-circle-line mr-1.5"></i>Change Plan
            </button>
          </div>

          <div className="flex items-center gap-4 mb-5 p-4 bg-[#0A1628] rounded-xl border border-white/[0.07]">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <i className="ri-vip-crown-line text-2xl text-[#0A1628]"></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[#F0EDE8]" style={{ fontFamily: 'Syne, sans-serif' }}>Professional</span>
                <span className="bg-[#4ECBA0]/15 text-[#4ECBA0] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">ACTIVE</span>
              </div>
              <p className="text-sm text-[#7A94AD] mt-0.5">Billed monthly · Renews Feb 15, 2025</p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-['JetBrains_Mono'] text-2xl font-semibold text-[#F0EDE8]">$49</div>
              <div className="text-xs text-[#7A94AD]">per month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePlan.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 py-1.5">
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
                  <i className="ri-check-line text-xs text-[#4ECBA0]"></i>
                </div>
                <span className="text-sm text-[#F0EDE8]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-5">Usage This Period</h2>
          <div className="space-y-5">
            {/* Employees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7A94AD]">Employees</span>
                <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{currentUsage.employees} / {activePlan.limits.employees}</span>
              </div>
              <div className="h-2.5 bg-[#0A1628] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${usagePercent(currentUsage.employees, activePlan.limits.employees)}%`,
                    backgroundColor: usagePercent(currentUsage.employees, activePlan.limits.employees) > 85 ? '#E8604C' : '#F5A623',
                  }}
                ></div>
              </div>
              {usagePercent(currentUsage.employees, activePlan.limits.employees) > 85 && (
                <p className="text-[10px] text-[#E8604C] mt-1 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>Approaching limit — consider upgrading
                </p>
              )}
            </div>

            {/* Branches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7A94AD]">Branches</span>
                <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{currentUsage.branches} / {activePlan.limits.branches}</span>
              </div>
              <div className="h-2.5 bg-[#0A1628] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#14B8A6] transition-all duration-700 ease-out"
                  style={{ width: `${usagePercent(currentUsage.branches, activePlan.limits.branches)}%` }}
                ></div>
              </div>
            </div>

            {/* Templates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7A94AD]">Shift Templates</span>
                <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{currentUsage.templates} / {activePlan.limits.templates}</span>
              </div>
              <div className="h-2.5 bg-[#0A1628] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4ECBA0] transition-all duration-700 ease-out"
                  style={{ width: `${usagePercent(currentUsage.templates, activePlan.limits.templates)}%` }}
                ></div>
              </div>
            </div>

            {/* Hours Tracked */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7A94AD]">Hours Tracked</span>
                <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{currentUsage.hoursTracked.toLocaleString()}h</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#4ECBA0]/15 text-[#4ECBA0] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Unlimited</span>
                <span className="text-[10px] text-[#7A94AD]">No cap on this plan</span>
              </div>
            </div>
          </div>

          {/* Payment Method Mini */}
          <div className="mt-6 pt-5 border-t border-white/[0.07]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A1628] border border-white/[0.07] flex items-center justify-center">
                  <i className="ri-visa-line text-xl text-[#F0EDE8]"></i>
                </div>
                <div>
                  <div className="text-sm font-medium text-[#F0EDE8]">Visa •••• {paymentMethod.last4}</div>
                  <div className="text-xs text-[#7A94AD]">Expires {paymentMethod.expiry}</div>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs text-[#F5A623] hover:text-[#E09415] transition-colors cursor-pointer whitespace-nowrap"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">Invoice History</h2>
          <div className="flex gap-2">
            {['all', 'paid', 'free'].map((f) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  invoiceFilter === f
                    ? 'bg-[#F5A623] text-[#0A1628]'
                    : 'bg-[#0A1628] text-[#7A94AD] hover:text-[#F0EDE8] border border-white/[0.07]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Free'}
              </button>
            ))}
          </div>
        </div>

        {/* Table — scrollable on mobile */}
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">Invoice</th>
                <th className="text-left text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">Date</th>
                <th className="text-left text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">Plan</th>
                <th className="text-right text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">Amount</th>
                <th className="text-center text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">Status</th>
                <th className="text-right text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.04}s both` }}
                >
                  <td className="py-3.5 pr-4">
                    <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{inv.id}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-sm text-[#7A94AD]">{inv.date}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="px-2 py-0.5 bg-[#F5A623]/10 text-[#F5A623] text-xs rounded-full whitespace-nowrap">{inv.plan}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <span className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">
                      {inv.amount === 0 ? '—' : `$${inv.amount.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                      inv.status === 'paid'
                        ? 'bg-[#4ECBA0]/15 text-[#4ECBA0]'
                        : 'bg-[#7A94AD]/15 text-[#7A94AD]'
                    }`}>
                      <i className={inv.status === 'paid' ? 'ri-check-line' : 'ri-subtract-line'}></i>
                      {inv.status === 'paid' ? 'Paid' : 'Free'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {inv.status === 'paid' && (
                      <button
                        onClick={() => toast(`Downloading ${inv.id}...`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5A623]/10 text-[#7A94AD] hover:text-[#F5A623] transition-colors cursor-pointer"
                      >
                        <i className="ri-download-line text-sm"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-10 text-[#7A94AD] text-sm">No invoices match this filter.</div>
        )}
      </div>

      {/* Upgrade / Change Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}></div>
          <div className="relative w-full max-w-3xl bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div>
                <h2 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Change Plan</h2>
                <p className="text-xs text-[#7A94AD]">Select the plan that fits your team</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer">
                <i className="ri-close-line text-lg md:text-xl"></i>
              </button>
            </div>

            <div className="px-5 md:px-6 py-5">
              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className={`text-sm ${billingCycle === 'monthly' ? 'text-[#F0EDE8]' : 'text-[#7A94AD]'}`}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: billingCycle === 'annual' ? '#F5A623' : '#0A1628' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                    style={{ left: billingCycle === 'annual' ? '28px' : '4px' }}
                  ></div>
                </button>
                <span className={`text-sm ${billingCycle === 'annual' ? 'text-[#F0EDE8]' : 'text-[#7A94AD]'}`}>Annual</span>
                {billingCycle === 'annual' && (
                  <span className="bg-[#4ECBA0]/15 text-[#4ECBA0] text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Save 20%</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  const isSelected = plan.id === selectedPlan;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                      className={`relative rounded-xl p-5 border transition-all duration-200 ${
                        isCurrent
                          ? 'border-[#F5A623]/40 bg-[#F5A623]/5'
                          : isSelected
                          ? 'border-[#4ECBA0]/40 bg-[#4ECBA0]/5 scale-[1.02]'
                          : 'border-white/[0.07] bg-[#0A1628] hover:border-white/[0.15] cursor-pointer'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-[#0A1628] text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">POPULAR</span>
                      )}
                      <div className="text-center mb-4">
                        <h3 className="text-base font-semibold text-[#F0EDE8] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.name}</h3>
                        <div className="font-['JetBrains_Mono'] text-2xl font-bold text-[#F0EDE8]">
                          {getPriceLabel(plan.price)}
                        </div>
                        {plan.price > 0 && billingCycle === 'annual' && (
                          <div className="text-[10px] text-[#7A94AD] mt-0.5">${Math.round(plan.price * annualDiscount)}/mo billed annually</div>
                        )}
                      </div>
                      <div className="space-y-2 mb-5">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <i className="ri-check-line text-xs text-[#4ECBA0]"></i>
                            <span className="text-xs text-[#F0EDE8]">{f}</span>
                          </div>
                        ))}
                      </div>
                      {isCurrent ? (
                        <div className="text-center text-xs text-[#F5A623] font-medium py-2">Current Plan</div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); }}
                          className={`w-full py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                            isSelected
                              ? 'bg-[#4ECBA0] text-[#0A1628]'
                              : 'bg-[#142236] border border-white/[0.07] text-[#F0EDE8] hover:border-[#F5A623]/30'
                          }`}
                        >
                          {isSelected ? 'Selected' : plan.price > activePlan.price ? 'Upgrade' : plan.price === 0 ? 'Downgrade' : 'Select'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button onClick={() => setShowUpgradeModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={() => {
                  if (selectedPlan && selectedPlan !== currentPlan) {
                    toast(`Plan change to ${plans.find(p => p.id === selectedPlan)?.name} requested`);
                    setShowUpgradeModal(false);
                    setSelectedPlan('');
                  }
                }}
                disabled={!selectedPlan || selectedPlan === currentPlan}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedPlan && selectedPlan !== currentPlan
                    ? 'bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]'
                    : 'bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed'
                }`}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'modalBgIn 0.2s ease-out both' }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.2s ease-out both' }}>
            <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-bank-card-line text-[#F5A623] text-base md:text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-['Syne'] font-semibold text-[#F0EDE8]">Payment Method</h2>
                  <p className="text-xs text-[#7A94AD]">Your saved card details</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors cursor-pointer">
                <i className="ri-close-line text-lg md:text-xl"></i>
              </button>
            </div>

            <div className="px-5 md:px-6 py-5 space-y-5">
              {/* Card visual */}
              <div className="relative bg-gradient-to-br from-[#1A2E45] to-[#0D1B2A] rounded-xl p-5 border border-white/[0.07] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center justify-between mb-8">
                  <i className="ri-visa-line text-3xl text-[#F0EDE8]"></i>
                  <i className="ri-wifi-line text-lg text-[#7A94AD] rotate-90"></i>
                </div>
                <div className="font-['JetBrains_Mono'] text-lg text-[#F0EDE8] tracking-widest mb-4">
                  •••• •••• •••• {paymentMethod.last4}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#7A94AD] uppercase tracking-wider mb-0.5">Card Holder</div>
                    <div className="text-sm text-[#F0EDE8]">{paymentMethod.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#7A94AD] uppercase tracking-wider mb-0.5">Expires</div>
                    <div className="text-sm font-['JetBrains_Mono'] text-[#F0EDE8]">{paymentMethod.expiry}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg border border-white/[0.07]">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
                  <i className="ri-shield-check-line text-sm text-[#4ECBA0]"></i>
                </div>
                <p className="text-xs text-[#7A94AD]">Your payment information is encrypted and securely stored. We never store your full card number.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 md:px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
              <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors whitespace-nowrap cursor-pointer">Close</button>
              <button
                onClick={() => { toast('Card update feature coming soon'); setShowPaymentModal(false); }}
                className="px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-edit-line mr-1.5"></i>Update Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border border-[#4ECBA0]/30 rounded-xl shadow-2xl max-w-[calc(100vw-2rem)]"
          style={{ animation: 'toastIn 0.3s ease-out both' }}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
            <i className="ri-check-line text-[#4ECBA0]"></i>
          </div>
          <span className="text-xs md:text-sm text-[#F0EDE8]">{toastMessage}</span>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalBgIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
